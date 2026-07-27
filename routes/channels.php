<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('responders', function ($user) {
    return in_array(strtolower((string) $user->role), ['responder', 'gcc'], true);
});
