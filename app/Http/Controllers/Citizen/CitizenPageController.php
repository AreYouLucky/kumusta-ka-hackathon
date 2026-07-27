<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use App\Services\DisasterCircleService;
use App\Support\SafetyCircleMemberData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CitizenPageController extends Controller
{
    public function __construct(private DisasterCircleService $disasterCircleService) {}

    public function index(Request $request): Response
    {
        $userId = $request->user()->id;
        $circles = SafetyCircle::query()
            ->visibleTo($userId)
            ->with(['memberships.user'])
            ->latest()
            ->get()
            ->map(fn (SafetyCircle $circle): array => $this->circleSummary($circle));

        return Inertia::render('citizens/frontend/Prompt', [
            'circles' => $circles,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('citizens/frontend/CreateCircle');
    }

    public function show(Request $request, SafetyCircle $circle): Response
    {
        $circle = SafetyCircle::query()
            ->visibleTo($request->user()->id)
            ->with(['memberships.user'])
            ->findOrFail($circle->id);

        return Inertia::render('citizens/frontend/CircleDetails', [
            'circle' => $this->circleDetails($circle, $request->user()->id),
        ]);
    }

    public function preparedness(): Response
    {
        return Inertia::render('citizens/frontend/Preparedness');
    }

    public function advisory(): Response
    {
        return Inertia::render('citizens/frontend/Advisory');
    }

    public function profile(): Response
    {
        return Inertia::render('citizens/frontend/Profile');
    }

    private function circleSummary(SafetyCircle $circle): array
    {
        $memberships = $circle->memberships;

        return [
            'id' => $circle->id,
            'name' => $circle->name,
            'memberCount' => $memberships->count(),
            'location' => $circle->location_name,
            'safeCount' => $memberships->where('safety_status', 'safe')->count(),
            'notRespondingCount' => $memberships->where('safety_status', 'no_response')->count(),
            'helpCount' => $memberships->where('safety_status', 'help')->count(),
            'urgentAssistanceCount' => $memberships->where('safety_status', 'rescue')->count(),
            'avatarLabels' => $memberships
                ->take(4)
                ->map(fn (SafetyCircleMember $membership): string => $this->initials($membership->user))
                ->values(),
            'calamityStatus' => $this->calamityStatus($circle),
        ];
    }

    private function circleDetails(SafetyCircle $circle, int $currentUserId): array
    {
        return [
            'id' => $circle->id,
            'name' => $circle->name,
            'description' => $circle->description ?? 'A private safety and emergency check-in circle.',
            'location' => $circle->location_name,
            'members' => $circle->memberships
                ->map(fn (SafetyCircleMember $membership): array => SafetyCircleMemberData::fromMembership($membership, $currentUserId))
                ->values(),
            'calamityStatus' => $this->calamityStatus($circle),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function calamityStatus(SafetyCircle $circle): array
    {
        $disaster = $this->disasterCircleService->activeForCircle($circle);

        if ($disaster === null) {
            return [
                'isAffected' => false,
                'label' => 'NOT AFFECTED',
                'title' => 'Outside active calamity areas',
                'description' => 'No active calamity currently covers this circle location.',
                'location' => $circle->location_name,
                'reportedAt' => 'Monitoring active incidents',
            ];
        }

        return [
            'isAffected' => true,
            'label' => 'AFFECTED BY CALAMITY',
            'title' => $disaster['title'],
            'description' => $disaster['description'] ?? 'This circle is inside the active calamity area. Check every member status now.',
            'location' => $disaster['location'],
            'reportedAt' => $disaster['reportedAt'],
            'hazardType' => $disaster['hazardType'],
            'severity' => $disaster['severity'],
        ];
    }

    private function initials(User $user): string
    {
        return collect([$user->fname, $user->lname])
            ->filter()
            ->map(fn (string $name): string => mb_strtoupper(mb_substr($name, 0, 1)))
            ->join('');
    }
}
