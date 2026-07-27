<?php

namespace App\Http\Controllers\GCC;

use App\Http\Controllers\Controller;
use App\Models\Residence;
use Inertia\Inertia;
use Inertia\Response;

class ResidenceController extends Controller
{
    public function index(): Response
    {
        $residences = Residence::latest()
            ->take(100)
            ->get()
            ->map(fn (Residence $residence) => [
                'id' => $residence->id,
                'resident_code' => $residence->resident_code,
                'full_name' => collect([
                    $residence->first_name,
                    $residence->middle_name,
                    $residence->last_name,
                    $residence->suffix,
                ])->filter()->join(' '),
                'birthdate' => $residence->birthdate?->toDateString(),
                'age' => $residence->birthdate?->age,
                'sex' => $residence->sex,
                'is_pwd' => $residence->is_pwd,
                'is_pregnant' => $residence->is_pregnant,
                'pregnancy_month' => $residence->pregnancy_month,
                'household_number' => $residence->household_number,
                'contact_number' => $residence->contact_number,
                'province' => $residence->province,
                'city' => $residence->city,
                'barangay' => $residence->barangay,
                'purok' => $residence->purok,
                'street' => $residence->street,
                'address_line' => $residence->address_line,
                'latitude' => (float) $residence->latitude,
                'longitude' => (float) $residence->longitude,
                'structure_type' => $residence->structure_type,
                'has_health_problem' => $residence->has_health_problem,
                'health_problem_details' => $residence->health_problem_details,
            ]);

        return Inertia::render('gcc/residences', [
            'residences' => $residences,
            'summary' => [
                'total' => $residences->count(),
                'mapped' => $residences->filter(fn ($residence) => $residence['latitude'] && $residence['longitude'])->count(),
                'barangays' => $residences->pluck('barangay')->filter()->unique()->count(),
                'with_birthdate' => $residences->whereNotNull('birthdate')->count(),
                'pwd' => $residences->where('is_pwd', true)->count(),
                'pregnant' => $residences->where('is_pregnant', true)->count(),
                'with_health_problem' => $residences->where('has_health_problem', true)->count(),
            ],
        ]);
    }
}
