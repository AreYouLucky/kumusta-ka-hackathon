<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CitizenSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('citizens/auth/login');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mobile_number' => ['required', 'string', 'max:30'],
        ]);

        $mobileNumber = $this->normalizeMobileNumber($validated['mobile_number']);

        if ($mobileNumber === null) {
            throw ValidationException::withMessages([
                'mobile_number' => 'Enter a valid Philippine mobile number.',
            ]);
        }

        $citizen = User::query()
            ->whereRaw('LOWER(role) = ?', ['citizen'])
            ->where('mobile_number', $mobileNumber)
            ->orderBy('id')
            ->first();

        if ($citizen === null) {
            throw ValidationException::withMessages([
                'mobile_number' => 'No citizen account was found for this mobile number.',
            ]);
        }

        Auth::login($citizen);
        $request->session()->regenerate();
        $citizen->update(['last_login' => now()]);

        return to_route('citizen.home');
    }

    private function normalizeMobileNumber(string $mobileNumber): ?string
    {
        $digits = preg_replace('/\D+/', '', $mobileNumber);

        if ($digits === null) {
            return null;
        }

        if (str_starts_with($digits, '63')) {
            $digits = '0'.substr($digits, 2);
        } elseif (strlen($digits) === 10 && str_starts_with($digits, '9')) {
            $digits = '0'.$digits;
        }

        return preg_match('/^09\d{9}$/', $digits) === 1 ? $digits : null;
    }
}
