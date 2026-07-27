<?php

use App\Events\AffectedResidentsChanged;
use App\Events\CitizenAssistanceStatusUpdated;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

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

test('responder transaction updates affected residents through websocket', function () {
    $gcc = User::factory()->create(['role' => 'gcc']);
    $responder = User::factory()->create(['role' => 'responder']);
    $assistanceRequest = createAssistanceRequest();
    $incident = DisasterIncident::create([
        'created_by' => $gcc->id,
        'title' => 'Active Rescue',
        'hazard_type' => 'flood',
        'severity' => 'critical',
        'status' => 'monitoring',
        'latitude' => $assistanceRequest->circle->latitude,
        'longitude' => $assistanceRequest->circle->longitude,
        'radius_meters' => 5000,
        'color' => '#dc2626',
        'location_name' => $assistanceRequest->circle->location_name,
    ]);
    $affectedResident = AffectedResident::create([
        'disaster_incident_id' => $incident->id,
        'safety_circle_member_id' => $assistanceRequest->id,
        'first_name' => $assistanceRequest->user->fname,
        'last_name' => $assistanceRequest->user->lname,
        'birthdate' => null,
        'sex' => 'other',
        'status' => 'possibly_affected',
        'resident_status' => 0,
        'circle_safety_status' => 'rescue',
    ]);

    Event::fake([AffectedResidentsChanged::class, CitizenAssistanceStatusUpdated::class]);

    $this->actingAs($responder)
        ->patch(route('responder.requests.update', $assistanceRequest), ['status' => 'accepted'])
        ->assertRedirect();

    expect($affectedResident->fresh()->resident_status)->toBe(3);
    Event::assertDispatched(
        AffectedResidentsChanged::class,
        fn (AffectedResidentsChanged $event): bool => $event->incidentId === $incident->id
            && $event->affectedResidentId === $affectedResident->id
            && $event->action === 'responder_accepted',
    );

    $this->actingAs($responder)
        ->patch(route('responder.requests.update', $assistanceRequest), ['status' => 'resolved'])
        ->assertRedirect();

    expect($affectedResident->fresh()->status)->toBe('rescued');
    Event::assertDispatched(
        AffectedResidentsChanged::class,
        fn (AffectedResidentsChanged $event): bool => $event->incidentId === $incident->id
            && $event->affectedResidentId === $affectedResident->id
            && $event->action === 'responder_resolved',
    );

    $affectedResident->update(['status' => 'possibly_affected']);

    $this->actingAs($gcc)
        ->get(route('gcc.affected-residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidentGroups.0.residents.0.status', 'rescued'));

    expect($affectedResident->fresh()->status)->toBe('rescued');

    $this->actingAs($gcc)
        ->get(route('gcc.dashboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('responseSummary.urgent_rescue', 0)
            ->where('responseSummary.rescued', 1));
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
