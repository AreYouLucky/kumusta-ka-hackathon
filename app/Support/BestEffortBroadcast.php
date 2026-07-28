<?php

namespace App\Support;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Support\Facades\Event;
use Throwable;

final class BestEffortBroadcast
{
    public static function dispatch(ShouldBroadcast $event): void
    {
        try {
            Event::dispatch($event);
        } catch (Throwable) {
            // Real-time updates are optional and must not fail the main request.
        }
    }
}
