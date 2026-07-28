<?php

namespace App\Services;

use App\Exceptions\EgovMessageException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;

class EgovMessageClient
{
    public function __construct(private HttpFactory $http) {}

    public function push(string $message): void
    {
        try {
            $response = $this->http
                ->acceptJson()
                ->asJson()
                ->withHeaders([
                    'X-EMESSAGE-Auth' => $this->requiredConfig('services.egov_message.auth_token'),
                ])
                ->timeout(15)
                ->post($this->requiredConfig('services.egov_message.endpoint'), [
                    'number' => $this->requiredConfig('services.egov_message.recipient'),
                    'message' => $message,
                ]);
        } catch (ConnectionException) {
            throw new EgovMessageException('The eGov messaging service is currently unavailable.');
        }

        if (! $response->successful()) {
            throw new EgovMessageException('The emergency SMS could not be delivered.');
        }
    }

    private function requiredConfig(string $key): string
    {
        $value = config($key);

        if (! is_string($value) || trim($value) === '') {
            throw new EgovMessageException('The eGov messaging service is not configured.');
        }

        return $value;
    }
}
