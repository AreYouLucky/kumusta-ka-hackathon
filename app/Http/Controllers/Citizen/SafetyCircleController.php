<?php

namespace App\Http\Controllers\Citizen;

use App\Events\CitizenAssistanceStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Citizen\StoreSafetyCircleRequest;
use App\Http\Requests\Citizen\UpdateSafetyStatusRequest;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Support\ResponderRequestData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SafetyCircleController extends Controller
{
    public function store(StoreSafetyCircleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $circle = DB::transaction(function () use ($request, $validated): SafetyCircle {
            $circle = SafetyCircle::create([
                'owner_id' => $request->user()->id,
                'name' => $validated['name'],
                'location_name' => $validated['location'],
                'description' => $validated['description'] ?? null,
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ]);

            $circle->memberships()->create([
                'user_id' => $request->user()->id,
                'relationship' => 'You',
                'safety_status' => 'safe',
                'checked_in_at' => now(),
            ]);

            return $circle;
        });

        return to_route('citizen.circles.show', $circle);
    }

    public function updateStatus(
        UpdateSafetyStatusRequest $request,
        SafetyCircle $circle,
        SafetyCircleMember $member,
    ): RedirectResponse {
        $this->ensureCanManageCircle($request, $circle);

        abort_unless($member->safety_circle_id === $circle->id, 404);

        $validated = $request->validated();
        $status = $validated['status'];
        $member->update($this->statusAttributes($status, $validated));
        $this->broadcastMemberStatus($member);

        return back();
    }

    public function checkIn(UpdateSafetyStatusRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $status = $validated['status'];

        $members = SafetyCircleMember::query()
            ->where('user_id', $request->user()->id)
            ->get();

        $members->each(function (SafetyCircleMember $member) use ($status, $validated): void {
            $member->update($this->statusAttributes($status, $validated));
            $this->broadcastMemberStatus($member);
        });

        return back();
    }

    private function ensureCanManageCircle(Request $request, SafetyCircle $circle): void
    {
        $canManage = SafetyCircle::query()
            ->visibleTo($request->user()->id)
            ->whereKey($circle->id)
            ->exists();

        abort_unless($canManage, 404);
    }

    private function statusAttributes(string $status, array $details = []): array
    {
        return [
            'safety_status' => $status,
            'response_status' => match ($status) {
                'help' => 'forwarded_to_lgu',
                'rescue' => 'responders_dispatched',
                default => null,
            },
            'assistance_type' => $status === 'safe' ? null : ($details['assistance_type'] ?? null),
            'situation' => $status === 'safe' ? null : ($details['situation'] ?? null),
            'priority' => $status === 'safe' ? null : ($details['priority'] ?? null),
            'responder_id' => null,
            'responder_status' => in_array($status, ['help', 'rescue'], true) ? 'pending' : null,
            'accepted_at' => null,
            'resolved_at' => null,
            'checked_in_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function broadcastMemberStatus(SafetyCircleMember $member): void
    {
        $member->refresh()->load(['user', 'circle', 'responder']);
        broadcast(new CitizenAssistanceStatusUpdated(ResponderRequestData::fromMember($member)));
    }
}
