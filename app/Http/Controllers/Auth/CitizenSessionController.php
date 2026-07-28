<?php

namespace App\Http\Controllers\Auth;

use App\Exceptions\EgovSsoException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EgovCitizenAuthenticator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CitizenSessionController extends Controller
{
    public function __construct(private EgovCitizenAuthenticator $authenticator) {}

    public function create(): Response
    {
        return Inertia::render('citizens/auth/login', [
            'testAccounts' => array_keys($this->testAccounts()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        if ($request->filled('mobile_number')) {
            return $this->storeMobileLogin($request);
        }

        $validated = $request->validate([
            'email' => ['required', 'email', Rule::in(array_keys($this->testAccounts()))],
        ]);

        try {
            $citizen = $this->authenticator->authenticate($this->testAccounts()[$validated['email']]);
        } catch (EgovSsoException $exception) {
            throw ValidationException::withMessages([
                'email' => $exception->getMessage(),
            ]);
        }

        Auth::login($citizen);
        $request->session()->regenerate();

        return to_route('citizen.home');
    }

    private function storeMobileLogin(Request $request): RedirectResponse
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

        $citizen->update(['last_login' => now()]);
        Auth::login($citizen);
        $request->session()->regenerate();

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

    /**
     * @return array<string, string>
     */
    private function testAccounts(): array
    {
        $accounts = config('services.egov_sso.test_accounts', []);

        if (! is_array($accounts)) {
            return [];
        }

        return collect($accounts)
            ->filter(fn (mixed $exchangeCode, mixed $email): bool => is_string($email)
                && is_string($exchangeCode)
                && $exchangeCode !== '')
            ->all();
    }
}
