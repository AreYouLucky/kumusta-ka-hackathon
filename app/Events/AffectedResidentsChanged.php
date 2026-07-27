<?php

namespace App\Events;

use App\Models\AffectedResident;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AffectedResidentsChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $incidentId,
        public string $action,
        public ?int $affectedResidentId = null,
        public ?int $memberId = null,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('gcc.affected-residents'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $resident = $this->affectedResidentId === null
            ? null
            : AffectedResident::query()->find($this->affectedResidentId);

        return [
            'incidentId' => $this->incidentId,
            'action' => $this->action,
            'affectedResidentId' => $this->affectedResidentId,
            'memberId' => $this->memberId,
            'resident' => $resident === null ? null : [
                'id' => $resident->id,
                'status' => $resident->status,
                'resident_status' => $resident->resident_status,
                'circle_safety_status' => $resident->circle_safety_status,
                'assistance_type' => $resident->assistance_type,
                'situation' => $resident->situation,
                'priority' => $resident->priority,
                'is_no_response' => $resident->hasNoResponse(),
                'is_marked_safe' => $resident->isMarkedSafe(),
            ],
        ];
    }
}
