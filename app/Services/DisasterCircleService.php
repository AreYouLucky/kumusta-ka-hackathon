<?php

namespace App\Services;

use App\Events\AffectedResidentsChanged;
use App\Events\CitizenAssistanceStatusUpdated;
use App\Events\DisasterAlertTriggered;
use App\Events\SafetyCircleMemberStatusUpdated;
use App\Models\AffectedResident;
use App\Models\DisasterIncident;
use App\Models\SafetyCircle;
use App\Models\SafetyCircleMember;
use App\Models\User;
use App\Support\BestEffortBroadcast;
use App\Support\GeoDistance;
use App\Support\ResponderRequestData;
use App\Support\SafetyCircleMemberData;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DisasterCircleService
{
    public function activate(DisasterIncident $incident): void
    {
        $circles = $this->affectedCircles($incident);

        if ($circles->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($circles): void {
            $circles->each(function (SafetyCircle $circle): void {
                $circle->memberships()->update([
                    'safety_status' => 'no_response',
                    'response_status' => null,
                    'assistance_type' => null,
                    'situation' => null,
                    'priority' => null,
                    'responder_id' => null,
                    'responder_status' => null,
                    'accepted_at' => null,
                    'resolved_at' => null,
                    'checked_in_at' => null,
                ]);
            });
        });

        $circles->load('memberships.user');
        $this->syncAffectedCircleMembers($incident, $circles);
        BestEffortBroadcast::dispatch(new AffectedResidentsChanged($incident->id, 'disaster_activated'));

        $circles->each(function (SafetyCircle $circle): void {
            $circle->memberships->each(function (SafetyCircleMember $membership) use ($circle): void {
                BestEffortBroadcast::dispatch(new SafetyCircleMemberStatusUpdated(
                    $circle->id,
                    SafetyCircleMemberData::fromMembership($membership),
                ));
                BestEffortBroadcast::dispatch(new CitizenAssistanceStatusUpdated(
                    ResponderRequestData::fromMember($membership),
                ));
            });
        });

        $userIds = $circles
            ->flatMap(fn (SafetyCircle $circle) => $circle->memberships->pluck('user_id'))
            ->unique()
            ->values()
            ->all();

        BestEffortBroadcast::dispatch(new DisasterAlertTriggered($this->disasterData($incident), $userIds));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function activeForUser(User $user): ?array
    {
        $circles = SafetyCircle::query()
            ->visibleTo($user->id)
            ->get();

        if ($circles->isEmpty()) {
            return null;
        }

        $incident = DisasterIncident::query()
            ->whereIn('status', ['monitoring', 'dispatching'])
            ->latest()
            ->get()
            ->first(fn (DisasterIncident $incident): bool => $circles->contains(
                fn (SafetyCircle $circle): bool => $this->incidentAffectsCircle($incident, $circle),
            ));

        return $incident === null ? null : $this->disasterData($incident);
    }

    public function hasActiveDisasterForCircle(SafetyCircle $circle): bool
    {
        return $this->activeForCircle($circle) !== null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function activeForCircle(SafetyCircle $circle): ?array
    {
        $incident = $this->activeIncidentForCircle($circle);

        return $incident === null ? null : $this->disasterData($incident);
    }

    public function syncMemberWithActiveDisaster(SafetyCircleMember $member): void
    {
        $member->loadMissing(['circle', 'user']);
        $incident = $this->activeIncidentForCircle($member->circle);

        if ($incident !== null) {
            $affectedResident = $this->syncAffectedCircleMember($incident, $member);
            BestEffortBroadcast::dispatch(
                new AffectedResidentsChanged($incident->id, 'circle_member_added', $affectedResident->id, $member->id)
            );
        }
    }

    public function syncActiveAffectedCircleMembers(): void
    {
        DisasterIncident::query()
            ->whereIn('status', ['monitoring', 'dispatching'])
            ->get()
            ->each(function (DisasterIncident $incident): void {
                $this->syncAffectedCircleMembers($incident, $this->affectedCircles($incident));
            });
    }

    public function syncAffectedResidentStatus(SafetyCircleMember $member): void
    {
        $affectedResidents = AffectedResident::query()
            ->where('safety_circle_member_id', $member->id)
            ->whereHas('incident', fn ($query) => $query->whereIn('status', ['monitoring', 'dispatching']))
            ->get();

        $affectedResidents->each(function (AffectedResident $affectedResident) use ($member): void {
            $affectedResident->update([
                'resident_status' => $this->residentStatus($member->safety_status),
                'circle_safety_status' => $member->safety_status,
                'assistance_type' => $member->assistance_type,
                'situation' => $member->situation,
                'priority' => $member->priority,
            ]);

            BestEffortBroadcast::dispatch(new AffectedResidentsChanged(
                $affectedResident->disaster_incident_id,
                'citizen_status_updated',
                $affectedResident->id,
                $member->id,
            ));
        });
    }

    public function syncResponderTransaction(SafetyCircleMember $member): void
    {
        AffectedResident::query()
            ->where('safety_circle_member_id', $member->id)
            ->whereHas('incident', fn ($query) => $query->whereIn('status', ['monitoring', 'dispatching']))
            ->get()
            ->each(function (AffectedResident $affectedResident) use ($member): void {
                $affectedResident->update([
                    'resident_status' => 3,
                    'status' => $member->responder_status === 'resolved' ? 'rescued' : $affectedResident->status,
                ]);

                BestEffortBroadcast::dispatch(new AffectedResidentsChanged(
                    $affectedResident->disaster_incident_id,
                    "responder_{$member->responder_status}",
                    $affectedResident->id,
                    $member->id,
                ));
            });
    }

    public function markAffectedResidentSafe(AffectedResident $affectedResident): void
    {
        $member = DB::transaction(function () use ($affectedResident): ?SafetyCircleMember {
            $affectedResident->update([
                'resident_status' => 1,
                'circle_safety_status' => $affectedResident->safety_circle_member_id === null ? null : 'safe',
                'assistance_type' => null,
                'situation' => null,
                'priority' => null,
            ]);

            $member = $affectedResident->safetyCircleMember;

            if ($member !== null) {
                $member->update([
                    'safety_status' => 'safe',
                    'response_status' => null,
                    'assistance_type' => null,
                    'situation' => null,
                    'priority' => null,
                    'responder_id' => null,
                    'responder_status' => null,
                    'accepted_at' => null,
                    'resolved_at' => now(),
                    'checked_in_at' => now(),
                ]);
            }

            return $member;
        });

        $this->broadcastUrgentTransaction($affectedResident, 'marked_safe', $member);
    }

    public function dispatchAffectedResidentResponder(AffectedResident $affectedResident): void
    {
        $member = DB::transaction(function () use ($affectedResident): ?SafetyCircleMember {
            $member = $affectedResident->safetyCircleMember;
            $assistanceType = $affectedResident->assistance_type ?? 'Emergency response requested by GCC';
            $priority = $affectedResident->priority ?? 'URGENT - responder dispatch requested by GCC';

            $affectedResident->update([
                'resident_status' => 3,
                'circle_safety_status' => $member === null ? null : 'rescue',
                'assistance_type' => $assistanceType,
                'priority' => $priority,
            ]);

            if ($member !== null) {
                $member->update([
                    'safety_status' => 'rescue',
                    'response_status' => 'responders_dispatched',
                    'assistance_type' => $assistanceType,
                    'situation' => $affectedResident->situation,
                    'priority' => $priority,
                    'responder_id' => null,
                    'responder_status' => 'pending',
                    'accepted_at' => null,
                    'resolved_at' => null,
                    'checked_in_at' => now(),
                ]);
            }

            return $member;
        });

        $this->broadcastUrgentTransaction($affectedResident, 'responder_dispatched', $member);
    }

    /**
     * @return Collection<int, SafetyCircle>
     */
    private function affectedCircles(DisasterIncident $incident): Collection
    {
        return SafetyCircle::query()
            ->with('memberships.user')
            ->get()
            ->filter(fn (SafetyCircle $circle): bool => $this->incidentAffectsCircle($incident, $circle))
            ->values();
    }

    private function activeIncidentForCircle(SafetyCircle $circle): ?DisasterIncident
    {
        return DisasterIncident::query()
            ->whereIn('status', ['monitoring', 'dispatching'])
            ->latest()
            ->get()
            ->first(fn (DisasterIncident $incident): bool => $this->incidentAffectsCircle($incident, $circle));
    }

    /**
     * @param  Collection<int, SafetyCircle>  $circles
     */
    private function syncAffectedCircleMembers(DisasterIncident $incident, Collection $circles): void
    {
        $circles->each(function (SafetyCircle $circle) use ($incident): void {
            $circle->memberships->each(
                fn (SafetyCircleMember $member) => $this->syncAffectedCircleMember($incident, $member)
            );
        });
    }

    private function syncAffectedCircleMember(DisasterIncident $incident, SafetyCircleMember $member): AffectedResident
    {
        $member->loadMissing(['circle', 'user']);
        $location = mb_strtolower($member->circle->location_name);

        $affectedResident = AffectedResident::firstOrNew([
            'disaster_incident_id' => $incident->id,
            'safety_circle_member_id' => $member->id,
        ]);
        $isNewRecord = ! $affectedResident->exists;

        $affectedResident->fill([
            'residence_id' => null,
            'created_by' => $incident->created_by,
            'household_number' => "CIRCLE-{$member->circle->id}",
            'first_name' => $member->user->fname,
            'middle_name' => $member->user->mname,
            'last_name' => $member->user->lname,
            'suffix' => $member->user->suffix,
            'birthdate' => null,
            'sex' => $this->normalizedSex($member->user->sex),
            'contact_number' => $member->user->mobile_number,
            'province' => str_contains($location, 'taguig') ? 'Metro Manila' : null,
            'city' => str_contains($location, 'taguig') ? 'Taguig City' : $member->circle->location_name,
            'barangay' => str_contains($location, 'central bicutan') ? 'Central Bicutan' : null,
            'address_line' => $member->circle->location_name,
            'circle_safety_status' => $member->safety_status,
            'assistance_type' => $member->assistance_type,
            'situation' => $member->situation,
            'priority' => $member->priority,
        ]);

        if ($member->responder_status === 'resolved') {
            $affectedResident->fill([
                'status' => 'rescued',
                'resident_status' => 3,
            ]);
        } elseif ($isNewRecord) {
            $affectedResident->fill([
                'status' => 'possibly_affected',
                'resident_status' => $this->residentStatus($member->safety_status),
            ]);
        }

        $affectedResident->save();

        return $affectedResident;
    }

    private function broadcastUrgentTransaction(
        AffectedResident $affectedResident,
        string $action,
        ?SafetyCircleMember $member,
    ): void {
        BestEffortBroadcast::dispatch(new AffectedResidentsChanged(
            $affectedResident->disaster_incident_id,
            $action,
            $affectedResident->id,
            $member?->id,
        ));

        if ($member === null) {
            return;
        }

        $member->refresh()->load(['user', 'circle', 'responder']);
        BestEffortBroadcast::dispatch(new CitizenAssistanceStatusUpdated(ResponderRequestData::fromMember($member)));
        BestEffortBroadcast::dispatch(new SafetyCircleMemberStatusUpdated(
            $member->safety_circle_id,
            SafetyCircleMemberData::fromMembership($member),
        ));
    }

    private function normalizedSex(?string $sex): string
    {
        return match (mb_strtolower((string) $sex)) {
            'female' => 'female',
            'male' => 'male',
            default => 'other',
        };
    }

    private function residentStatus(string $safetyStatus): int
    {
        return match ($safetyStatus) {
            'safe' => 1,
            'help' => 2,
            'rescue' => 3,
            default => 0,
        };
    }

    private function incidentAffectsCircle(DisasterIncident $incident, SafetyCircle $circle): bool
    {
        return GeoDistance::meters(
            (float) $incident->latitude,
            (float) $incident->longitude,
            (float) $circle->latitude,
            (float) $circle->longitude,
        ) <= $incident->radius_meters;
    }

    /**
     * @return array<string, mixed>
     */
    private function disasterData(DisasterIncident $incident): array
    {
        return [
            'id' => $incident->id,
            'title' => $incident->title,
            'hazardType' => $incident->hazard_type,
            'severity' => $incident->severity,
            'location' => $incident->location_name ?: 'Your safety circle area',
            'description' => $incident->description,
            'reportedAt' => $incident->updated_at?->diffForHumans() ?? 'Just now',
        ];
    }
}
