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
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return to_route('citizen.login');
        }

        if (strtolower((string) $user->role) !== 'citizen') {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'This action is only available to citizen accounts.'], 403);
            }

            return to_route($user->dashboardRoute());
        }

        return $next($request);
    }
}
