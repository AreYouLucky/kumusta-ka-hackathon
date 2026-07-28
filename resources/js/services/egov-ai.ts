export type AssistanceMode = 'help' | 'rescue';

export type StructuredCitizenReport = {
    mode: AssistanceMode;
    assistanceType: string;
    situation: string;
    priority: string;
    agencyName: string;
    guidance: string[];
};

export type CitizenReportAnalysis = {
    translatedText: string;
    assistantResponse: string;
    structured: StructuredCitizenReport | null;
};

export async function analyzeCitizenReport(prompt: string, mode: AssistanceMode): Promise<CitizenReportAnalysis> {
    const response = await fetch(route('citizen.assistance.analyze'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({ prompt, mode }),
    });
    const payload: unknown = await response.json();

    if (!response.ok) {
        throw new Error(errorMessage(payload));
    }

    if (!isRecord(payload) || typeof payload.translated_text !== 'string' || typeof payload.assistant_response !== 'string') {
        throw new Error('eGovAI returned an invalid report analysis.');
    }

    return {
        translatedText: payload.translated_text,
        assistantResponse: payload.assistant_response,
        structured: structuredReport(payload.structured),
    };
}

function structuredReport(value: unknown): StructuredCitizenReport | null {
    if (!isRecord(value)) {
        return null;
    }

    const mode = value.mode;
    const assistanceType = value.assistance_type;
    const situation = value.situation;
    const priority = value.priority;
    const agencyName = value.agency_name;
    const guidance = value.guidance;

    if (
        (mode !== 'help' && mode !== 'rescue') ||
        typeof assistanceType !== 'string' ||
        typeof situation !== 'string' ||
        typeof priority !== 'string' ||
        typeof agencyName !== 'string' ||
        !Array.isArray(guidance) ||
        !guidance.every((item): item is string => typeof item === 'string')
    ) {
        return null;
    }

    return {
        mode,
        assistanceType,
        situation,
        priority,
        agencyName,
        guidance,
    };
}

function errorMessage(payload: unknown): string {
    if (isRecord(payload)) {
        const promptErrors = isRecord(payload.errors) ? payload.errors.prompt : undefined;

        if (Array.isArray(promptErrors) && typeof promptErrors[0] === 'string') {
            return promptErrors[0];
        }

        if (typeof payload.message === 'string') {
            return payload.message;
        }
    }

    return 'eGovAI could not process the citizen report.';
}

function xsrfToken(): string {
    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='))
        ?.slice('XSRF-TOKEN='.length);

    return cookie === undefined ? '' : decodeURIComponent(cookie);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
