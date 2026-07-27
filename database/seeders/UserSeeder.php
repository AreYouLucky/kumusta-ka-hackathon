<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $staticCitizenProfile = [
            'username' => 'citizen.demo',
            'lname' => 'DELA CRUZ',
            'fname' => 'JUAN',
            'mname' => 'SANTOS',
            'suffix' => 'JR.',
            'sex' => 'MALE',
            'email' => 'citizen@kumustaka.test',
            'mobile_number' => '09683013603',
            'password' => Hash::make('a'),
            'role' => 'CITIZEN',
        ];

        $users = [
            [
                'username' => 'admin',
                'lname' => 'AMPARADO',
                'fname' => 'ETIENNE WAYNE',
                'mname' => '',
                'sex' => 'MALE',
                'email' => 'eshen@kodlens.org',
                'password' => Hash::make('a'),
                'role' => 'ADMINISTRATOR',
            ],

            [
                'username' => 'gcc',
                'lname' => 'AMPARADO',
                'fname' => 'ETIENNE WAYNE',
                'mname' => '',
                'sex' => 'MALE',
                'email' => 'gcc@kodlens.org',
                'password' => Hash::make('a'),
                'role' => 'GCC',
            ],

            $staticCitizenProfile,
            [
                'username' => 'responder',
                'lname' => 'RESPONDER',
                'fname' => 'DEMO',
                'mname' => '',
                'sex' => 'MALE',
                'email' => 'responder@kumustaka.test',
                'password' => Hash::make('a'),
                'role' => 'RESPONDER',
            ],
            [
                'username' => 'citizen.demo1',
                'lname' => 'DELA CRUZ',
                'fname' => 'JUANA',
                'mname' => 'SANTOS',
                'suffix' => 'JR.',
                'sex' => 'MALE',
                'email' => 'citizen1@kumustaka.test',
                'mobile_number' => '09683013604',
                'password' => Hash::make('a'),
                'role' => 'CITIZEN',
            ],

        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['username' => $user['username']],
                $user,
            );
        }
    }
}
