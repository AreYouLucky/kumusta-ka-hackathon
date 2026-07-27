<?php

use App\Models\SafetyCircle;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('responders', function ($user) {
    return in_array(strtolower((string) $user->role), ['responder', 'gcc'], true);
});

Broadcast::channel('gcc.affected-residents', function ($user) {
    return in_array(strtolower((string) $user->role), ['gcc', 'administrator'], true);
});

Broadcast::channel('safety-circles.{circleId}', function ($user, int $circleId) {
    return SafetyCircle::query()
        ->visibleTo($user->id)
        ->whereKey($circleId)
        ->exists();
});
