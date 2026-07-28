import {
    Building2,
    CheckCircle2,
    Clock3,
    FileCheck2,
    HeartHandshake,
    ImagePlus,
    Keyboard,
    LoaderCircle,
    MapPinned,
    Mic,
    Navigation,
    PencilLine,
    Phone,
    RotateCcw,
    Send,
    ShieldAlert,
    Sparkles,
    Trash2,
} from 'lucide-react';
import type { ChangeEvent, JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { analyzeCitizenReport } from '@/services/egov-ai';

import {
    assistanceResponseSeeds,
    createParsedAssistanceData,
    findAssistanceResponseSeed,
    type AssistanceFlowMode,
    type AssistanceResponseSeed,
    type ParsedAssistanceData,
} from '../assistance-response-seeder';

type HelpFlowStep = 'listening' | 'review' | 'sending' | 'guidance';

const silenceTimeoutMs = 5000;

export type { AssistanceFlowMode } from '../assistance-response-seeder';

type HelpAssistanceFlowProps = {
    mode: AssistanceFlowMode;
    onComplete: (submission: AssistanceSubmission) => void;
    subjectName?: string;
};

export type AssistanceSubmission = {
    mode: AssistanceFlowMode;
    assistanceType: string;
    situation: string;
    priority: string;
};

type AssistanceFlowContent = {
    initialData: ParsedAssistanceData;
    transcriptLines: readonly [string, string];
    transcript: string;
    reviewTitle: string;
    agencyName: string;
    guidance: readonly string[];
};

const assistanceFlowContent: Record<AssistanceFlowMode, AssistanceFlowContent> = {
    help: {
        initialData: {
            assistanceType: 'Food assistance / emergency food pack',
            situation: 'Wala nang makakain ang pamilya at kailangan ng agarang suplay ng pagkain',
            priority: 'Kailangan ng tulong — food assistance',
            address: 'DOST Compound, Central Bicutan, Taguig City',
            coordinates: '14.525347° N, 121.059675° E',
        },
        transcriptLines: ['Kailangan ko ng pagkain', 'Kasi wala na kami makakain'],
        transcript: 'Kailangan ko ng pagkain kasi wala na kami makakain.',
        reviewTitle: 'Suriin ang request para sa tulong',
        agencyName: 'Taguig City LGU / DRRMO',
        guidance: [
            'Manatili muna kung nasaan ka, kung ligtas ang lugar.',
            'Hintayin ang tawag o responder mula sa LGU.',
            'Huwag lumipat maliban kung may agarang panganib.',
            'Kung lumala ang sitwasyon, tumawag agad sa 911.',
        ],
    },
    rescue: {
        initialData: {
            assistanceType: 'Emergency rescue at trauma medical response',
            situation: 'May bakal na tumusok at nakabaon sa tagiliran; malakas ang pagdurugo at hindi makagalaw',
            priority: 'KRITIKAL — agarang saklolo',
            address: 'DOST Compound, Central Bicutan, Taguig City',
            coordinates: '14.525347° N, 121.059675° E',
        },
        transcriptLines: ['May bakal sa tagiliran ko', 'Tulong'],
        transcript: 'May bakal sa tagiliran ko. Tulong.',
        reviewTitle: 'Kumpirmahin ang agarang rescue request',
        agencyName: 'Taguig City DRRMO / Emergency Medical Services',
        guidance: [
            'Huwag alisin o galawin ang nakabaong bagay.',
            "Manatiling hindi gumagalaw hangga't maaari.",
            'Kung may kasama, idiin ang malinis na tela sa paligid ng sugat, hindi sa nakabaong bagay.',
            'Tumawag agad sa 911 habang hinihintay ang responders.',
        ],
    },
};

type SpeechRecognitionAlternativeLike = {
    transcript: string;
};

type SpeechRecognitionResultLike = {
    isFinal: boolean;
    length: number;
    [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = Event & {
    results: {
        length: number;
        [index: number]: SpeechRecognitionResultLike;
    };
};

type SpeechRecognitionErrorEventLike = Event & {
    error: string;
};

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type SpeechRecognitionWindow = Window & {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

function createTranscriptLines(message: string): readonly [string, string] {
    const sentenceParts = message
        .split(/[.!?]+/)
        .map((part) => part.trim())
        .filter((part) => part !== '');

    if (sentenceParts.length >= 2) {
        return [sentenceParts[0], sentenceParts.slice(1).join('. ')];
    }

    return [message, ''];
}

export function HelpAssistanceFlow({ mode, onComplete, subjectName }: HelpAssistanceFlowProps): JSX.Element {
    const defaultContent = assistanceFlowContent[mode];
    const [step, setStep] = useState<HelpFlowStep>('listening');
    const [visibleVoiceLineCount, setVisibleVoiceLineCount] = useState(0);
    const [visibleParseLineCount, setVisibleParseLineCount] = useState(0);
    const [parsedData, setParsedData] = useState<ParsedAssistanceData>(defaultContent.initialData);
    const [matchedResponse, setMatchedResponse] = useState<AssistanceResponseSeed | null>(null);
    const [capturedTranscript, setCapturedTranscript] = useState('');
    const [transcriptLines, setTranscriptLines] = useState<readonly [string, string]>(['', '']);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
    const [typedMessage, setTypedMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
    const [speechError, setSpeechError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [assistantResponse, setAssistantResponse] = useState<string | null>(null);
    const [aiMode, setAiMode] = useState<AssistanceFlowMode | null>(null);
    const [aiAgencyName, setAiAgencyName] = useState<string | null>(null);
    const [aiGuidance, setAiGuidance] = useState<readonly string[]>([]);
    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const silenceTimerRef = useRef<number | null>(null);
    const latestTranscriptRef = useRef('');
    const shouldContinueListeningRef = useRef(false);
    const resolvedMode = aiMode ?? matchedResponse?.mode ?? mode;
    const isUrgent = resolvedMode === 'rescue';
    const reviewTitle =
        matchedResponse === null
            ? defaultContent.reviewTitle
            : matchedResponse.mode === 'rescue'
              ? 'Kumpirmahin ang agarang rescue request'
              : 'Suriin ang request para sa tulong';
    const agencyName = aiAgencyName ?? matchedResponse?.agencyName ?? defaultContent.agencyName;
    const guidance = aiGuidance.length > 0 ? aiGuidance : (matchedResponse?.guidance ?? defaultContent.guidance);

    useEffect(() => {
        if (step === 'sending') {
            const guidanceTimer = window.setTimeout(() => setStep('guidance'), 3000);

            return () => window.clearTimeout(guidanceTimer);
        }
    }, [step]);

    useEffect(() => {
        return () => {
            if (attachmentPreviewUrl !== null) {
                URL.revokeObjectURL(attachmentPreviewUrl);
            }
        };
    }, [attachmentPreviewUrl]);

    const clearSilenceTimer = useCallback((): void => {
        if (silenceTimerRef.current !== null) {
            window.clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    function updateParsedData(field: keyof ParsedAssistanceData, value: string): void {
        setParsedData((currentData) => ({ ...currentData, [field]: value }));
    }

    function repeatListening(): void {
        shouldContinueListeningRef.current = false;
        clearSilenceTimer();
        recognitionRef.current?.stop();
        latestTranscriptRef.current = '';
        setCapturedTranscript('');
        setTranscriptLines(['', '']);
        setTypedMessage('');
        setMatchedResponse(null);
        setParsedData(defaultContent.initialData);
        setVisibleVoiceLineCount(0);
        setVisibleParseLineCount(0);
        setSpeechError(null);
        setAnalysisError(null);
        setAssistantResponse(null);
        setAiMode(null);
        setAiAgencyName(null);
        setAiGuidance([]);
        setIsAnalyzing(false);
        setStep('listening');
    }

    function selectAttachment(event: ChangeEvent<HTMLInputElement>): void {
        const selectedFile = event.target.files?.[0];

        if (selectedFile === undefined || !selectedFile.type.startsWith('image/')) {
            return;
        }

        setAttachment(selectedFile);
        setAttachmentPreviewUrl(URL.createObjectURL(selectedFile));
        event.target.value = '';
    }

    function removeAttachment(): void {
        setAttachment(null);
        setAttachmentPreviewUrl(null);
    }

    const applyMessage = useCallback(
        async (message: string): Promise<void> => {
            if (message === '') {
                return;
            }

            shouldContinueListeningRef.current = false;
            clearSilenceTimer();
            recognitionRef.current?.stop();
            setIsListening(false);
            setIsAnalyzing(true);
            setAnalysisError(null);

            setCapturedTranscript(message);
            setTranscriptLines(createTranscriptLines(message));
            setAssistantResponse(null);

            try {
                const analysis = await analyzeCitizenReport(message, mode);
                const response = findAssistanceResponseSeed(`${message} ${analysis.translatedText}`);
                const structured = analysis.structured;

                setCapturedTranscript(analysis.translatedText);
                setTranscriptLines(createTranscriptLines(analysis.translatedText));
                setMatchedResponse(response ?? null);
                setAssistantResponse(analysis.assistantResponse);
                setAiMode(structured?.mode ?? null);
                setAiAgencyName(structured?.agencyName ?? null);
                setAiGuidance(structured?.guidance ?? []);
                setParsedData(
                    structured === null
                        ? response === undefined
                            ? { ...defaultContent.initialData, situation: analysis.translatedText }
                            : createParsedAssistanceData(response)
                        : {
                              assistanceType: structured.assistanceType,
                              situation: structured.situation,
                              priority: structured.priority,
                              address: defaultContent.initialData.address,
                              coordinates: defaultContent.initialData.coordinates,
                          },
                );
            } catch (error: unknown) {
                const response = findAssistanceResponseSeed(message);

                setMatchedResponse(response ?? null);
                setParsedData(
                    response === undefined ? { ...defaultContent.initialData, situation: message } : createParsedAssistanceData(response),
                );
                setAnalysisError(error instanceof Error ? error.message : 'eGovAI could not process the report.');
            } finally {
                setVisibleVoiceLineCount(2);
                setVisibleParseLineCount(5);
                setIsAnalyzing(false);
                setStep('review');
            }
        },
        [clearSilenceTimer, defaultContent.initialData, mode],
    );

    function useTypedMessage(): void {
        void applyMessage(typedMessage.trim());
    }

    const scheduleSilenceReview = useCallback(
        (transcript: string): void => {
            latestTranscriptRef.current = transcript;
            clearSilenceTimer();
            silenceTimerRef.current = window.setTimeout(() => {
                void applyMessage(latestTranscriptRef.current.trim());
            }, silenceTimeoutMs);
        },
        [applyMessage, clearSilenceTimer],
    );

    const startSpeechRecognition = useCallback((): void => {
        const speechWindow = window as SpeechRecognitionWindow;
        const SpeechRecognitionConstructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

        if (SpeechRecognitionConstructor === undefined) {
            setSpeechError('Hindi suportado ng browser na ito ang speech-to-text. Gamitin muna ang manual input.');
            return;
        }

        shouldContinueListeningRef.current = false;
        clearSilenceTimer();
        recognitionRef.current?.stop();
        latestTranscriptRef.current = '';

        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fil-PH';
        recognition.onresult = (event) => {
            let spokenText = '';

            for (let index = 0; index < event.results.length; index += 1) {
                spokenText += event.results[index][0].transcript;
            }

            const normalizedSpokenText = spokenText.trim();
            if (normalizedSpokenText === '') {
                return;
            }

            const liveResponse = findAssistanceResponseSeed(normalizedSpokenText);

            setTypedMessage(normalizedSpokenText);
            setCapturedTranscript(normalizedSpokenText);
            setTranscriptLines(createTranscriptLines(normalizedSpokenText));
            setMatchedResponse(liveResponse ?? null);
            setParsedData(
                liveResponse === undefined
                    ? { ...defaultContent.initialData, situation: normalizedSpokenText }
                    : createParsedAssistanceData(liveResponse),
            );
            setVisibleVoiceLineCount(2);
            setVisibleParseLineCount(5);
            scheduleSilenceReview(normalizedSpokenText);
        };
        recognition.onerror = (event) => {
            shouldContinueListeningRef.current = false;
            clearSilenceTimer();
            setIsListening(false);
            setSpeechError(
                event.error === 'not-allowed'
                    ? 'Kailangan ang microphone permission para magamit ang speech-to-text.'
                    : 'Hindi malinaw ang audio. Subukan ulit o gamitin ang manual input.',
            );
        };
        recognition.onend = () => {
            setIsListening(false);

            if (shouldContinueListeningRef.current && latestTranscriptRef.current === '') {
                setSpeechError('Walang narinig. Pindutin ang microphone para subukan ulit o gamitin ang manual input.');
            }
        };

        recognitionRef.current = recognition;
        shouldContinueListeningRef.current = true;
        setSpeechError(null);
        setIsListening(true);

        try {
            recognition.start();
        } catch {
            shouldContinueListeningRef.current = false;
            setIsListening(false);
            setSpeechError('Hindi masimulan ang microphone. Pindutin ang microphone para subukan ulit.');
        }
    }, [clearSilenceTimer, defaultContent.initialData, scheduleSilenceReview]);

    useEffect(() => {
        const speechWindow = window as SpeechRecognitionWindow;
        const isSupported = speechWindow.SpeechRecognition !== undefined || speechWindow.webkitSpeechRecognition !== undefined;
        setIsSpeechRecognitionSupported(isSupported);

        if (step !== 'listening' || !isSupported) {
            return;
        }

        const autoStartTimer = window.setTimeout(startSpeechRecognition, 150);

        return () => {
            window.clearTimeout(autoStartTimer);
            shouldContinueListeningRef.current = false;
            clearSilenceTimer();
            recognitionRef.current?.stop();
        };
    }, [clearSilenceTimer, startSpeechRecognition, step]);

    if (step === 'listening') {
        return (
            <div className="py-5 text-center sm:py-6">
                <StepLabel currentStep={1} isUrgent={isUrgent} />
                <div className="relative mx-auto mt-6 grid size-24 place-items-center">
                    <span className={`absolute inset-0 animate-ping rounded-full opacity-60 ${isUrgent ? 'bg-red-200' : 'bg-orange-200'}`} />
                    <span className={`absolute inset-3 animate-pulse rounded-full ${isUrgent ? 'bg-red-100' : 'bg-orange-100'}`} />
                    <span
                        className={`relative grid size-14 place-items-center rounded-full text-white ${isUrgent ? 'bg-red-500 shadow-[0_8px_24px_rgba(239,68,68,0.35)]' : 'bg-orange-500 shadow-[0_8px_24px_rgba(249,115,22,0.32)]'}`}
                    >
                        <Mic className="size-6" aria-hidden="true" />
                    </span>
                </div>

                <h2 id="emergency-check-in-title" className="mt-5 text-xl font-black text-black">
                    {isListening
                        ? isUrgent
                            ? 'Nakikinig sa emergency situation...'
                            : 'Nakikinig sa iyong kailangan...'
                        : 'Handang makinig sa iyong sitwasyon'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Awtomatikong nakikinig. Pag tumigil kang magsalita nang 5 segundo, ipapakita ang mungkahing response.
                </p>
                <button
                    type="button"
                    disabled={isListening || isAnalyzing || !isSpeechRecognitionSupported}
                    onClick={startSpeechRecognition}
                    className={`mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${isUrgent ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500' : 'bg-orange-500 hover:bg-orange-600 focus-visible:outline-orange-500'}`}
                >
                    {isListening || isAnalyzing ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Mic className="size-4" aria-hidden="true" />
                    )}
                    {isAnalyzing ? 'Translating with eGovAI...' : isListening ? 'Live speech-to-text...' : 'Subukan ulit ang microphone'}
                </button>
                {speechError !== null && <p className="mt-2 text-xs font-semibold text-red-600">{speechError}</p>}
                {!isSpeechRecognitionSupported && speechError === null && (
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        Hindi available ang speech-to-text sa browser na ito. Puwede pa ring mag-type.
                    </p>
                )}

                <div className={`mt-5 rounded-2xl border p-4 text-left ${isUrgent ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                    <div className={`flex items-center gap-2 text-xs font-extrabold ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
                        <Sparkles className="size-4" aria-hidden="true" />
                        LIVE TRANSCRIPTION
                    </div>
                    <div className="mt-3 grid gap-2">
                        <VoiceTranscriptLine index={1} visibleLineCount={visibleVoiceLineCount} text={transcriptLines[0]} isUrgent={isUrgent} />
                        {transcriptLines[1] !== '' && (
                            <VoiceTranscriptLine index={2} visibleLineCount={visibleVoiceLineCount} text={transcriptLines[1]} isUrgent={isUrgent} />
                        )}
                    </div>
                    {capturedTranscript !== '' && (
                        <div className="mt-3 rounded-xl bg-white/75 px-3 py-2.5 text-xs font-bold">
                            {matchedResponse === null ? (
                                <span className="text-slate-500">Nakikinig para sa assistance keyword...</span>
                            ) : (
                                <span className={isUrgent ? 'text-red-700' : 'text-orange-700'}>
                                    Suggested response: {matchedResponse.label} — {matchedResponse.data.assistanceType}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-3 min-h-52 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm">
                    <p className="px-1 text-[10px] font-extrabold tracking-[0.14em] text-slate-400 uppercase">Analyzing request</p>
                    <div className="mt-2 grid gap-1.5">
                        <ParseLine
                            index={1}
                            visibleLineCount={visibleParseLineCount}
                            label="Voice transcript captured"
                            value={capturedTranscript}
                            isUrgent={isUrgent}
                        />
                        <ParseLine
                            index={2}
                            visibleLineCount={visibleParseLineCount}
                            label="Uri ng tulong"
                            value={parsedData.assistanceType}
                            isUrgent={isUrgent}
                        />
                        <ParseLine
                            index={3}
                            visibleLineCount={visibleParseLineCount}
                            label="Sitwasyon"
                            value={parsedData.situation}
                            isUrgent={isUrgent}
                        />
                        <ParseLine
                            index={4}
                            visibleLineCount={visibleParseLineCount}
                            label="Priority"
                            value={parsedData.priority}
                            isUrgent={isUrgent}
                        />
                        <ParseLine
                            index={5}
                            visibleLineCount={visibleParseLineCount}
                            label="Lokasyon"
                            value={`${parsedData.address} · ${parsedData.coordinates}`}
                            isUrgent={isUrgent}
                        />
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                    {isListening ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <Sparkles className="size-4" aria-hidden="true" />
                    )}
                    {isListening
                        ? capturedTranscript === ''
                            ? 'Listening for your response...'
                            : 'Waiting for 5 seconds of silence...'
                        : 'Magsalita muli o gamitin ang manual input sa ibaba.'}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                        <Keyboard className="size-4 text-sky-600" aria-hidden="true" />
                        Hindi makapagsalita?
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">I-type ang iyong sitwasyon at gagamitin ito sa request.</p>
                    <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Sample assistance keywords">
                        {assistanceResponseSeeds.map((response) => (
                            <button
                                key={response.id}
                                type="button"
                                onClick={() => setTypedMessage(response.sampleInput)}
                                className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                            >
                                {response.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        rows={3}
                        value={typedMessage}
                        onChange={(event) => setTypedMessage(event.target.value)}
                        placeholder="Ilarawan kung ano ang nangyari at anong tulong ang kailangan..."
                        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                    <button
                        type="button"
                        disabled={typedMessage.trim() === '' || isAnalyzing}
                        onClick={useTypedMessage}
                        className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${isUrgent ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500' : 'bg-sky-500 hover:bg-sky-600 focus-visible:outline-sky-500'}`}
                    >
                        {isAnalyzing ? (
                            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                            <Send className="size-3.5" aria-hidden="true" />
                        )}
                        {isAnalyzing ? 'Translating and analyzing...' : 'Gamitin ang typed message'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'review') {
        return (
            <div className="pt-4">
                <StepLabel currentStep={2} isUrgent={isUrgent} />
                <div className="mt-4">
                    <h2 id="emergency-check-in-title" className="text-xl font-black text-black">
                        {reviewTitle}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Ito ang impormasyong nakuha mula sa iyong voice input.</p>
                    {subjectName !== undefined && (
                        <p className={`mt-2 text-xs font-extrabold ${isUrgent ? 'text-red-600' : 'text-sky-600'}`}>
                            Status update para kay {subjectName}
                        </p>
                    )}
                </div>

                <div
                    className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${isUrgent ? 'bg-red-50 text-red-800' : 'bg-sky-50 text-sky-800'}`}
                >
                    <PencilLine className="size-4 shrink-0" aria-hidden="true" />
                    Maaari mong i-edit ang bawat na-parse na detalye bago ipadala.
                </div>

                <div className="mt-3 grid gap-3">
                    <EditableReviewField
                        icon={<HeartHandshake className="size-4" />}
                        label="Uri ng tulong"
                        value={parsedData.assistanceType}
                        onChange={(value) => updateParsedData('assistanceType', value)}
                    />
                    <EditableReviewField
                        icon={<FileCheck2 className="size-4" />}
                        label="Na-parse na sitwasyon"
                        value={parsedData.situation}
                        onChange={(value) => updateParsedData('situation', value)}
                        isMultiline
                    />
                    <EditableReviewField
                        icon={<Clock3 className="size-4" />}
                        label="Priority"
                        value={parsedData.priority}
                        onChange={(value) => updateParsedData('priority', value)}
                    />
                </div>

                <div className={`mt-4 rounded-2xl border p-4 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                    <div className={`flex items-center gap-2 text-xs font-extrabold ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
                        <MapPinned className="size-4" aria-hidden="true" />
                        CURRENT LOCATION
                    </div>
                    <label
                        className={`mt-3 grid gap-1.5 text-[10px] font-extrabold tracking-wide uppercase ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}
                    >
                        Address
                        <input
                            type="text"
                            value={parsedData.address}
                            onChange={(event) => updateParsedData('address', event.target.value)}
                            className="h-11 rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold tracking-normal text-slate-700 normal-case outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                    </label>
                    <label
                        className={`mt-3 grid gap-1.5 text-[10px] font-extrabold tracking-wide uppercase ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}
                    >
                        Coordinates
                        <input
                            type="text"
                            value={parsedData.coordinates}
                            onChange={(event) => updateParsedData('coordinates', event.target.value)}
                            className="h-11 rounded-xl border border-orange-200 bg-white px-3 font-mono text-xs font-bold tracking-normal text-slate-700 normal-case outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                        />
                    </label>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-extrabold text-slate-900">Mag-attach ng larawan</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Optional: larawan ng sitwasyon para makatulong sa responders.</p>
                        </div>
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                            <ImagePlus className="size-4" aria-hidden="true" />
                        </span>
                    </div>

                    {attachmentPreviewUrl !== null && attachment !== null ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            <img src={attachmentPreviewUrl} alt="Preview ng napiling attachment" className="aspect-video w-full object-cover" />
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-slate-700">{attachment.name}</p>
                                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">Napiling larawan ng kasalukuyang sitwasyon.</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    <label className="cursor-pointer rounded-lg px-2.5 py-2 text-[11px] font-extrabold text-sky-600 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-500 hover:bg-sky-50">
                                        Palitan
                                        <input type="file" accept="image/*" capture="environment" onChange={selectAttachment} className="sr-only" />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={removeAttachment}
                                        aria-label="Remove attached image"
                                        className="grid size-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                                    >
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-4 py-4 text-xs font-extrabold text-sky-700 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-500 hover:border-sky-400 hover:bg-sky-100">
                            <ImagePlus className="size-4" aria-hidden="true" />
                            Kumuha o pumili ng larawan
                            <input type="file" accept="image/*" capture="environment" onChange={selectAttachment} className="sr-only" />
                        </label>
                    )}
                </div>

                <div className={`mt-4 rounded-2xl border p-4 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-sky-200 bg-sky-50'}`}>
                    <div className="flex items-start gap-3">
                        <Building2 className={`mt-0.5 size-5 shrink-0 ${isUrgent ? 'text-red-700' : 'text-sky-700'}`} aria-hidden="true" />
                        <div>
                            <p className={`text-sm font-extrabold ${isUrgent ? 'text-red-900' : 'text-sky-900'}`}>
                                Ipapadala sa kinauukulang tanggapan
                            </p>
                            <p className={`mt-1 text-xs leading-5 ${isUrgent ? 'text-red-800' : 'text-sky-800'}`}>
                                Kapag nag-submit ka, ang iyong pangalan, safety status, parsed na detalye, eksaktong lokasyon, at napiling larawan
                                kung mayroon ay ipapadala sa {agencyName} para makatugon sila.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
                    <button
                        type="button"
                        onClick={repeatListening}
                        aria-label="Repeat voice capture"
                        className="grid size-12 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                        <RotateCcw className="size-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('sending')}
                        className={`flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 ${isUrgent ? 'bg-red-500 shadow-[0_6px_16px_rgba(239,68,68,0.28)] hover:bg-red-600 focus-visible:outline-red-500' : 'bg-sky-500 shadow-[0_6px_16px_rgba(14,165,233,0.24)] hover:bg-sky-600 focus-visible:outline-sky-500'}`}
                    >
                        <Send className="size-4" aria-hidden="true" />
                        {isUrgent ? 'Ipadala ang Rescue Alert' : 'Ipadala sa LGU'}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'sending') {
        return (
            <div className="py-8 text-center">
                <StepLabel currentStep={3} isUrgent={isUrgent} />
                <span
                    className={`mx-auto mt-7 grid size-20 place-items-center rounded-full ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'}`}
                >
                    <LoaderCircle className="size-9 animate-spin" aria-hidden="true" />
                </span>
                <h2 id="emergency-check-in-title" className="mt-5 text-xl font-black text-black">
                    Ipinapadala ang request...
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Inihahanda ang detalye at eksaktong lokasyon para sa LGU.</p>

                <div className="mx-auto mt-4 max-w-xs rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5 text-left">
                    <p className="truncate text-xs font-bold text-sky-900">{parsedData.address}</p>
                    <p className="mt-1 truncate font-mono text-[10px] font-semibold text-sky-700">{parsedData.coordinates}</p>
                </div>

                <div className="mx-auto mt-5 grid max-w-xs gap-2 text-left text-xs font-semibold text-slate-600">
                    <SendingItem label={subjectName === undefined ? 'Safety status confirmed' : `${subjectName}'s safety status confirmed`} />
                    <SendingItem label="Location attached" />
                    {attachment !== null && <SendingItem label="Image attachment prepared" />}
                    <SendingItem label={`Connecting to ${agencyName}`} isLoading isUrgent={isUrgent} />
                </div>
                <p className="mt-5 text-[11px] font-semibold text-slate-400">Securely preparing your request...</p>
            </div>
        );
    }

    return (
        <div className="py-4 text-center">
            <span
                className={`mx-auto grid size-16 place-items-center rounded-full ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
            >
                {isUrgent ? <ShieldAlert className="size-8" aria-hidden="true" /> : <CheckCircle2 className="size-8" aria-hidden="true" />}
            </span>
            <p className={`mt-4 text-xs font-extrabold tracking-[0.14em] uppercase ${isUrgent ? 'text-red-700' : 'text-green-700'}`}>
                {isUrgent ? 'Critical rescue alert prepared' : 'Request prepared'}
            </p>
            <h2 id="emergency-check-in-title" className="mt-1 text-xl font-black text-black">
                {isUrgent ? 'Na-alerto na ang emergency response team.' : 'Paparating na ang tulong.'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Habang hinihintay ang responder, sundin muna ang mga paalalang ito.</p>

            <div className="mt-5 grid gap-2.5 text-left">
                {guidance.map((guidanceText, index) => (
                    <GuidanceItem
                        key={guidanceText}
                        icon={
                            index === guidance.length - 1 ? (
                                <Phone className="size-4" />
                            ) : isUrgent ? (
                                <ShieldAlert className="size-4" />
                            ) : (
                                <Navigation className="size-4" />
                            )
                        }
                        text={guidanceText}
                        isUrgent={isUrgent}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={() =>
                    onComplete({
                        mode: resolvedMode,
                        assistanceType: parsedData.assistanceType,
                        situation: parsedData.situation,
                        priority: parsedData.priority,
                    })
                }
                className={`mt-5 h-11 rounded-xl px-8 text-sm font-extrabold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 ${isUrgent ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500' : 'bg-sky-500 hover:bg-sky-600 focus-visible:outline-sky-500'}`}
            >
                Naiintindihan ko
            </button>
        </div>
    );
}

function StepLabel({ currentStep, isUrgent }: { currentStep: number; isUrgent: boolean }): JSX.Element {
    return (
        <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((stepNumber) => (
                <span
                    key={stepNumber}
                    className={`h-1.5 rounded-full transition-all ${stepNumber === currentStep ? `w-8 ${isUrgent ? 'bg-red-500' : 'bg-sky-500'}` : stepNumber < currentStep ? `w-4 ${isUrgent ? 'bg-red-300' : 'bg-green-400'}` : 'w-4 bg-slate-200'}`}
                />
            ))}
        </div>
    );
}

type EditableReviewFieldProps = {
    icon: JSX.Element;
    label: string;
    value: string;
    onChange: (value: string) => void;
    isMultiline?: boolean;
};

function EditableReviewField({ icon, label, value, onChange, isMultiline = false }: EditableReviewFieldProps): JSX.Element {
    return (
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-50">
            <span className="mt-0.5 text-sky-600">{icon}</span>
            <span className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold tracking-wide text-slate-400 uppercase">{label}</p>
                {isMultiline ? (
                    <textarea
                        rows={2}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        className="mt-1 w-full resize-none bg-transparent text-xs leading-5 font-bold text-slate-700 outline-none"
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        className="mt-1 w-full bg-transparent text-xs font-bold text-slate-700 outline-none"
                    />
                )}
            </span>
            <PencilLine className="mt-1 size-3.5 shrink-0 text-slate-300" aria-hidden="true" />
        </label>
    );
}

type VoiceTranscriptLineProps = {
    index: number;
    visibleLineCount: number;
    text: string;
    isUrgent: boolean;
};

function VoiceTranscriptLine({ index, visibleLineCount, text, isUrgent }: VoiceTranscriptLineProps): JSX.Element {
    const isVisible = visibleLineCount >= index;

    if (!isVisible) {
        return (
            <div className="flex h-8 items-center gap-2 rounded-lg bg-white/70 px-3">
                <span className={`size-1.5 animate-pulse rounded-full ${isUrgent ? 'bg-red-200' : 'bg-orange-200'}`} />
                <span className={`h-2.5 w-3/4 animate-pulse rounded ${isUrgent ? 'bg-red-100' : 'bg-orange-100'}`} />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in-0 slide-in-from-bottom-1 flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm leading-5 font-semibold text-slate-700 duration-500">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-orange-500'}`} />
            <span>“{text}”</span>
        </div>
    );
}

type ParseLineProps = {
    index: number;
    visibleLineCount: number;
    label: string;
    value: string;
    isUrgent: boolean;
};

function ParseLine({ index, visibleLineCount, label, value, isUrgent }: ParseLineProps): JSX.Element {
    const isVisible = visibleLineCount >= index;

    if (!isVisible) {
        return (
            <div className="flex h-9 items-center gap-2 rounded-lg bg-slate-50 px-2.5">
                <span className="size-3.5 animate-pulse rounded-full bg-slate-200" />
                <span className="h-2.5 w-28 animate-pulse rounded bg-slate-200" />
            </div>
        );
    }

    return (
        <div
            className={`animate-in fade-in-0 slide-in-from-bottom-1 flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 duration-500 ${isUrgent ? 'bg-red-50' : 'bg-green-50'}`}
        >
            <CheckCircle2 className={`size-3.5 shrink-0 ${isUrgent ? 'text-red-600' : 'text-green-600'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
                <span className={`block text-[9px] font-extrabold tracking-wide uppercase ${isUrgent ? 'text-red-700' : 'text-green-700'}`}>
                    {label}
                </span>
                <span className="block truncate text-[10px] font-semibold text-slate-600">{value}</span>
            </span>
        </div>
    );
}

function SendingItem({ label, isLoading = false, isUrgent = false }: { label: string; isLoading?: boolean; isUrgent?: boolean }): JSX.Element {
    return (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            {isLoading ? (
                <LoaderCircle className={`size-4 animate-spin ${isUrgent ? 'text-red-500' : 'text-sky-500'}`} aria-hidden="true" />
            ) : (
                <CheckCircle2 className="size-4 text-green-500" aria-hidden="true" />
            )}
            {label}
        </div>
    );
}

function GuidanceItem({ icon, text, isUrgent = false }: { icon: JSX.Element; text: string; isUrgent?: boolean }): JSX.Element {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs leading-5 font-semibold text-slate-700">
            <span className={`mt-0.5 ${isUrgent ? 'text-red-600' : 'text-sky-600'}`}>{icon}</span>
            {text}
        </div>
    );
}
