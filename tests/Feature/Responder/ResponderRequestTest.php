<?php

use App\Events\CitizenAssistanceStatusUpdated;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use Illuminate\Support\Facades\Event;

function createAssistanceRequest(string $status = 'rescue'): SafetyCircleMember
{
    $citizen = User::factory()->create(['role' => 'citizen']);
    $circle = SafetyCircle::create([
        'owner_id' => $citizen->id,
        'name' => 'Family',
        'location_name' => 'Pala-o, Iligan City',
        'latitude' => 8.228,
        'longitude' => 124.2452,
    ]);

    return $circle->memberships()->create([
        'user_id' => $citizen->id,
        'relationship' => 'You',
        'safety_status' => $status,
        'response_status' => $status === 'rescue' ? 'responders_dispatched' : 'forwarded_to_lgu',
        'responder_status' => 'pending',
        'checked_in_at' => now(),
    ]);
}

test('responder queue requires responder role', function () {
    $citizen = User::factory()->create(['role' => 'citizen']);

    $this->actingAs($citizen)
        ->get(route('responder.index'))
        ->assertRedirect(route('citizen.home'));
});

test('responder sees current citizen assistance requests', function () {
    $responder = User::factory()->create(['role' => 'responder']);
    $request = createAssistanceRequest();

    $this->actingAs($responder)
        ->get(route('responder.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('responders/index')
            ->has('initialRequests', 1)
            ->where('initialRequests.0.id', $request->id)
            ->where('initialRequests.0.safety_status', 'rescue'));
});

test('responder can accept an assistance request and broadcasts the update', function () {
    Event::fake([CitizenAssistanceStatusUpdated::class]);
    $responder = User::factory()->create(['role' => 'responder']);
    $assistanceRequest = createAssistanceRequest();

    $this->actingAs($responder)
        ->patch(route('responder.requests.update', $assistanceRequest), ['status' => 'accepted'])
        ->assertRedirect();

    expect($assistanceRequest->fresh())
        ->responder_id->toBe($responder->id)
        ->responder_status->toBe('accepted')
        ->accepted_at->not->toBeNull();

    Event::assertDispatched(CitizenAssistanceStatusUpdated::class);
});

test('responder assigned route only shows requests assigned to the current responder', function () {
    $responder = User::factory()->create(['role' => 'responder']);
    $otherResponder = User::factory()->create(['role' => 'responder']);
    $assignedRequest = createAssistanceRequest();
    $otherRequest = createAssistanceRequest();
    $unassignedRequest = createAssistanceRequest();

    $assignedRequest->update([
        'responder_id' => $responder->id,
        'responder_status' => 'accepted',
        'accepted_at' => now(),
    ]);
    $otherRequest->update([
        'responder_id' => $otherResponder->id,
        'responder_status' => 'accepted',
        'accepted_at' => now(),
    ]);

    $this->actingAs($responder)
        ->get(route('responder.assigned'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('responders/index')
            ->where('view', 'assigned')
            ->where('currentResponderId', $responder->id)
            ->has('initialRequests', 1)
            ->where('initialRequests.0.id', $assignedRequest->id)
            ->where('initialRequests.0.responder_id', $responder->id));

    expect($otherRequest->fresh()->responder_id)->toBe($otherResponder->id)
        ->and($unassignedRequest->fresh()->responder_id)->toBeNull();
});

test('citizen check in broadcasts assistance request to responders', function () {
    Event::fake([CitizenAssistanceStatusUpdated::class]);
    $member = createAssistanceRequest('help');
    $citizen = $member->user;

    $this->actingAs($citizen)
        ->patch(route('citizen.check-in'), [
            'status' => 'rescue',
            'assistance_type' => 'Flood rescue',
            'situation' => 'Mataas na ang baha.',
            'priority' => 'KRITIKAL',
        ])
        ->assertRedirect();

    expect($member->fresh())
        ->safety_status->toBe('rescue')
        ->responder_status->toBe('pending')
        ->assistance_type->toBe('Flood rescue')
        ->situation->toBe('Mataas na ang baha.')
        ->priority->toBe('KRITIKAL');

    Event::assertDispatched(CitizenAssistanceStatusUpdated::class);
});
