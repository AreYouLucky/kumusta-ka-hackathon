import { Check, CheckCircle2, Clock3, HeartHandshake, MapPin, Siren, X } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { MemberSafetyStatus } from '../types';
import { HelpAssistanceFlow, type AssistanceFlowMode, type AssistanceSubmission } from './help-assistance-flow';
import { SafeStatusFlow } from './safe-status-flow';

type EmergencyCheckInDialogProps = {
    onClose: () => void;
    onStatusComplete: (status: MemberSafetyStatus, assistance?: AssistanceSubmission) => void;
};

type CheckInChoice = {
    value: MemberSafetyStatus;
    label: string;
    description: string;
};

const checkInChoices: CheckInChoice[] = [
    { value: 'safe', label: 'Ligtas Ako', description: 'Wala ako sa agarang panganib.' },
    { value: 'help', label: 'Kailangan Ko ng Tulong', description: 'May kailangan ako pero hindi kritikal.' },
    { value: 'rescue', label: 'Kailangan Ko ng Agarang Saklolo', description: 'Nasa panganib ako at kailangan ng rescue.' },
];

function getChoiceClass(status: MemberSafetyStatus, isSelected: boolean): string {
    const selectedRing = isSelected ? 'ring-2 ring-offset-2' : '';

    if (status === 'safe') {
        return `border-green-200 bg-green-50 text-green-700 hover:border-green-300 ${selectedRing} ring-green-300`;
    }

    if (status === 'help') {
        return `border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 ${selectedRing} ring-orange-300`;
    }

    return `border-red-200 bg-red-50 text-red-600 hover:border-red-300 ${selectedRing} ring-red-300`;
}

function ChoiceIcon({ status }: { status: MemberSafetyStatus }): JSX.Element {
    if (status === 'safe') {
        return <CheckCircle2 className="size-5" aria-hidden="true" />;
    }

    if (status === 'help') {
        return <HeartHandshake className="size-5" aria-hidden="true" />;
    }

    return <Siren className="size-5" aria-hidden="true" />;
}

export function EmergencyCheckInDialog({ onClose, onStatusComplete }: EmergencyCheckInDialogProps): JSX.Element {
    const [selectedStatus, setSelectedStatus] = useState<MemberSafetyStatus | null>(null);
    const [assistanceMode, setAssistanceMode] = useState<AssistanceFlowMode | null>(null);
    const [isSafeFlowActive, setIsSafeFlowActive] = useState(false);

    function handleStatusSubmit(): void {
        if (selectedStatus === 'safe') {
            setIsSafeFlowActive(true);
            return;
        }

        if (selectedStatus === 'help' || selectedStatus === 'rescue') {
            setAssistanceMode(selectedStatus);
        }
    }

    function completeStatus(status: MemberSafetyStatus, assistance?: AssistanceSubmission): void {
        onStatusComplete(status, assistance);
        onClose();
    }

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return createPortal(
        <div
            role="presentation"
            className="fixed inset-0 z-[70] flex items-end justify-center overflow-hidden bg-slate-950/65 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="emergency-check-in-title"
                className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6"
            >
                <div className="flex shrink-0 items-start justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close emergency check-in"
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="-mx-1 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-1 [scrollbar-gutter:stable]">
                    {isSafeFlowActive ? (
                        <SafeStatusFlow onComplete={() => completeStatus('safe')} />
                    ) : assistanceMode !== null ? (
                        <HelpAssistanceFlow mode={assistanceMode} onComplete={(assistance) => completeStatus(assistance.mode, assistance)} />
                    ) : (
                        <>
                            <div className="mx-auto -mt-1 h-28 w-28 sm:h-32 sm:w-32">
                                <Siren className="size-12 text-red-500" aria-hidden="true" />
                            </div>

                            <div className="text-center">
                                <h2 id="emergency-check-in-title" className="text-xl font-black tracking-tight text-black sm:text-2xl">
                                    May lindol na nangyari sa lugar mo.
                                </h2>
                                <p className="mt-1 text-lg font-extrabold text-sky-600">Kumusta ka?</p>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                                <span className="flex items-center gap-1">
                                    <MapPin className="size-3.5" aria-hidden="true" />
                                    Iligan City
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock3 className="size-3.5" aria-hidden="true" />5 minutes ago
                                </span>
                            </div>

                            <div className="mt-5 grid gap-2.5">
                                {checkInChoices.map((choice) => {
                                    const isSelected = selectedStatus === choice.value;

                                    return (
                                        <button
                                            key={choice.value}
                                            type="button"
                                            onClick={() => setSelectedStatus(choice.value)}
                                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${getChoiceClass(choice.value, isSelected)}`}
                                        >
                                            <ChoiceIcon status={choice.value} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-extrabold">{choice.label}</span>
                                                <span className="mt-0.5 block text-[11px] opacity-75">{choice.description}</span>
                                            </span>
                                            {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                type="button"
                                disabled={selectedStatus === null}
                                onClick={handleStatusSubmit}
                                className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-sky-500 px-4 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(14,165,233,0.24)] transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                            >
                                I-submit ang Status
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
