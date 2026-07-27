<?php

namespace App\Http\Controllers\GCC;

use App\Http\Controllers\Controller;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Services\DisasterCircleService;
use Inertia\Inertia;
use Inertia\Response;

class GCCDashboardController extends Controller
{
    public function __construct(private DisasterCircleService $disasterCircleService) {}

    public function index(): Response
    {
        $this->disasterCircleService->syncActiveAffectedCircleMembers();

        return Inertia::render('gcc/dashboard', [
            'incidents' => $this->incidents(),
            'responseSummary' => $this->responseSummary(),
        ]);
    }

    public function disasterMap(): Response
    {
        return Inertia::render('gcc/disaster-map', [
            'incidents' => $this->incidents(),
        ]);
    }

    private function incidents()
    {
        return DisasterIncident::latest()
            ->take(100)
            ->get()
            ->map(fn (DisasterIncident $incident) => [
                'id' => $incident->id,
                'title' => $incident->title,
                'hazard_type' => $incident->hazard_type,
                'severity' => $incident->severity,
                'status' => $incident->status,
                'latitude' => (float) $incident->latitude,
                'longitude' => (float) $incident->longitude,
                'radius_meters' => $incident->radius_meters,
                'color' => $incident->color,
                'location_name' => $incident->location_name,
                'description' => $incident->description,
                'created_at' => $incident->created_at?->diffForHumans(),
            ]);
    }

    /**
     * @return array<string, int>
     */
    private function responseSummary(): array
    {
        $residents = AffectedResident::query()
            ->whereHas('incident', fn ($query) => $query->whereIn('status', ['monitoring', 'dispatching']))
            ->get();

        return [
            'total' => $residents->count(),
            'no_response' => $residents
                ->filter(fn (AffectedResident $resident) => $resident->hasNoResponse()
                    && $resident->status !== 'rescued')
                ->count(),
            'needs_help' => $residents
                ->where('circle_safety_status', 'help')
                ->where('status', '!=', 'rescued')
                ->count(),
            'urgent_rescue' => $residents
                ->where('circle_safety_status', 'rescue')
                ->where('status', '!=', 'rescued')
                ->count(),
            'rescued' => $residents->where('status', 'rescued')->count(),
            'evacuated' => $residents->where('status', 'evacuated')->count(),
        ];
    }
}
