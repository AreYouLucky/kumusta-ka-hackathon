<?php

namespace App\Http\Controllers\GCC;

use App\Http\Controllers\Controller;
use App\Models\DisasterIncident;
use Inertia\Inertia;
use Inertia\Response;

class GCCDashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('gcc/dashboard', [
            'incidents' => $this->incidents(),
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
}
