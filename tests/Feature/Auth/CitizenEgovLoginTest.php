<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.egov_sso.base_url' => 'https://hackathon-sso.test',
        'services.egov_sso.scope' => 'SSO_AUTHENTICATION',
        'services.egov_sso.partner_code' => 'HACKATHON_SSO',
        'services.egov_sso.partner_secret' => 'test-partner-secret',
        'services.egov_sso.test_accounts' => [
            'josie@yopmail.com' => 'single-use-exchange-code',
            'josie01@yopmail.com' => 'valid-exchange-code',
            'josie02@yopmail.com' => 'valid-exchange-code',
        ],
    ]);
});

test('citizen eGov exchange code login screen can be rendered', function () {
    $this->get(route('citizen.login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('citizens/auth/login')
            ->where('testAccounts', [
                'josie@yopmail.com',
                'josie01@yopmail.com',
                'josie02@yopmail.com',
            ]));
});

test('citizen module redirects guests to the citizen login', function () {
    $this->get(route('citizen.home'))
        ->assertRedirect(route('citizen.login'));
});

test('non citizen accounts cannot browse the citizen module', function () {
    $administrator = User::factory()->create(['role' => 'administrator']);

    $this->actingAs($administrator)
        ->get(route('citizen.home'))
        ->assertRedirect(route('admin.dashboard'));
});

test('an eGov exchange code creates and authenticates a citizen account', function () {
    Http::fake([
        'https://hackathon-sso.test/api/token' => Http::response([
            'data' => ['access_token' => 'temporary-access-token'],
        ]),
        'https://hackathon-sso.test/api/partner/sso_authentication' => Http::response([
            'data' => [
                'id' => 'egov-1001',
                'username' => 'josie',
                'first_name' => 'Josie',
                'middle_name' => 'Reyes',
                'last_name' => 'Santos',
                'suffix' => null,
                'sex' => 'female',
                'email' => 'josie@yopmail.com',
                'mobile_number' => '+63 917 123 4567',
                'address' => ['city' => 'Taguig City'],
            ],
        ]),
    ]);

    $response = $this->post(route('citizen.login.store'), [
        'email' => 'josie@yopmail.com',
    ]);

    $citizen = User::query()->where('email', 'josie@yopmail.com')->sole();

    $this->assertAuthenticatedAs($citizen);
    $response->assertRedirect(route('citizen.home'));

    expect($citizen)
        ->egov_subject->toBe('egov-1001')
        ->username->toBe('josie')
        ->fname->toBe('Josie')
        ->mname->toBe('Reyes')
        ->lname->toBe('Santos')
        ->mobile_number->toBe('09171234567')
        ->role->toBe('CITIZEN')
        ->and($citizen->egov_profile['address']['city'])->toBe('Taguig City')
        ->and($citizen->last_login)->not->toBeNull()
        ->and($citizen->egov_profile_synced_at)->not->toBeNull();

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://hackathon-sso.test/api/token'
        && $request->method() === 'POST'
        && $request['exchange_code'] === 'single-use-exchange-code'
        && $request['scope'] === 'SSO_AUTHENTICATION'
        && $request['partner_code'] === 'HACKATHON_SSO'
        && $request['partner_secret'] === 'test-partner-secret');

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://hackathon-sso.test/api/partner/sso_authentication'
        && $request->method() === 'GET'
        && $request->hasHeader('Authorization', 'Bearer temporary-access-token'));
});

test('eGov login updates an existing citizen matched by email', function () {
    $citizen = User::factory()->create([
        'email' => 'josie01@yopmail.com',
        'fname' => 'Old',
        'role' => 'citizen',
    ]);

    fakeSuccessfulEgovLogin([
        'id' => 'egov-1002',
        'first_name' => 'Josie',
        'last_name' => 'Dela Cruz',
        'email' => 'josie01@yopmail.com',
    ]);

    $this->post(route('citizen.login.store'), [
        'email' => 'josie01@yopmail.com',
    ])->assertRedirect(route('citizen.home'));

    $this->assertAuthenticatedAs($citizen);
    expect($citizen->refresh())
        ->egov_subject->toBe('egov-1002')
        ->fname->toBe('Josie')
        ->lname->toBe('Dela Cruz');
});

test('an invalid or expired exchange code is rejected', function () {
    Http::fake([
        'https://hackathon-sso.test/api/token' => Http::response([
            'message' => 'Invalid exchange code',
        ], 401),
    ]);

    $this->post(route('citizen.login.store'), [
        'email' => 'josie@yopmail.com',
    ])->assertSessionHasErrors([
        'email' => 'The exchange code is invalid or has expired.',
    ]);

    $this->assertGuest();
    Http::assertSentCount(1);
});

test('a citizen can use mobile login after an eGov error', function () {
    $citizen = User::factory()->create([
        'mobile_number' => '09171234567',
        'role' => 'citizen',
    ]);
    Http::fake([
        'https://hackathon-sso.test/api/token' => Http::response([], 503),
    ]);

    $this->post(route('citizen.login.store'), [
        'email' => 'josie@yopmail.com',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();

    $this->post(route('citizen.login.store'), [
        'mobile_number' => '+63 917 123 4567',
    ])->assertRedirect(route('citizen.home'));

    $this->assertAuthenticatedAs($citizen);
    expect($citizen->fresh()->last_login)->not->toBeNull();
    Http::assertSentCount(1);
});

test('mobile fallback only authenticates citizen accounts', function () {
    User::factory()->create([
        'mobile_number' => '09171234567',
        'role' => 'gcc',
    ]);

    $this->post(route('citizen.login.store'), [
        'mobile_number' => '09171234567',
    ])->assertSessionHasErrors('mobile_number');

    $this->assertGuest();
});

test('eGov identity cannot take over a non-citizen account', function () {
    User::factory()->create([
        'email' => 'josie02@yopmail.com',
        'role' => 'gcc',
    ]);

    fakeSuccessfulEgovLogin([
        'id' => 'egov-1003',
        'first_name' => 'Josie',
        'last_name' => 'Garcia',
        'email' => 'josie02@yopmail.com',
    ]);

    $this->post(route('citizen.login.store'), [
        'email' => 'josie02@yopmail.com',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
    expect(User::query()->where('email', 'josie02@yopmail.com')->sole()->role)->toBe('gcc');
});

test('an email outside the configured test accounts is rejected without calling eGov', function () {
    Http::fake();

    $this->post(route('citizen.login.store'), [
        'email' => 'unknown@yopmail.com',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
    Http::assertNothingSent();
});

/**
 * @param  array<string, mixed>  $profile
 */
function fakeSuccessfulEgovLogin(array $profile): void
{
    Http::fake([
        'https://hackathon-sso.test/api/token' => Http::response([
            'access_token' => 'temporary-access-token',
        ]),
        'https://hackathon-sso.test/api/partner/sso_authentication' => Http::response([
            'data' => $profile,
        ]),
    ]);
}
