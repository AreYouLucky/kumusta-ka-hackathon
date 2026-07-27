<?php

use App\Events\SafetyCircleMemberAdded;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

test('citizen pages require authentication', function () {
    $this->get('/frontend')->assertRedirect(route('citizen.login'));
});

test('citizen home only shows circles visible to the authenticated user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $visibleCircle = SafetyCircle::create([
        'owner_id' => $user->id,
        'name' => 'My Family',
        'location_name' => 'Quezon City',
        'description' => 'Family check-in circle',
        'latitude' => 14.6760,
        'longitude' => 121.0437,
    ]);
    $visibleCircle->memberships()->create([
        'user_id' => $user->id,
        'relationship' => 'You',
        'checked_in_at' => now(),
    ]);

    SafetyCircle::create([
        'owner_id' => $otherUser->id,
        'name' => 'Private Circle',
        'location_name' => 'Manila',
        'latitude' => 14.5995,
        'longitude' => 120.9842,
    ]);

    $this->actingAs($user)
        ->get('/frontend')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('citizens/frontend/Prompt')
            ->has('circles', 1)
            ->where('circles.0.name', 'My Family')
            ->where('circles.0.memberCount', 1)
            ->where('circles.0.safeCount', 1)
            ->where('circles.0.calamityStatus.isAffected', false));
});

test('an authenticated user can create a safety circle', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('citizen.circles.store'), [
        'name' => 'My Family',
        'location' => 'Quezon City',
        'description' => 'People at home',
        'latitude' => 14.6760,
        'longitude' => 121.0437,
    ]);

    $circle = SafetyCircle::query()->sole();

    $response->assertRedirect(route('citizen.circles.show', $circle));
    expect($circle->owner_id)->toBe($user->id);
    $this->assertDatabaseHas('safety_circle_members', [
        'safety_circle_id' => $circle->id,
        'user_id' => $user->id,
        'relationship' => 'You',
        'safety_status' => 'safe',
    ]);
});

test('a user cannot view another users private circle', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'Private Circle',
        'location_name' => 'Quezon City',
        'latitude' => 14.6760,
        'longitude' => 121.0437,
    ]);

    $this->actingAs($otherUser)
        ->get(route('citizen.circles.show', $circle))
        ->assertNotFound();
});

test('a visible circle member status can be updated', function () {
    $owner = User::factory()->create();
    $memberUser = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'My Family',
        'location_name' => 'Quezon City',
        'latitude' => 14.6760,
        'longitude' => 121.0437,
    ]);
    $circle->memberships()->create([
        'user_id' => $owner->id,
        'relationship' => 'You',
    ]);
    $member = $circle->memberships()->create([
        'user_id' => $memberUser->id,
        'relationship' => 'Sibling',
    ]);

    $this->actingAs($owner)
        ->patch(route('citizen.circles.members.status', [$circle, $member]), [
            'status' => 'rescue',
        ])
        ->assertRedirect();

    expect($member->refresh())
        ->safety_status->toBe('rescue')
        ->response_status->toBe('responders_dispatched')
        ->checked_in_at->not->toBeNull();
});

test('any circle member can update another member status', function () {
    $owner = User::factory()->create();
    $updatingMember = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'My Family',
        'location_name' => 'Taguig City',
        'latitude' => 14.5176,
        'longitude' => 121.0509,
    ]);
    $ownerMembership = $circle->memberships()->create([
        'user_id' => $owner->id,
        'relationship' => 'Parent',
        'safety_status' => 'no_response',
    ]);
    $circle->memberships()->create([
        'user_id' => $updatingMember->id,
        'relationship' => 'Child',
        'safety_status' => 'no_response',
    ]);

    $this->actingAs($updatingMember)
        ->patch(route('citizen.circles.members.status', [$circle, $ownerMembership]), [
            'status' => 'safe',
        ])
        ->assertRedirect();

    expect($ownerMembership->refresh())
        ->safety_status->toBe('safe')
        ->checked_in_at->not->toBeNull();
});

test('global check in updates the current users circle memberships', function () {
    $user = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $user->id,
        'name' => 'My Family',
        'location_name' => 'Quezon City',
        'latitude' => 14.6760,
        'longitude' => 121.0437,
    ]);
    $membership = $circle->memberships()->create([
        'user_id' => $user->id,
        'relationship' => 'You',
    ]);

    $this->actingAs($user)
        ->patch(route('citizen.check-in'), ['status' => 'help'])
        ->assertRedirect();

    expect($membership->refresh())
        ->safety_status->toBe('help')
        ->response_status->toBe('forwarded_to_lgu')
        ->checked_in_at->not->toBeNull();
});

test('a visible circle member can add a citizen by scanning their member code', function () {
    Event::fake([SafetyCircleMemberAdded::class]);

    $owner = User::factory()->create();
    $newMember = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'My Family',
        'location_name' => 'Taguig City',
        'latitude' => 14.5176,
        'longitude' => 121.0509,
    ]);
    $circle->memberships()->create([
        'user_id' => $owner->id,
        'relationship' => 'You',
    ]);

    $this->actingAs($owner)
        ->post(route('citizen.circles.members.store', $circle), [
            'member_code' => "KUMUSTAKA_MEMBER:{$newMember->id}",
        ])
        ->assertRedirect();

    $membership = SafetyCircleMember::query()
        ->where('safety_circle_id', $circle->id)
        ->where('user_id', $newMember->id)
        ->sole();

    expect($membership)
        ->relationship->toBe('Member')
        ->safety_status->toBe('safe')
        ->checked_in_at->not->toBeNull();

    Event::assertDispatched(
        SafetyCircleMemberAdded::class,
        fn (SafetyCircleMemberAdded $event): bool => $event->circleId === $circle->id
            && $event->member['id'] === $membership->id,
    );
});

test('a citizen cannot add a member to a circle they cannot see', function () {
    $owner = User::factory()->create();
    $otherCitizen = User::factory()->create();
    $newMember = User::factory()->create();
    $circle = SafetyCircle::create([
        'owner_id' => $owner->id,
        'name' => 'Private Family',
        'location_name' => 'Taguig City',
        'latitude' => 14.5176,
        'longitude' => 121.0509,
    ]);

    $this->actingAs($otherCitizen)
        ->post(route('citizen.circles.members.store', $circle), [
            'member_code' => "KUMUSTAKA_MEMBER:{$newMember->id}",
        ])
        ->assertNotFound();

    $this->assertDatabaseMissing('safety_circle_members', [
        'safety_circle_id' => $circle->id,
        'user_id' => $newMember->id,
    ]);
});
