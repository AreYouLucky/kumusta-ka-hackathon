<?php

use App\Models\User;
use Database\Seeders\UserSeeder;

test('user seeder handles users with different optional columns and is idempotent', function () {
    $this->seed(UserSeeder::class);
    $this->seed(UserSeeder::class);

    $citizen = User::query()
        ->where('username', 'citizen.demo')
        ->firstOrFail();

    expect(User::query()->count())->toBe(4)
        ->and($citizen->fname)->toBe('JUAN')
        ->and($citizen->mname)->toBe('SANTOS')
        ->and($citizen->lname)->toBe('DELA CRUZ')
        ->and($citizen->suffix)->toBe('JR.')
        ->and($citizen->sex)->toBe('MALE')
        ->and($citizen->email)->toBe('citizen@kumustaka.test')
        ->and($citizen->mobile_number)->toBe('09683013603')
        ->and($citizen->role)->toBe('CITIZEN')
        ->and(User::query()->where('username', 'responder')->value('role'))->toBe('RESPONDER');
});
