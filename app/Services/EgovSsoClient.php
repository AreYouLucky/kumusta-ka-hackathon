<?php

namespace App\Services;

use App\Exceptions\EgovSsoException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Response;

class EgovSsoClient
{
    public function __construct(private HttpFactory $http) {}

    /**
     * @return array<string, mixed>
     */
    public function authenticate(string $exchangeCode): array
    {
        $baseUrl = $this->requiredConfig('services.egov_sso.base_url');
        $partnerCode = $this->requiredConfig('services.egov_sso.partner_code');
        $partnerSecret = $this->requiredConfig('services.egov_sso.partner_secret');
        $scope = $this->requiredConfig('services.egov_sso.scope');

        try {
            $tokenResponse = $this->http
                ->acceptJson()
                ->asJson()
                ->timeout(15)
                ->post("{$baseUrl}/api/token", [
                    'exchange_code' => $exchangeCode,
                    'scope' => $scope,
                    'partner_code' => $partnerCode,
                    'partner_secret' => $partnerSecret,
                ]);
        } catch (ConnectionException) {
            throw new EgovSsoException('The eGov SSO service is currently unavailable.');
        }

        $accessToken = $this->accessToken($tokenResponse);

        try {
            $profileResponse = $this->http
                ->acceptJson()
                ->withToken($accessToken)
                ->timeout(15)
                ->get("{$baseUrl}/api/partner/sso_authentication");
        } catch (ConnectionException) {
            throw new EgovSsoException('The eGov SSO service is currently unavailable.');
        }

        if (! $profileResponse->successful()) {
            throw new EgovSsoException('The eGov account could not be retrieved.');
        }

        $payload = $profileResponse->json();

        if (! is_array($payload)) {
            throw new EgovSsoException('The eGov account response was invalid.');
        }

        return $this->unwrapProfile($payload);
    }

    private function accessToken(Response $response): string
    {
        if (! $response->successful()) {
            throw new EgovSsoException('The exchange code is invalid or has expired.');
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new EgovSsoException('The eGov token response was invalid.');
        }

        foreach (['access_token', 'data.access_token', 'token', 'data.token'] as $key) {
            $token = data_get($payload, $key);

            if (is_string($token) && $token !== '') {
                return $token;
            }
        }

        throw new EgovSsoException('The eGov token response did not include an access token.');
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function unwrapProfile(array $payload): array
    {
        foreach (['data.user', 'data.profile', 'data', 'user', 'profile', 'result'] as $key) {
            $profile = data_get($payload, $key);

            if (is_array($profile) && $profile !== []) {
                return $profile;
            }
        }

        return $payload;
    }

    private function requiredConfig(string $key): string
    {
        $value = config($key);

        if (! is_string($value) || trim($value) === '') {
            throw new EgovSsoException('eGov SSO is not configured.');
        }

        return $key === 'services.egov_sso.base_url'
            ? rtrim($value, '/')
            : $value;
    }
}
