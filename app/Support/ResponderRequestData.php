<?php

namespace App\Support;

use App\Models\SafetyCircleMember;

final class ResponderRequestData
{
    /**
     * @return array<string, mixed>
     */
    public static function fromMember(SafetyCircleMember $member): array
    {
        $member->loadMissing(['user', 'circle', 'responder']);

        return [
            'id' => $member->id,
            'citizen_id' => $member->user_id,
            'citizen_name' => collect([
                $member->user?->fname,
                $member->user?->mname,
                $member->user?->lname,
                $member->user?->suffix,
            ])->filter()->join(' '),
            'mobile_number' => $member->user?->mobile_number,
            'circle_name' => $member->circle?->name,
            'location_name' => $member->circle?->location_name,
            'latitude' => $member->circle?->latitude,
            'longitude' => $member->circle?->longitude,
            'safety_status' => $member->safety_status,
            'response_status' => $member->response_status,
            'assistance_type' => $member->assistance_type,
            'situation' => $member->situation,
            'priority' => $member->priority,
            'responder_id' => $member->responder_id,
            'responder_status' => $member->responder_status,
            'responder_name' => $member->responder === null
                ? null
                : collect([$member->responder->fname, $member->responder->lname])->filter()->join(' '),
            'checked_in_at' => $member->checked_in_at?->toISOString(),
            'accepted_at' => $member->accepted_at?->toISOString(),
            'resolved_at' => $member->resolved_at?->toISOString(),
        ];
    }
}
