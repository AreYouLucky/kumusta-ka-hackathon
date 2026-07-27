<?php

namespace App\Events;

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
}
