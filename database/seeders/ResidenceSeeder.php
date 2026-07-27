<?php

namespace Database\Seeders;

use App\Models\Residence;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ResidenceSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('en_PH');

        $clusters = [
            ['barangay' => 'Commonwealth', 'latitude' => 14.7049, 'longitude' => 121.0866, 'radius' => 900, 'residents' => 500],
            ['barangay' => 'Batasan Hills', 'latitude' => 14.6908, 'longitude' => 121.1012, 'radius' => 750, 'residents' => 420],
            ['barangay' => 'Holy Spirit', 'latitude' => 14.6847, 'longitude' => 121.0816, 'radius' => 650, 'residents' => 340],
            ['barangay' => 'Payatas', 'latitude' => 14.7168, 'longitude' => 121.1027, 'radius' => 800, 'residents' => 420],
            ['barangay' => 'Bagong Silangan', 'latitude' => 14.7067, 'longitude' => 121.1095, 'radius' => 750, 'residents' => 340],
            ['barangay' => 'Fairview', 'latitude' => 14.7005, 'longitude' => 121.0682, 'radius' => 700, 'residents' => 300],
            ['barangay' => 'North Fairview', 'latitude' => 14.7243, 'longitude' => 121.0644, 'radius' => 700, 'residents' => 260],
            ['barangay' => 'Novaliches Proper', 'latitude' => 14.7207, 'longitude' => 121.0372, 'radius' => 650, 'residents' => 220],
            ['barangay' => 'Sauyo', 'latitude' => 14.7116, 'longitude' => 121.0287, 'radius' => 600, 'residents' => 200],
        ];

        $puroks = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7', 'Purok 8'];

        $streets = [
            'Mabuhay Street',
            'Sampaguita Street',
            'Narra Street',
            'Molave Street',
            'Acacia Street',
            'Mahogany Street',
            'Yakal Street',
            'Camia Street',
            'Rosal Street',
            'Ilang-Ilang Street',
            'Maligaya Street',
            'Pag-asa Street',
            'Mapayapa Street',
            'Masagana Street',
            'Kalayaan Street',
            'Katarungan Street',
            'Luzon Avenue',
            'Commonwealth Avenue',
            'Quirino Highway',
            'Regalado Avenue',
        ];

        $structureTypes = ['concrete', 'semi_concrete', 'light_material', 'temporary', 'other'];
        $healthProblems = ['Asthma', 'Hypertension', 'Diabetes', 'Heart condition', 'Dialysis patient', 'Mobility impairment'];
        $residentCounter = 1;

        Residence::whereNull('resident_code')->delete();

        foreach ($clusters as $cluster) {
            for ($i = 1; $i <= $cluster['residents']; $i++) {
                $coordinates = $this->generateCoordinateWithinRadius(
                    latitude: $cluster['latitude'],
                    longitude: $cluster['longitude'],
                    radiusInMeters: $cluster['radius']
                );

                $street = $faker->randomElement($streets);
                $purok = $faker->randomElement($puroks);
                $houseNumber = $faker->numberBetween(1, 999);
                $sex = $faker->randomElement(['female', 'male']);
                $firstName = $sex === 'female' ? $faker->firstNameFemale : $faker->firstNameMale;
                $lastName = $faker->lastName;
                $isPwd = $faker->boolean(8);
                $isPregnant = $sex === 'female' && $faker->boolean(6);
                $hasHealthProblem = $faker->boolean(18);

                Residence::updateOrCreate(
                    ['resident_code' => sprintf('QC-RES-%05d', $residentCounter)],
                    [
                        'created_by' => 1,
                        'first_name' => Str::upper($firstName),
                        'middle_name' => Str::upper($faker->randomLetter) . '.',
                        'last_name' => Str::upper($lastName),
                        'suffix' => $faker->optional(8)->randomElement(['JR.', 'SR.', 'III']),
                        'birthdate' => $faker->dateTimeBetween('-85 years', '-1 year')->format('Y-m-d'),
                        'sex' => $sex,
                        'is_pwd' => $isPwd,
                        'is_pregnant' => $isPregnant,
                        'pregnancy_month' => $isPregnant ? $faker->numberBetween(1, 9) : null,
                        'household_number' => sprintf('QC-HH-%05d', (int) ceil($residentCounter / 4)),
                        'contact_number' => $this->generatePhilippineMobileNumber(),
                        'province' => 'Metro Manila',
                        'city' => 'Quezon City',
                        'barangay' => $cluster['barangay'],
                        'purok' => $purok,
                        'street' => $street,
                        'address_line' => sprintf('%d %s, %s, Barangay %s, Quezon City', $houseNumber, $street, $purok, $cluster['barangay']),
                        'latitude' => $coordinates['latitude'],
                        'longitude' => $coordinates['longitude'],
                        'structure_type' => $faker->randomElement($structureTypes),
                        'has_health_problem' => $hasHealthProblem,
                        'health_problem_details' => $hasHealthProblem ? $faker->randomElement($healthProblems) : null,
                        'notes' => $faker->optional(20)->randomElement([
                            'Resident may need evacuation assistance.',
                            'Address is near a creek or drainage channel.',
                            'Resident requested SMS disaster alerts.',
                        ]),
                    ]
                );

                $residentCounter++;
            }
        }
    }

    private function generateCoordinateWithinRadius(float $latitude, float $longitude, int $radiusInMeters): array
    {
        $earthRadius = 6371000;
        $distance = sqrt(mt_rand() / mt_getrandmax()) * $radiusInMeters;
        $bearing = (mt_rand() / mt_getrandmax()) * 2 * M_PI;
        $latitudeRadians = deg2rad($latitude);
        $longitudeRadians = deg2rad($longitude);

        $newLatitudeRadians = asin(
            sin($latitudeRadians) * cos($distance / $earthRadius) +
            cos($latitudeRadians) * sin($distance / $earthRadius) * cos($bearing)
        );

        $newLongitudeRadians = $longitudeRadians + atan2(
            sin($bearing) * sin($distance / $earthRadius) * cos($latitudeRadians),
            cos($distance / $earthRadius) - sin($latitudeRadians) * sin($newLatitudeRadians)
        );

        return [
            'latitude' => round(rad2deg($newLatitudeRadians), 7),
            'longitude' => round(rad2deg($newLongitudeRadians), 7),
        ];
    }

    private function generatePhilippineMobileNumber(): string
    {
        $prefixes = [
            '0905',
            '0906',
            '0915',
            '0916',
            '0917',
            '0920',
            '0921',
            '0922',
            '0927',
            '0928',
            '0929',
            '0935',
            '0936',
            '0939',
            '0945',
            '0950',
            '0951',
            '0961',
            '0965',
            '0966',
            '0967',
            '0975',
            '0977',
            '0978',
            '0979',
            '0981',
            '0995',
            '0997',
            '0998',
            '0999',
        ];

        return $prefixes[array_rand($prefixes)] . str_pad((string) mt_rand(0, 9999999), 7, '0', STR_PAD_LEFT);
    }
}
