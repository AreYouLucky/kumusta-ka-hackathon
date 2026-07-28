<?php

namespace App\Services;

use App\Exceptions\EgovAiException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Response;

class EgovAiClient
{
    public function __construct(private HttpFactory $http) {}

    /**
     * @return array{
     *     translated_text: string,
     *     assistant_response: string,
     *     structured: array<string, mixed>|null
     * }
     */
    public function analyzeCitizenReport(string $prompt, string $mode): array
    {
        $translatedText = $this->translate($prompt);
        $assistantResponse = $this->generateGuidance($translatedText, $mode);

        return [
            'translated_text' => $translatedText,
            'assistant_response' => $assistantResponse,
            'structured' => $this->structuredResponse($assistantResponse, $mode),
        ];
    }

    private function translate(string $prompt): string
    {
        $translationPrompt = <<<PROMPT
Translate this Filipino emergency report into English. Return only the English translation without advice or explanation:
"{$prompt}"
PROMPT;

        $response = $this->post('/api/v1/egov/integration/speech_maker/generate', [
            'prompt' => $translationPrompt,
            'source_lang' => $this->requiredConfig('services.egov_ai.source_lang'),
            'target_lang' => $this->requiredConfig('services.egov_ai.target_lang'),
        ]);

        return $this->generatedText($response, 'translation');
    }

    private function generateGuidance(string $translatedText, string $mode): string
    {
        $prompt = <<<PROMPT
Analyze this Philippine citizen emergency report: "{$translatedText}"

Return only valid JSON using this structure:
{
  "mode": "help or rescue",
  "assistance_type": "short English assistance category",
  "situation": "clear English restatement of the report",
  "priority": "LOW, MODERATE, HIGH, or CRITICAL with a short reason",
  "agency_name": "most appropriate Philippine emergency or LGU office",
  "guidance": ["immediate action 1", "immediate action 2", "when appropriate call 911"]
}

The current citizen-selected report mode is "{$mode}". Upgrade it to rescue when the report indicates immediate danger.
PROMPT;

        $response = $this->post('/api/v1/egov/integration/ai_assistant/generate', [
            'prompt' => $prompt,
            'category' => $this->requiredConfig('services.egov_ai.category'),
        ]);

        return $this->generatedText($response, 'assistant response');
    }

    /**
     * @param  array<string, string>  $payload
     */
    private function post(string $path, array $payload): Response
    {
        try {
            $response = $this->http
                ->acceptJson()
                ->asJson()
                ->withToken($this->requiredConfig('services.egov_ai.token'))
                ->timeout(20)
                ->post($this->requiredConfig('services.egov_ai.base_url').$path, $payload);
        } catch (ConnectionException) {
            throw new EgovAiException('eGovAI is currently unavailable.');
        }

        if (! $response->successful()) {
            throw new EgovAiException('eGovAI could not process the citizen report.');
        }

        return $response;
    }

    private function generatedText(Response $response, string $label): string
    {
        $payload = $response->json();

        if (is_string($payload) && trim($payload) !== '') {
            return trim($payload);
        }

        if (! is_array($payload)) {
            throw new EgovAiException("The eGovAI {$label} was invalid.");
        }

        $generatedText = $this->findGeneratedText($payload);

        if ($generatedText !== null) {
            return $generatedText;
        }

        throw new EgovAiException(
            "The eGovAI {$label} was missing. Response fields: ".implode(', ', $this->payloadKeys($payload)),
        );
    }

    /**
     * @param  array<array-key, mixed>  $payload
     */
    private function findGeneratedText(array $payload): ?string
    {
        $textKeys = [
            'translated_text',
            'translatedtext',
            'translation',
            'translation_result',
            'generated_text',
            'response',
            'response_text',
            'answer',
            'result',
            'content',
            'output',
            'text',
            'completion',
            'data',
        ];

        foreach ($payload as $key => $value) {
            $normalizedKey = strtolower(str_replace(['-', ' '], '_', (string) $key));

            if (in_array($normalizedKey, $textKeys, true) && is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        foreach ($payload as $value) {
            if (! is_array($value)) {
                continue;
            }

            $nestedText = $this->findGeneratedText($value);

            if ($nestedText !== null) {
                return $nestedText;
            }
        }

        return null;
    }

    /**
     * @param  array<array-key, mixed>  $payload
     * @return list<string>
     */
    private function payloadKeys(array $payload, string $prefix = ''): array
    {
        $keys = [];

        foreach ($payload as $key => $value) {
            $path = $prefix === '' ? (string) $key : "{$prefix}.{$key}";
            $keys[] = $path;

            if (is_array($value)) {
                $keys = [...$keys, ...$this->payloadKeys($value, $path)];
            }
        }

        return array_slice($keys, 0, 30);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function structuredResponse(string $response, string $fallbackMode): ?array
    {
        $withoutFences = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', trim($response));

        if ($withoutFences === null) {
            return null;
        }

        $start = strpos($withoutFences, '{');
        $end = strrpos($withoutFences, '}');

        if ($start === false || $end === false || $end < $start) {
            return null;
        }

        $decoded = json_decode(substr($withoutFences, $start, $end - $start + 1), true);

        if (! is_array($decoded)) {
            return null;
        }

        $decodedMode = $decoded['mode'] ?? null;
        $decoded['mode'] = is_string($decodedMode) && in_array(strtolower($decodedMode), ['help', 'rescue'], true)
            ? strtolower($decodedMode)
            : $fallbackMode;

        return $decoded;
    }

    private function requiredConfig(string $key): string
    {
        $value = config($key);

        if (! is_string($value) || trim($value) === '') {
            throw new EgovAiException('eGovAI is not configured.');
        }

        return $key === 'services.egov_ai.base_url' ? rtrim($value, '/') : $value;
    }
}
