<?php

use App\Events\AffectedResidentsChanged;
use App\Events\CitizenAssistanceStatusUpdated;
use App\Events\DisasterAlertTriggered;
use App\Events\SafetyCircleMemberStatusUpdated;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Models\Residence;
use App\Models\SafetyCircle;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

test('saving a Central Bicutan disaster immediately resets affected circle members and pushes an alert', function () {
    Event::fake([
        DisasterAlertTriggered::class,
        SafetyCircleMemberStatusUpdated::class,
    ]);

    $gcc = User::factory()->create(['role' => 'GCC']);
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'My Family',
        'location_name' => 'DOST Compound, Central Bicutan, Taguig City',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
    ]);
    $circle->memberships()->createMany([
        [
            'user_id' => $owner->id,
            'relationship' => 'You',
            'safety_status' => 'safe',
            'checked_in_at' => now(),
        ],
        [
            'user_id' => $member->id,
            'relationship' => 'Sibling',
            'safety_status' => 'safe',
            'checked_in_at' => now(),
        ],
    ]);

    $this->actingAs($gcc)
        ->post(route('gcc.incidents.store'), [
            'title' => 'Central Bicutan Earthquake',
            'hazard_type' => 'earthquake',
            'severity' => 'high',
            'latitude' => 14.5253470,
            'longitude' => 121.0596751,
            'radius_meters' => 5000,
            'color' => '#9333ea',
            'location_name' => 'Central Bicutan, Taguig City',
            'description' => 'Strong shaking reported near the DOST Compound.',
        ])
        ->assertRedirect();

    $incident = DisasterIncident::query()->sole();

    expect($incident->status)->toBe('monitoring');

    $circle->memberships->each(function ($membership): void {
        expect($membership->refresh())
            ->safety_status->toBe('no_response')
            ->response_status->toBeNull()
            ->checked_in_at->toBeNull();
    });

    expect(AffectedResident::query()
        ->where('disaster_incident_id', $incident->id)
        ->whereNotNull('safety_circle_member_id')
        ->count())->toBe(2);

    $this->assertDatabaseHas('affected_residents', [
        'disaster_incident_id' => $incident->id,
        'first_name' => $owner->fname,
        'last_name' => $owner->lname,
        'city' => 'Taguig City',
        'barangay' => 'Central Bicutan',
        'resident_status' => 0,
    ]);

    Event::assertDispatched(
        DisasterAlertTriggered::class,
        fn (DisasterAlertTriggered $event): bool => $event->disaster['location'] === 'Central Bicutan, Taguig City'
            && collect($event->userIds)->sort()->values()->all() === collect([$owner->id, $member->id])->sort()->values()->all(),
    );
    Event::assertDispatchedTimes(SafetyCircleMemberStatusUpdated::class, 2);

    $this->actingAs($owner)
        ->get(route('citizen.home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('activeDisaster.id', $incident->id)
            ->where('activeDisaster.location', 'Central Bicutan, Taguig City')
            ->where('circles.0.safeCount', 0)
            ->where('circles.0.notRespondingCount', 2)
            ->where('circles.0.calamityStatus.isAffected', true)
            ->where('circles.0.calamityStatus.title', 'Central Bicutan Earthquake'));

    $this->actingAs($gcc)
        ->get(route('gcc.affected-residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidentGroups.0.affected_count', 2)
            ->has('incidentGroups.0.residents', 2));

    $ownerMembership = $circle->memberships()->where('user_id', $owner->id)->sole();

    $this->actingAs($owner)
        ->patch(route('citizen.circles.members.status', [$circle, $ownerMembership]), [
            'status' => 'help',
            'assistance_type' => 'Food assistance',
            'situation' => 'Wala nang makain ang pamilya.',
            'priority' => 'High priority',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('affected_residents', [
        'disaster_incident_id' => $incident->id,
        'safety_circle_member_id' => $ownerMembership->id,
        'resident_status' => 2,
        'circle_safety_status' => 'help',
        'assistance_type' => 'Food assistance',
        'situation' => 'Wala nang makain ang pamilya.',
        'priority' => 'High priority',
    ]);

    $rescueMembership = $circle->memberships()->where('user_id', $member->id)->sole();

    $this->actingAs($owner)
        ->patch(route('citizen.circles.members.status', [$circle, $rescueMembership]), [
            'status' => 'rescue',
            'assistance_type' => 'Flood rescue',
            'situation' => 'Mataas na ang baha.',
            'priority' => 'KRITIKAL',
        ])
        ->assertRedirect();

    $this->actingAs($gcc)
        ->get(route('gcc.affected-residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidentGroups.0.no_response_count', 0)
            ->where('incidentGroups.0.needs_help_count', 1)
            ->where('incidentGroups.0.urgent_rescue_count', 1)
            ->where('summary.no_response', 0)
            ->where('summary.needs_help', 1)
            ->where('summary.urgent_rescue', 1)
            ->where('incidentGroups.0.residents.0.circle_safety_status', 'rescue')
            ->where('incidentGroups.0.residents.1.circle_safety_status', 'help')
            ->where('incidentGroups.0.residents', fn ($residents): bool => collect($residents)->contains(
                fn (array $resident): bool => $resident['assistance_type'] === 'Flood rescue'
                    && $resident['situation'] === 'Mataas na ang baha.'
                    && $resident['priority'] === 'KRITIKAL'
            )));
});

test('a disaster outside the circle radius does not reset member status', function () {
    Event::fake([
        DisasterAlertTriggered::class,
        SafetyCircleMemberStatusUpdated::class,
    ]);

    $gcc = User::factory()->create(['role' => 'GCC']);
    $owner = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'My Family',
        'location_name' => 'Taguig City',
        'latitude' => 14.5176,
        'longitude' => 121.0509,
    ]);
    $membership = $circle->memberships()->create([
        'user_id' => $owner->id,
        'relationship' => 'You',
        'safety_status' => 'safe',
        'checked_in_at' => now(),
    ]);
    $incident = DisasterIncident::create([
        'created_by' => $gcc->id,
        'title' => 'Quezon City Earthquake',
        'hazard_type' => 'earthquake',
        'severity' => 'high',
        'status' => 'open',
        'latitude' => 14.6760,
        'longitude' => 121.0437,
        'radius_meters' => 1000,
        'color' => '#9333ea',
        'location_name' => 'Quezon City',
    ]);

    $this->actingAs($gcc)
        ->put(route('gcc.incidents.update', $incident), [
            'title' => $incident->title,
            'hazard_type' => $incident->hazard_type,
            'severity' => $incident->severity,
            'status' => 'monitoring',
            'latitude' => $incident->latitude,
            'longitude' => $incident->longitude,
            'radius_meters' => $incident->radius_meters,
            'color' => $incident->color,
            'location_name' => $incident->location_name,
            'description' => null,
        ])
        ->assertRedirect();

    expect($membership->refresh()->safety_status)->toBe('safe');
    Event::assertNotDispatched(DisasterAlertTriggered::class);
    Event::assertNotDispatched(SafetyCircleMemberStatusUpdated::class);

    $this->actingAs($owner)
        ->get(route('citizen.home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('circles.0.calamityStatus.isAffected', false));
});

test('opening affected residents backfills circle members for an existing active disaster', function () {
    $gcc = User::factory()->create(['role' => 'GCC']);
    $owner = User::factory()->create([
        'fname' => 'JUAN',
        'mname' => null,
        'lname' => 'DELA CRUZ',
        'sex' => 'MALE',
        'mobile_number' => '09171234567',
    ]);
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'My Family',
        'location_name' => 'DOST Compound, Central Bicutan, Taguig City',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
    ]);
    $member = $circle->memberships()->create([
        'user_id' => $owner->id,
        'relationship' => 'You',
        'safety_status' => 'help',
    ]);
    $incident = DisasterIncident::create([
        'created_by' => $gcc->id,
        'title' => 'Existing Taguig Flood',
        'hazard_type' => 'flood',
        'severity' => 'high',
        'status' => 'monitoring',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
        'radius_meters' => 5000,
        'color' => '#2563eb',
        'location_name' => 'Central Bicutan, Taguig City',
    ]);

    $this->assertDatabaseMissing('affected_residents', [
        'disaster_incident_id' => $incident->id,
        'safety_circle_member_id' => $member->id,
    ]);

    $this->actingAs($gcc)
        ->get(route('gcc.affected-residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidentGroups.0.affected_count', 1)
            ->where('incidentGroups.0.residents.0.full_name', 'JUAN DELA CRUZ')
            ->where('incidentGroups.0.residents.0.resident_status', 2));

    $this->assertDatabaseHas('affected_residents', [
        'disaster_incident_id' => $incident->id,
        'safety_circle_member_id' => $member->id,
        'resident_status' => 2,
    ]);
});

