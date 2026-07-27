<?php

namespace App\Http\Controllers\Citizen;

use App\Http\Controllers\Controller;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CitizenPageController extends Controller
{
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
            'notRespondingCount' => $memberships->where('safety_status', 'help')->count(),
            'urgentAssistanceCount' => $memberships->where('safety_status', 'rescue')->count(),
            'avatarLabels' => $memberships
                ->take(4)
                ->map(fn (SafetyCircleMember $membership): string => $this->initials($membership->user))
                ->values(),
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
                ->map(fn (SafetyCircleMember $membership): array => [
                    'id' => $membership->id,
                    'name' => $this->fullName($membership->user),
                    'initials' => $this->initials($membership->user),
                    'relationship' => $membership->relationship,
                    'status' => $membership->safety_status,
                    'responseStatus' => $membership->response_status,
                    'updatedAt' => ($membership->checked_in_at ?? $membership->updated_at)?->diffForHumans() ?? 'Not checked in',
                    'isCurrentUser' => $membership->user_id === $currentUserId,
                ])
                ->values(),
        ];
    }

    private function fullName(User $user): string
    {
        return collect([$user->fname, $user->mname, $user->lname, $user->suffix])
            ->filter()
            ->join(' ');
    }

    private function initials(User $user): string
    {
        return collect([$user->fname, $user->lname])
            ->filter()
            ->map(fn (string $name): string => mb_strtoupper(mb_substr($name, 0, 1)))
            ->join('');
    }
}
