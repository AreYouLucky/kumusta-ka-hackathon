<?php

namespace App\Http\Controllers\GCC;

use App\Http\Controllers\Controller;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Models\Residence;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DisasterIncidentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedIncident($request);

        DisasterIncident::create([
            ...$validated,
            'created_by' => $request->user()?->id,
            'status' => 'open',
        ]);

        return back();
    }

    public function update(Request $request, DisasterIncident $incident): RedirectResponse
    {
        $previousStatus = $incident->status;

        $incident->update($this->validatedIncident($request, includeStatus: true));

        if ($previousStatus !== 'monitoring' && $incident->status === 'monitoring') {
            $this->createAffectedResidentsForIncident($incident, $request->user()?->id);
        }

        return back();
    }

    private function createAffectedResidentsForIncident(DisasterIncident $incident, ?int $createdBy): void
    {
        Residence::query()
            ->selectRaw('*, (
                6371000 * acos(
                    cos(radians(?)) *
                    cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) *
                    sin(radians(latitude))
                )
            ) as distance_meters', [
                $incident->latitude,
                $incident->longitude,
                $incident->latitude,
            ])
            ->having('distance_meters', '<=', $incident->radius_meters)
            ->chunkById(200, function ($residences) use ($incident, $createdBy): void {
                foreach ($residences as $residence) {
                    AffectedResident::updateOrCreate(
                        [
                            'disaster_incident_id' => $incident->id,
                            'residence_id' => $residence->id,
                        ],
                        [
                            'created_by' => $createdBy,
                            'household_number' => $residence->household_number,
                            'first_name' => $residence->first_name,
                            'middle_name' => $residence->middle_name,
                            'last_name' => $residence->last_name,
                            'suffix' => $residence->suffix,
                            'birthdate' => $residence->birthdate,
                            'sex' => $residence->sex,
                            'contact_number' => $residence->contact_number,
                            'province' => $residence->province,
                            'city' => $residence->city,
                            'barangay' => $residence->barangay,
                            'address_line' => $residence->address_line,
                            'status' => 'possibly_affected',
                            'resident_status' => 0,
                        ]
                    );
                }
            });
    }

    private function validatedIncident(Request $request, bool $includeStatus = false): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'hazard_type' => ['required', 'in:flood,earthquake,fire,landslide,storm_surge,tsunami,medical,other'],
            'severity' => ['required', 'in:low,moderate,high,critical'],
            'status' => [$includeStatus ? 'required' : 'sometimes', 'in:open,monitoring,dispatching,resolved'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius_meters' => ['required', 'integer', 'min:100', 'max:200000'],
            'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'location_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
