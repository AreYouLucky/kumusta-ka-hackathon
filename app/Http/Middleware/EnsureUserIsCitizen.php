<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsCitizen
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return to_route('citizen.login');
        }

        if (strtolower((string) $user->role) !== 'citizen') {
            return to_route($user->dashboardRoute());
        }

        return $next($request);
    }
}
