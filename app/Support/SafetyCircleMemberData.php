<?php

namespace App\Support;

use App\Models\SafetyCircleMember;

class SafetyCircleMemberData
{
    /**
     * @return array<string, mixed>
     */
    public static function fromMembership(SafetyCircleMember $membership, ?int $currentUserId = null): array
    {
        $membership->loadMissing('user');

        return [
            'id' => $membership->id,
            'name' => collect([
                $membership->user->fname,
                $membership->user->mname,
                $membership->user->lname,
                $membership->user->suffix,
            ])->filter()->join(' '),
            'initials' => collect([$membership->user->fname, $membership->user->lname])
                ->filter()
                ->map(fn (string $name): string => mb_strtoupper(mb_substr($name, 0, 1)))
                ->join(''),
            'relationship' => $membership->relationship,
            'status' => $membership->safety_status,
            'responseStatus' => $membership->response_status,
            'updatedAt' => $membership->checked_in_at?->diffForHumans() ?? 'No response yet',
            'lastSeenLocation' => self::lastSeenLocation($membership),
            'isCurrentUser' => $currentUserId === null ? null : $membership->user_id === $currentUserId,
        ];
    }

    /**
     * @return array<string, float|string|null>|null
     */
    public static function lastSeenLocation(SafetyCircleMember $membership): ?array
    {
        if ($membership->last_seen_latitude === null || $membership->last_seen_longitude === null) {
            return null;
        }

        return [
            'name' => $membership->last_seen_location_name ?? 'Last seen location',
            'latitude' => (float) $membership->last_seen_latitude,
            'longitude' => (float) $membership->last_seen_longitude,
            'recordedAt' => $membership->last_seen_at?->diffForHumans(),
        ];
    }
}
