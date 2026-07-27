<?php

use App\Models\User;

test('administrator login redirects to the admin panel', function () {
    $administrator = User::factory()->create(['role' => 'ADMINISTRATOR']);

    $this->post(route('login'), [
        'username' => $administrator->username,
        'password' => 'password',
    ])->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($administrator);
});

test('administrator can browse the admin dashboard and command center routes', function () {
    $administrator = User::factory()->create(['role' => 'ADMINISTRATOR']);

    $this->actingAs($administrator)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('gcc/dashboard'));

    $this->actingAs($administrator)
        ->get(route('gcc.disaster-map.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('gcc/disaster-map'));

    $this->actingAs($administrator)
        ->get(route('gcc.affected-residents.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('gcc/affected-residents'));

    $this->actingAs($administrator)
        ->get(route('gcc.residences.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('gcc/residences'));
});

test('citizen still cannot browse administrator or command center routes', function () {
    $citizen = User::factory()->create(['role' => 'citizen']);

    $this->actingAs($citizen)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('citizen.home'));

    $this->actingAs($citizen)
        ->get(route('gcc.dashboard.index'))
        ->assertRedirect(route('citizen.home'));
});
