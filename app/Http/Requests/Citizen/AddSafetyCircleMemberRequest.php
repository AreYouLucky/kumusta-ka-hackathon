<?php

namespace App\Http\Requests\Citizen;

use Illuminate\Foundation\Http\FormRequest;

class AddSafetyCircleMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'member_code' => ['required', 'string', 'max:100', 'regex:/^KUMUSTAKA_MEMBER:[1-9][0-9]*$/'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'member_code.regex' => 'This is not a valid Kumusta Ka member QR code.',
        ];
    }
}
