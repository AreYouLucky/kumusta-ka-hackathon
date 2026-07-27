<?php

use App\Models\User;

test('citizen mobile login screen can be rendered', function () {
    $this->get(route('citizen.login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('citizens/auth/login'));
});

test('citizen module redirects guests to the citizen mobile login', function () {
    $this->get(route('citizen.home'))
        ->assertRedirect(route('citizen.login'));
});

test('non citizen accounts cannot browse the citizen module', function () {
    $administrator = User::factory()->create(['role' => 'administrator']);

    $this->actingAs($administrator)
        ->get(route('citizen.home'))
        ->assertRedirect(route('admin.dashboard'));
});

test('citizen can authenticate using only a registered mobile number', function () {
    $citizen = User::factory()->create([
        'mobile_number' => '09171234567',
        'role' => 'citizen',
    ]);

    $response = $this->post(route('citizen.login.store'), [
        'mobile_number' => '+63 917 123 4567',
    ]);

    $this->assertAuthenticatedAs($citizen);
    $response->assertRedirect(route('citizen.home'));
    expect($citizen->fresh()->last_login)->not->toBeNull();
});

test('mobile login only authenticates citizen accounts', function () {
    User::factory()->create([
        'mobile_number' => '09171234567',
        'role' => 'gcc',
    ]);

    $this->post(route('citizen.login.store'), [
        'mobile_number' => '09171234567',
    ])->assertSessionHasErrors('mobile_number');

    $this->assertGuest();
});

test('mobile login authenticates the first matching citizen account', function () {
    $firstCitizen = User::factory()->create([
        'mobile_number' => '09171234567',
        'role' => 'citizen',
    ]);
    User::factory()->create([
        'mobile_number' => '09171234567',
        'role' => 'citizen',
    ]);

    $this->post(route('citizen.login.store'), [
        'mobile_number' => '09171234567',
    ])->assertRedirect(route('citizen.home'));

    $this->assertAuthenticatedAs($firstCitizen);
});

test('mobile login rejects an invalid Philippine number', function () {
    $this->post(route('citizen.login.store'), [
        'mobile_number' => '12345',
    ])->assertSessionHasErrors('mobile_number');

    $this->assertGuest();
});
