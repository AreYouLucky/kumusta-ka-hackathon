<?php

namespace Database\Seeders;

use App\Models\SafetyCircle;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class FamilyCircleSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $familyProfiles = [
                [
                    'username' => 'citizen.demo',
                    'fname' => 'JUAN',
                    'mname' => 'SANTOS',
                    'lname' => 'DELA CRUZ',
                    'suffix' => 'JR.',
                    'sex' => 'MALE',
                    'email' => 'citizen@kumustaka.test',
                    'mobile_number' => '09683013603',
                    'relationship' => 'You',
                ],
                [
                    'username' => 'citizen.maria',
                    'fname' => 'MARIA',
                    'mname' => 'REYES',
                    'lname' => 'DELA CRUZ',
                    'suffix' => null,
                    'sex' => 'FEMALE',
                    'email' => 'maria@kumustaka.test',
                    'mobile_number' => '09171234568',
                    'relationship' => 'Spouse',
                ],
                [
                    'username' => 'citizen.ana',
                    'fname' => 'ANA MARIE',
                    'mname' => 'SANTOS',
                    'lname' => 'DELA CRUZ',
                    'suffix' => null,
                    'sex' => 'FEMALE',
                    'email' => 'ana@kumustaka.test',
                    'mobile_number' => '09171234569',
                    'relationship' => 'Daughter',
                ],
                [
                    'username' => 'citizen.miguel',
                    'fname' => 'MIGUEL',
                    'mname' => 'SANTOS',
                    'lname' => 'DELA CRUZ',
                    'suffix' => null,
                    'sex' => 'MALE',
                    'email' => 'miguel@kumustaka.test',
                    'mobile_number' => '09171234570',
                    'relationship' => 'Son',
                ],
                [
                    'username' => 'citizen.rosa',
                    'fname' => 'ROSA',
                    'mname' => 'GARCIA',
                    'lname' => 'SANTOS',
                    'suffix' => null,
                    'sex' => 'FEMALE',
                    'email' => 'rosa@kumustaka.test',
                    'mobile_number' => '09171234571',
                    'relationship' => 'Mother',
                ],
            ];

            $familyMembers = collect($familyProfiles)->map(function (array $profile): array {
                $relationship = $profile['relationship'];
                unset($profile['relationship']);

                $user = User::updateOrCreate(
                    ['username' => $profile['username']],
                    [
                        ...$profile,
                        'password' => Hash::make('a'),
                        'role' => 'CITIZEN',
                    ],
                );

                return [
                    'user' => $user,
                    'relationship' => $relationship,
                ];
            });

            /** @var User $owner */
            $owner = $familyMembers->first()['user'];

            $circle = SafetyCircle::updateOrCreate(
                [
                    'owner_id' => $owner->id,
                    'name' => 'My Family',
                ],
                [
                    'location_name' => 'DOST Compound, Central Bicutan, Taguig City',
                    'description' => 'Dela Cruz family safety and emergency check-in circle.',
                    'latitude' => 14.5253470,
                    'longitude' => 121.0596751,
                ],
            );

            $familyMembers->each(function (array $member) use ($circle): void {
                $circle->memberships()->updateOrCreate(
                    ['user_id' => $member['user']->id],
                    [
                        'relationship' => $member['relationship'],
                        'safety_status' => 'safe',
                        'response_status' => null,
                        'checked_in_at' => now(),
                    ],
                );
            });
        });
    }
}
