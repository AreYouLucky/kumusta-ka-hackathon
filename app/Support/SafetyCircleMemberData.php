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
            'isCurrentUser' => $currentUserId === null ? null : $membership->user_id === $currentUserId,
        ];
    }
}
