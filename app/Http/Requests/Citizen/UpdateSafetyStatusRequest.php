<?php

namespace App\Http\Requests\Citizen;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSafetyStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['safe', 'help', 'rescue'])],
            'assistance_type' => ['nullable', 'string', 'max:150'],
            'situation' => ['nullable', 'string', 'max:1000'],
            'priority' => ['nullable', 'string', 'max:200'],
        ];
    }
}
