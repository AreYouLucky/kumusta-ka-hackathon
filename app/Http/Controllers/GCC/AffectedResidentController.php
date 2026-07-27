<?php

namespace App\Http\Controllers\GCC;

use App\Http\Controllers\Controller;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Services\DisasterCircleService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AffectedResidentController extends Controller
{
    public function __construct(private DisasterCircleService $disasterCircleService) {}

    public function index(): Response
    {
        $this->disasterCircleService->syncActiveAffectedCircleMembers();

        $incidentGroups = DisasterIncident::query()
            ->with(['affectedResidents' => fn ($query) => $query
                ->with('residence')
                ->orderByRaw("
                    CASE
                        WHEN circle_safety_status = 'rescue' AND status <> 'rescued' THEN 0
                        WHEN circle_safety_status = 'help' AND status <> 'rescued' THEN 1
                        ELSE 2
                    END
                ")
                ->latest()])
            ->withCount('affectedResidents')
            ->has('affectedResidents')
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (DisasterIncident $incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'hazard_type' => $incident->hazard_type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'location_name' => $incident->location_name,
                'radius_meters' => $incident->radius_meters,
                'created_at' => $incident->created_at?->diffForHumans(),
                'affected_count' => $incident->affected_residents_count,
                'children_count' => $incident->affectedResidents->filter(fn (AffectedResident $resident) => $resident->residence?->birthdate?->age !== null && $resident->residence->birthdate->age <= 12)->count(),
                'senior_count' => $incident->affectedResidents->filter(fn (AffectedResident $resident) => $resident->residence?->birthdate?->age !== null && $resident->residence->birthdate->age >= 60)->count(),
                'pwd_count' => $incident->affectedResidents->filter(fn (AffectedResident $resident) => $resident->residence?->is_pwd)->count(),
                'pregnant_count' => $incident->affectedResidents->filter(fn (AffectedResident $resident) => $resident->residence?->is_pregnant)->count(),
                'health_problem_count' => $incident->affectedResidents->filter(fn (AffectedResident $resident) => $resident->residence?->has_health_problem)->count(),
                'evacuated_count' => $incident->affectedResidents->where('status', 'evacuated')->count(),
                'no_response_count' => $incident->affectedResidents
                    ->filter(fn (AffectedResident $resident) => $resident->hasNoResponse())
                    ->count(),
                'needs_help_count' => $incident->affectedResidents->where('circle_safety_status', 'help')->count(),
                'urgent_rescue_count' => $incident->affectedResidents
                    ->where('circle_safety_status', 'rescue')
                    ->where('status', '!=', 'rescued')
                    ->count(),
                'residents' => $incident->affectedResidents->map(fn (AffectedResident $resident) => [
                    'id' => $resident->id,
                    'full_name' => collect([
                        $resident->residence?->first_name ?? $resident->first_name,
                        $resident->residence?->middle_name ?? $resident->middle_name,
                        $resident->residence?->last_name ?? $resident->last_name,
                        $resident->residence?->suffix ?? $resident->suffix,
                    ])->filter()->join(' '),
                    'birthdate' => ($resident->residence?->birthdate ?? $resident->birthdate)?->toDateString(),
                    'age' => ($resident->residence?->birthdate ?? $resident->birthdate)?->age,
                    'sex' => $resident->residence?->sex ?? $resident->sex,
                    'barangay' => $resident->residence?->barangay ?? $resident->barangay,
                    'city' => $resident->residence?->city ?? $resident->city,
                    'status' => $resident->status,
                    'resident_status' => $resident->resident_status,
                    'circle_safety_status' => $resident->circle_safety_status,
                    'is_no_response' => $resident->hasNoResponse(),
                    'assistance_type' => $resident->assistance_type,
                    'situation' => $resident->situation,
                    'priority' => $resident->priority,
                    'is_pwd' => (bool) $resident->residence?->is_pwd,
                    'is_pregnant' => (bool) $resident->residence?->is_pregnant,
                    'has_health_problem' => (bool) $resident->residence?->has_health_problem,
                    'health_problem_details' => $resident->residence?->health_problem_details,
                    'evacuation_center' => $resident->evacuation_center,
                ]),
            ]);

        $residents = $incidentGroups->flatMap(fn ($incident) => $incident['residents']);

        return Inertia::render('gcc/affected-residents', [
            'incidentGroups' => $incidentGroups,
            'summary' => [
                'total' => $residents->count(),
                'children' => $residents->filter(fn ($resident) => $resident['age'] !== null && $resident['age'] <= 12)->count(),
                'senior' => $residents->filter(fn ($resident) => $resident['age'] !== null && $resident['age'] >= 60)->count(),
                'pwd' => $residents->where('is_pwd', true)->count(),
                'pregnant' => $residents->where('is_pregnant', true)->count(),
                'health_problem' => $residents->where('has_health_problem', true)->count(),
                'evacuated' => $residents->where('status', 'evacuated')->count(),
                'no_response' => $residents->where('is_no_response', true)->count(),
                'needs_help' => $residents->where('circle_safety_status', 'help')->count(),
                'urgent_rescue' => $residents
                    ->where('circle_safety_status', 'rescue')
                    ->where('status', '!=', 'rescued')
                    ->count(),
            ],
        ]);
    }

    public function markSafe(AffectedResident $affectedResident): RedirectResponse
    {
        $this->disasterCircleService->markAffectedResidentSafe($affectedResident);

        return back();
    }

    public function dispatchResponder(AffectedResident $affectedResident): RedirectResponse
    {
        $this->disasterCircleService->dispatchAffectedResidentResponder($affectedResident);

        return back();
    }
}