test('affected residence records with the default status are counted as no response', function () {
    $gcc = User::factory()->create(['role' => 'GCC']);
    $incident = DisasterIncident::create([
        'created_by' => $gcc->id,
        'title' => 'Taguig Earthquake',
        'hazard_type' => 'earthquake',
        'severity' => 'high',
        'status' => 'monitoring',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
        'radius_meters' => 5000,
        'color' => '#9333ea',
        'location_name' => 'Central Bicutan, Taguig City',
    ]);
    $residence = Residence::create([
        'created_by' => $gcc->id,
        'resident_code' => 'RES-NO-RESPONSE',
        'first_name' => 'MARIA',
        'last_name' => 'SANTOS',
        'birthdate' => '1990-01-01',
        'sex' => 'female',
        'city' => 'Taguig City',
        'barangay' => 'Central Bicutan',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
    ]);

    AffectedResident::create([
        'disaster_incident_id' => $incident->id,
        'residence_id' => $residence->id,
        'first_name' => $residence->first_name,
        'last_name' => $residence->last_name,
        'birthdate' => $residence->birthdate,
        'sex' => $residence->sex,
        'status' => 'possibly_affected',
        'resident_status' => 0,
        'circle_safety_status' => null,
    ]);

    $this->actingAs($gcc)
        ->get(route('gcc.affected-residents.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('incidentGroups.0.no_response_count', 1)
            ->where('summary.no_response', 1)
            ->where('incidentGroups.0.residents.0.full_name', 'MARIA SANTOS'));

    $this->actingAs($gcc)
        ->get(route('gcc.dashboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('responseSummary.total', 1)
            ->where('responseSummary.no_response', 1));
});

test('gcc affected resident actions synchronize citizen and responder websocket data', function () {
    Event::fake([
        AffectedResidentsChanged::class,
        CitizenAssistanceStatusUpdated::class,
        SafetyCircleMemberStatusUpdated::class,
    ]);

    $gcc = User::factory()->create(['role' => 'GCC']);
    $citizen = User::factory()->create(['role' => 'citizen']);
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
        'safety_status' => 'help',
        'response_status' => 'forwarded_to_lgu',
        'responder_status' => 'pending',
    ]);
    $incident = DisasterIncident::create([
        'created_by' => $gcc->id,
        'title' => 'Taguig Flood',
        'hazard_type' => 'flood',
        'severity' => 'critical',
        'status' => 'monitoring',
        'latitude' => 14.5253470,
        'longitude' => 121.0596751,
        'radius_meters' => 5000,
        'color' => '#2563eb',
        'location_name' => 'Central Bicutan, Taguig City',
    ]);
    $affectedResident = AffectedResident::create([
        'disaster_incident_id' => $incident->id,
        'safety_circle_member_id' => $member->id,
        'first_name' => $citizen->fname,
        'last_name' => $citizen->lname,
        'birthdate' => null,
        'sex' => 'other',
        'status' => 'possibly_affected',
        'resident_status' => 2,
        'circle_safety_status' => 'help',
    ]);

    $this->actingAs($gcc)
        ->patch(route('gcc.affected-residents.dispatch-responder', $affectedResident))
        ->assertRedirect();

    expect($member->fresh())
        ->safety_status->toBe('rescue')
        ->response_status->toBe('responders_dispatched')
        ->responder_status->toBe('pending');
    expect($affectedResident->fresh())
        ->resident_status->toBe(3)
        ->circle_safety_status->toBe('rescue');

    $this->actingAs($gcc)
        ->patch(route('gcc.affected-residents.mark-safe', $affectedResident))
        ->assertRedirect();

    expect($member->fresh())
        ->safety_status->toBe('safe')
        ->response_status->toBeNull()
        ->responder_status->toBeNull();
    expect($affectedResident->fresh())
        ->resident_status->toBe(1)
        ->circle_safety_status->toBe('safe');

    Event::assertDispatchedTimes(AffectedResidentsChanged::class, 2);
    Event::assertDispatchedTimes(CitizenAssistanceStatusUpdated::class, 2);
    Event::assertDispatchedTimes(SafetyCircleMemberStatusUpdated::class, 2);
});
