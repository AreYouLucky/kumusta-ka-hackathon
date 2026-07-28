<?php

namespace App\Http\Controllers\Citizen;

use App\Exceptions\EgovAiException;
use App\Http\Controllers\Controller;
use App\Services\EgovAiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CitizenReportAnalysisController extends Controller
{
    public function __construct(private EgovAiClient $egovAi) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:2000'],
            'mode' => ['required', Rule::in(['help', 'rescue'])],
        ]);

        try {
            $result = $this->egovAi->analyzeCitizenReport(
                $validated['prompt'],
                $validated['mode'],
            );
        } catch (EgovAiException $exception) {
            throw ValidationException::withMessages([
                'prompt' => $exception->getMessage(),
            ]);
        }

        return response()->json($result);
    }
}
