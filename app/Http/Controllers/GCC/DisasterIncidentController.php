<?php

namespace App\Http\Controllers\GCC;

use App\Http\Controllers\Controller;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Models\Residence;
use App\Services\DisasterCircleService;
use App\Support\GeoDistance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DisasterIncidentController extends Controller
{
    public function __construct(private DisasterCircleService $disasterCircleService) {}

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedIncident($request);

        $incident = DisasterIncident::create([
            ...$validated,
            'created_by' => $request->user()?->id,
            'status' => 'monitoring',
        ]);

        $this->createAffectedResidentsForIncident($incident, $request->user()?->id);
        $this->disasterCircleService->activate($incident);

        return back();
    }

    public function update(Request $request, DisasterIncident $incident): RedirectResponse
    {
        $previousStatus = $incident->status;

        $incident->update($this->validatedIncident($request, includeStatus: true));

        if ($previousStatus !== 'monitoring' && $incident->status === 'monitoring') {
            $this->createAffectedResidentsForIncident($incident, $request->user()?->id);
            $this->disasterCircleService->activate($incident);
        }

        return back();
    }

    private function createAffectedResidentsForIncident(DisasterIncident $incident, ?int $createdBy): void
    {
        $latitude = (float) $incident->latitude;
        $longitude = (float) $incident->longitude;
        $latitudeRange = $incident->radius_meters / 111_320;
        $longitudeDivisor = 111_320 * max(0.01, cos(deg2rad($latitude)));
        $longitudeRange = $incident->radius_meters / $longitudeDivisor;

        Residence::query()
            ->whereBetween('latitude', [$latitude - $latitudeRange, $latitude + $latitudeRange])
            ->whereBetween('longitude', [$longitude - $longitudeRange, $longitude + $longitudeRange])
            ->chunkById(200, function ($residences) use ($incident, $createdBy): void {
                foreach ($residences as $residence) {
                    $distance = GeoDistance::meters(
                        (float) $incident->latitude,
                        (float) $incident->longitude,
                        (float) $residence->latitude,
                        (float) $residence->longitude,
                    );

                    if ($distance > $incident->radius_meters) {
                        continue;
                    }

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
