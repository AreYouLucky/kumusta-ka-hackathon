<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.egov_ai.base_url' => 'https://egov-ai.test',
        'services.egov_ai.token' => 'test-hackathon-token',
        'services.egov_ai.source_lang' => 'fi',
        'services.egov_ai.target_lang' => 'en',
        'services.egov_ai.category' => 'PH',
    ]);
});

test('citizen report is translated and structured through eGovAI', function () {
    $citizen = User::factory()->create(['role' => 'citizen']);
    Http::fake([
        'https://egov-ai.test/api/v1/egov/integration/speech_maker/generate' => Http::response([
            'data' => ['translated_text' => 'Help, I am wounded.'],
        ]),
        'https://egov-ai.test/api/v1/egov/integration/ai_assistant/generate' => Http::response([
            'data' => [
                'response' => json_encode([
                    'mode' => 'rescue',
                    'assistance_type' => 'Emergency medical assistance',
                    'situation' => 'The citizen is wounded and needs immediate care.',
                    'priority' => 'CRITICAL - active injury',
                    'agency_name' => 'Local DRRMO / Emergency Medical Services',
                    'guidance' => [
                        'Apply pressure to active bleeding.',
                        'Keep the injured person still.',
                        'Call 911.',
                    ],
                ]),
            ],
        ]),
    ]);

    $this->actingAs($citizen)
        ->postJson(route('citizen.assistance.analyze'), [
            'prompt' => 'Tulong, nasugatan ako.',
            'mode' => 'help',
        ])
        ->assertOk()
        ->assertJsonPath('translated_text', 'Help, I am wounded.')
        ->assertJsonPath('structured.mode', 'rescue')
        ->assertJsonPath('structured.assistance_type', 'Emergency medical assistance')
        ->assertJsonPath('structured.guidance.2', 'Call 911.');

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://egov-ai.test/api/v1/egov/integration/speech_maker/generate'
        && $request->hasHeader('Authorization', 'Bearer test-hackathon-token')
        && $request['prompt'] === 'Tulong, nasugatan ako.'
        && $request['source_lang'] === 'fi'
        && $request['target_lang'] === 'en');

    Http::assertSent(fn (Request $request): bool => $request->url() === 'https://egov-ai.test/api/v1/egov/integration/ai_assistant/generate'
        && $request->hasHeader('Authorization', 'Bearer test-hackathon-token')
        && $request['category'] === 'PH'
        && str_contains($request['prompt'], 'Help, I am wounded.'));
});

test('citizen report analysis requires authentication', function () {
    $this->postJson(route('citizen.assistance.analyze'), [
        'prompt' => 'Tulong.',
        'mode' => 'rescue',
    ])->assertUnauthorized();
});

test('eGovAI errors are returned as report validation errors', function () {
    $citizen = User::factory()->create(['role' => 'citizen']);
    Http::fake([
        'https://egov-ai.test/api/v1/egov/integration/speech_maker/generate' => Http::response([], 503),
    ]);

    $this->actingAs($citizen)
        ->postJson(route('citizen.assistance.analyze'), [
            'prompt' => 'Kailangan ko ng tulong.',
            'mode' => 'help',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('prompt');

    Http::assertSentCount(1);
});
