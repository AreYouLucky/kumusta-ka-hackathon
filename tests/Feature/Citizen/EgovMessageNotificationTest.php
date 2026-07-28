<?php

use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.egov_ai.base_url' => 'https://egov-ai.test',
        'services.egov_ai.token' => 'test-hackathon-token',
        'services.egov_ai.category' => 'PH',
        'services.egov_message.enabled' => true,
        'services.egov_message.endpoint' => 'https://egov-message.test/messaging/v1/sms/push',
        'services.egov_message.auth_token' => 'test-message-token',
        'services.egov_message.recipient' => '+639683013603',
    ]);
});

test('submitted emergency report is structured by AI and sent through eGov messaging', function () {
    [$citizen, $circle, $member] = citizenCircleForMessageTest();
    Http::fake([
        'https://egov-ai.test/api/v1/egov/integration/ai_assistant/generate' => Http::response([
            'data' => 'JUAN DELA CRUZ | Medical Assistance | Wounded citizen | CRITICAL | Lat: 14.5261362 | Long: 121.0593401 | Call 911.',
        ]),
        'https://egov-message.test/messaging/v1/sms/push' => Http::response([
            'status' => 'queued',
        ]),
    ]);

    $this->actingAs($citizen)
        ->patch(route('citizen.circles.members.status', [$circle, $member]), [
            'status' => 'rescue',
            'assistance_type' => 'Medical Assistance',
            'situation' => 'The citizen is wounded.',
            'priority' => 'CRITICAL',
        ])
        ->assertRedirect();

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://egov-ai.test/api/v1/egov/integration/ai_assistant/generate'
        && $request->hasHeader('Authorization', 'Bearer test-hackathon-token')
        && $request['category'] === 'PH'
        && str_contains($request['prompt'], 'JUAN DELA CRUZ')
        && str_contains($request['prompt'], 'Latitude: 14.5261362')
        && str_contains($request['prompt'], 'Longitude: 121.0593401'));

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://egov-message.test/messaging/v1/sms/push'
        && $request->hasHeader('X-EMESSAGE-Auth', 'test-message-token')
        && $request['number'] === '+639683013603'
        && $request['message'] === 'JUAN DELA CRUZ | Medical Assistance | Wounded citizen | CRITICAL | Lat: 14.5261362 | Long: 121.0593401 | Call 911.');
});

test('safe status does not send an emergency SMS', function () {
    [$citizen, $circle, $member] = citizenCircleForMessageTest();
    Http::fake();

    $this->actingAs($citizen)
        ->patch(route('citizen.circles.members.status', [$circle, $member]), [
            'status' => 'safe',
        ])
        ->assertRedirect();

    Http::assertNothingSent();
});

test('AI failure uses a safe structured fallback and still sends the emergency SMS', function () {
    [$citizen, $circle, $member] = citizenCircleForMessageTest();
    Http::fake([
        'https://egov-ai.test/api/v1/egov/integration/ai_assistant/generate' => Http::response([], 503),
        'https://egov-message.test/messaging/v1/sms/push' => Http::response(['status' => 'queued']),
    ]);

    $this->actingAs($citizen)
        ->patch(route('citizen.circles.members.status', [$circle, $member]), [
            'status' => 'help',
            'assistance_type' => 'Food assistance',
            'situation' => 'The family has no food.',
            'priority' => 'HIGH',
        ])
        ->assertRedirect();

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://egov-message.test/messaging/v1/sms/push'
        && str_contains($request['message'], 'Citizen: JUAN DELA CRUZ')
        && str_contains($request['message'], 'Assistance: Food assistance')
        && str_contains($request['message'], 'Latitude: 14.5261362')
        && str_contains($request['message'], 'Longitude: 121.0593401'));
});

/**
 * @return array{User, SafetyCircle, SafetyCircleMember}
 */
function citizenCircleForMessageTest(): array
{
    $citizen = User::factory()->create([
        'fname' => 'JUAN',
        'mname' => null,
        'lname' => 'DELA CRUZ',
        'role' => 'citizen',
    ]);
    $circle = SafetyCircle::create([
        'owner_id' => $citizen->id,
        'name' => 'My Family',
        'location_name' => 'Central Bicutan, Taguig City',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
    ]);
    $member = $circle->memberships()->create([
        'user_id' => $citizen->id,
        'relationship' => 'You',
        'safety_status' => 'safe',
        'last_seen_location_name' => 'DOST Main Building',
        'last_seen_latitude' => 14.5261362,
        'last_seen_longitude' => 121.0593401,
        'last_seen_at' => now(),
    ]);

    return [$citizen, $circle, $member];
}
