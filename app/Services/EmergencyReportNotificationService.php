<?php

namespace App\Services;

use App\Exceptions\EgovAiException;
use App\Exceptions\EgovMessageException;
use App\Models\SafetyCircleMember;
use Illuminate\Support\Facades\Log;

class EmergencyReportNotificationService
{
    public function __construct(
        private EgovAiClient $egovAi,
        private EgovMessageClient $messaging,
    ) {}

    public function send(SafetyCircleMember $member): bool
    {
        if (! config('services.egov_message.enabled', false)) {
            return false;
        }

        $member->loadMissing(['user', 'circle']);
        $latitude = (float) ($member->last_seen_latitude ?? $member->circle->latitude);
        $longitude = (float) ($member->last_seen_longitude ?? $member->circle->longitude);
        $name = collect([
            $member->user->fname,
            $member->user->mname,
            $member->user->lname,
            $member->user->suffix,
        ])->filter()->join(' ');

        try {
            $message = $this->egovAi->structureEmergencySms(
                name: $name,
                assistanceType: $member->assistance_type ?? 'Emergency assistance',
                situation: $member->situation ?? 'The citizen requested assistance.',
                priority: $member->priority ?? strtoupper($member->safety_status),
                latitude: $latitude,
                longitude: $longitude,
            );
        } catch (EgovAiException $exception) {
            Log::warning('Emergency SMS AI structuring failed; using the safe fallback format.', [
                'safety_circle_member_id' => $member->id,
                'exception' => $exception::class,
            ]);
            $message = $this->fallbackMessage($member, $name, $latitude, $longitude);
        }

        try {
            $this->messaging->push($message);
        } catch (EgovMessageException $exception) {
            Log::warning('Emergency SMS delivery failed.', [
                'safety_circle_member_id' => $member->id,
                'exception' => $exception::class,
            ]);

            return false;
        }

        return true;
    }

    private function fallbackMessage(
        SafetyCircleMember $member,
        string $name,
        float $latitude,
        float $longitude,
    ): string {
        $assistanceType = $member->assistance_type ?? 'Emergency assistance';
        $situation = $member->situation ?? 'The citizen requested assistance.';
        $priority = $member->priority ?? strtoupper($member->safety_status);

        return "Citizen: {$name} | Assistance: {$assistanceType} | Situation: {$situation} | Priority: {$priority} | Latitude: {$latitude} | Longitude: {$longitude} | Coordinate with the nearest responder.";
    }
}
