<?php

namespace App\Services;

use App\Exceptions\EgovSsoException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EgovCitizenAuthenticator
{
    public function __construct(private EgovSsoClient $ssoClient) {}

    public function authenticate(string $exchangeCode): User
    {
        $profile = $this->ssoClient->authenticate($exchangeCode);
        $email = $this->requiredEmail($profile);
        $subject = $this->profileValue($profile, ['sub', 'subject', 'uuid', 'user_id', 'id']);

        return DB::transaction(function () use ($profile, $email, $subject): User {
            $userBySubject = $subject === null
                ? null
                : User::query()->where('egov_subject', $subject)->first();
            $userByEmail = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

            if ($userBySubject !== null && $userByEmail !== null && ! $userBySubject->is($userByEmail)) {
                throw new EgovSsoException('This eGov identity conflicts with an existing account.');
            }

            $citizen = $userBySubject ?? $userByEmail;

            if ($citizen !== null && strtolower((string) $citizen->role) !== 'citizen') {
                throw new EgovSsoException('This eGov identity is linked to a non-citizen account.');
            }

            $attributes = [
                'egov_subject' => $subject,
                'fname' => $this->requiredProfileValue($profile, [
                    'first_name',
                    'firstname',
                    'fname',
                    'given_name',
                    'personal_information.first_name',
                ], 'first name'),
                'mname' => $this->profileValue($profile, [
                    'middle_name',
                    'middlename',
                    'mname',
                    'personal_information.middle_name',
                ]),
                'lname' => $this->requiredProfileValue($profile, [
                    'last_name',
                    'lastname',
                    'lname',
                    'family_name',
                    'personal_information.last_name',
                ], 'last name'),
                'suffix' => $this->profileValue($profile, [
                    'suffix',
                    'suffix_name',
                    'personal_information.suffix',
                ]),
                'sex' => $this->profileValue($profile, ['sex', 'gender', 'personal_information.sex']),
                'email' => $email,
                'mobile_number' => $this->normalizeMobileNumber($this->profileValue($profile, [
                    'mobile_number',
                    'mobile',
                    'phone_number',
                    'contact_number',
                    'personal_information.mobile_number',
                ])),
                'role' => 'CITIZEN',
                'email_verified_at' => now(),
                'last_login' => now(),
                'egov_profile' => $profile,
                'egov_profile_synced_at' => now(),
            ];

            if ($citizen === null) {
                $attributes['username'] = $this->uniqueUsername(
                    $this->profileValue($profile, ['username', 'user_name']) ?? str($email)->before('@')->value(),
                );
                $attributes['password'] = Hash::make(Str::random(64));

                return User::create($attributes);
            }

            $citizen->update($attributes);

            return $citizen->refresh();
        });
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function requiredEmail(array $profile): string
    {
        $email = $this->profileValue($profile, ['email', 'email_address', 'personal_information.email']);
        $normalizedEmail = $email === null ? null : filter_var(strtolower($email), FILTER_VALIDATE_EMAIL);

        if (! is_string($normalizedEmail)) {
            throw new EgovSsoException('The eGov account did not include a valid email address.');
        }

        return $normalizedEmail;
    }

    /**
     * @param  array<string, mixed>  $profile
     * @param  list<string>  $keys
     */
    private function requiredProfileValue(array $profile, array $keys, string $label): string
    {
        $value = $this->profileValue($profile, $keys);

        if ($value === null) {
            throw new EgovSsoException("The eGov account did not include a {$label}.");
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $profile
     * @param  list<string>  $keys
     */
    private function profileValue(array $profile, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = data_get($profile, $key);

            if ((is_string($value) || is_int($value)) && trim((string) $value) !== '') {
                return trim((string) $value);
            }
        }

        return null;
    }

    private function uniqueUsername(string $preferred): string
    {
        $base = preg_replace('/[^a-z0-9._-]+/', '.', strtolower($preferred));
        $base = trim((string) $base, '.-_');
        $base = substr($base === '' ? 'citizen' : $base, 0, 24);
        $username = $base;
        $suffix = 1;

        while (User::query()->where('username', $username)->exists()) {
            $username = $base.'.'.$suffix;
            $suffix++;
        }

        return $username;
    }

    private function normalizeMobileNumber(?string $mobileNumber): ?string
    {
        if ($mobileNumber === null) {
            return null;
        }

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
