<?php

use App\Models\SafetyCircle;
use Database\Seeders\FamilyCircleSeeder;

test('family circle seeder creates an idempotent five member circle in Taguig City', function () {
    $this->seed(FamilyCircleSeeder::class);
    $this->seed(FamilyCircleSeeder::class);

    $circle = SafetyCircle::query()
        ->where('name', 'My Family')
        ->with('memberships.user')
        ->sole();

    expect($circle)
        ->location_name->toBe('DOST Compound, Central Bicutan, Taguig City')
        ->latitude->toBe('14.5253470')
        ->longitude->toBe('121.0596751')
        ->and($circle->memberships)->toHaveCount(5)
        ->and($circle->memberships->pluck('user.username')->all())->toBe([
            'citizen.demo',
            'citizen.maria',
            'citizen.ana',
            'citizen.miguel',
            'citizen.rosa',
        ])
        ->and($circle->memberships->every(
            fn ($membership): bool => $membership->last_seen_location_name !== null
                && $membership->last_seen_latitude !== null
                && $membership->last_seen_longitude !== null
                && $membership->last_seen_at !== null
        ))->toBeTrue();
});
