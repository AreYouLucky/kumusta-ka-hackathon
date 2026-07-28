<?php

use App\Events\SafetyCircleMemberAdded;
use App\Support\BestEffortBroadcast;
use Illuminate\Support\Facades\Event;

test('broadcast failures do not escape into the main request', function () {
    Event::listen(
        SafetyCircleMemberAdded::class,
        fn (SafetyCircleMemberAdded $event): never => throw new RuntimeException('Broadcaster unavailable'),
    );

    BestEffortBroadcast::dispatch(new SafetyCircleMemberAdded(1, []));

    expect(true)->toBeTrue();
});
