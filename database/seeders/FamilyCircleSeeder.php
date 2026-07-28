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
                    'last_seen_location_name' => 'DOST Main Building, Central Bicutan',
                    'last_seen_latitude' => 14.5261362,
                    'last_seen_longitude' => 121.0593401,
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
                    'last_seen_location_name' => 'DOST-PAGASA Science Garden',
                    'last_seen_latitude' => 14.5249458,
                    'last_seen_longitude' => 121.0602354,
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
                    'last_seen_location_name' => 'Upper Bicutan National High School',
                    'last_seen_latitude' => 14.5283467,
                    'last_seen_longitude' => 121.0568924,
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
                    'last_seen_location_name' => 'Central Bicutan Covered Court',
                    'last_seen_latitude' => 14.5229831,
                    'last_seen_longitude' => 121.0577826,
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
                    'last_seen_location_name' => 'Central Bicutan Health Center',
                    'last_seen_latitude' => 14.5257094,
                    'last_seen_longitude' => 121.0621843,
                ],
            ];

            $familyMembers = collect($familyProfiles)->map(function (array $profile): array {
                $relationship = $profile['relationship'];
                $lastSeenLocation = [
                    'name' => $profile['last_seen_location_name'],
                    'latitude' => $profile['last_seen_latitude'],
                    'longitude' => $profile['last_seen_longitude'],
                ];
                unset(
                    $profile['relationship'],
                    $profile['last_seen_location_name'],
                    $profile['last_seen_latitude'],
                    $profile['last_seen_longitude'],
                );

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
                    'last_seen_location' => $lastSeenLocation,
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
                        'last_seen_location_name' => $member['last_seen_location']['name'],
                        'last_seen_latitude' => $member['last_seen_location']['latitude'],
                        'last_seen_longitude' => $member['last_seen_location']['longitude'],
                        'last_seen_at' => now()->subMinutes(($member['user']->id % 5) * 4 + 2),
                    ],
                );
            });
        });
    }
}
