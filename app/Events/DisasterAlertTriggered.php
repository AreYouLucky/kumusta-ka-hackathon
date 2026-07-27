<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DisasterAlertTriggered implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<string, mixed>  $disaster
     * @param  array<int, int>  $userIds
     */
    public function __construct(
        public array $disaster,
        public array $userIds,
    ) {}

    public function broadcastOn(): array
    {
        return collect($this->userIds)
            ->map(fn (int $userId): PrivateChannel => new PrivateChannel("App.Models.User.{$userId}"))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->disaster;
    }
}
