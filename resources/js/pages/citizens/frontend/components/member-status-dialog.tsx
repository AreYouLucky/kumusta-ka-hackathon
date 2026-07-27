import { Check, CheckCircle2, HeartHandshake, ShieldCheck, Siren, X } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { MemberSafetyStatus, SafetyCircleMember } from '../types';
import { HelpAssistanceFlow, type AssistanceFlowMode, type AssistanceSubmission } from './help-assistance-flow';
import { SafeStatusFlow } from './safe-status-flow';

type MemberStatusDialogProps = {
    member: SafetyCircleMember | null;
    onClose: () => void;
    onStatusChange: (memberId: number, status: MemberSafetyStatus, assistance?: AssistanceSubmission) => void;
};

type StatusChoice = {
    value: MemberSafetyStatus;
    label: string;
    description: string;
};

const statusChoices: StatusChoice[] = [
    { value: 'safe', label: 'Ligtas Ako', description: 'Walang agarang panganib' },
    { value: 'help', label: 'Kailangan Ko ng Tulong', description: 'May kailangan ngunit hindi kritikal' },
    { value: 'rescue', label: 'Kailangan Ko ng Agarang Saklolo', description: 'Nasa agarang panganib' },
];

function getChoiceClass(status: MemberSafetyStatus, isSelected: boolean): string {
    if (!isSelected) {
        return 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50';
    }

    if (status === 'safe') {
        return 'border-green-300 bg-green-50 text-green-700 ring-2 ring-green-100';
    }

    if (status === 'help') {
        return 'border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-100';
    }

    return 'border-red-300 bg-red-50 text-red-600 ring-2 ring-red-100';
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

export function MemberStatusDialog({ member, onClose, onStatusChange }: MemberStatusDialogProps): JSX.Element | null {
    const [assistanceMode, setAssistanceMode] = useState<AssistanceFlowMode | null>(null);
    const [isSafeFlowActive, setIsSafeFlowActive] = useState(false);

    function closeDialog(): void {
        setAssistanceMode(null);
        setIsSafeFlowActive(false);
        onClose();
    }

    function selectStatus(status: MemberSafetyStatus): void {
        if (member === null) {
            return;
        }

        if (status === 'safe') {
            setIsSafeFlowActive(true);
            return;
        }

        setAssistanceMode(status);
    }

    function completeAssistanceFlow(assistance: AssistanceSubmission): void {
        if (member === null) {
            return;
        }

        setAssistanceMode(null);
        onStatusChange(member.id, assistance.mode, assistance);
    }

    function completeSafeFlow(): void {
        if (member === null) {
            return;
        }

        setIsSafeFlowActive(false);
        onStatusChange(member.id, 'safe');
    }

    useEffect(() => {
        if (!member) {
            return;
        }

        const previousBodyOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        function handleKeyDown(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                setAssistanceMode(null);
                setIsSafeFlowActive(false);
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousBodyOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [member, onClose]);

    if (!member) {
        return null;
    }

    return createPortal(
        <div
            role="presentation"
            className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden bg-slate-950/55 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    closeDialog();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="member-status-title"
                className="flex max-h-[calc(100dvh-1rem)] w-full flex-col overflow-hidden rounded-t-3xl bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-md sm:rounded-3xl sm:p-6"
            >
                <div className="flex shrink-0 items-start gap-3">
                    <span
                        className={`grid size-11 shrink-0 place-items-center rounded-xl ${isSafeFlowActive ? 'bg-green-100 text-green-700' : assistanceMode === 'rescue' ? 'bg-red-100 text-red-700' : assistanceMode === 'help' ? 'bg-orange-100 text-orange-700' : 'bg-sky-100 text-sky-700'}`}
                    >
                        {isSafeFlowActive ? (
                            <CheckCircle2 className="size-5" aria-hidden="true" />
                        ) : assistanceMode === 'rescue' ? (
                            <Siren className="size-5" aria-hidden="true" />
                        ) : assistanceMode === 'help' ? (
                            <HeartHandshake className="size-5" aria-hidden="true" />
                        ) : (
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p
                            className={`text-[10px] font-extrabold tracking-[0.14em] uppercase ${isSafeFlowActive ? 'text-green-600' : assistanceMode === 'rescue' ? 'text-red-600' : assistanceMode === 'help' ? 'text-orange-600' : 'text-sky-600'}`}
                        >
                            {isSafeFlowActive
                                ? 'Safe check-in'
                                : assistanceMode === 'rescue'
                                  ? 'Urgent rescue'
                                  : assistanceMode === 'help'
                                    ? 'Assistance request'
                                    : 'Member status'}
                        </p>
                        <h2 id="member-status-title" className="mt-1 text-lg font-black text-black">
                            {assistanceMode === null && !isSafeFlowActive ? `Update ${member.name}` : `Check-in para kay ${member.name}`}
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            {assistanceMode === null && !isSafeFlowActive
                                ? 'Choose the status that best describes their current situation.'
                                : 'I-record ang sitwasyon at kumpirmahin ang detalye bago ipadala.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={closeDialog}
                        aria-label="Close status options"
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-sky-500"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="-mx-1 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-1 [scrollbar-gutter:stable]">
                    {isSafeFlowActive ? (
                        <SafeStatusFlow subjectName={member.name} onComplete={completeSafeFlow} />
                    ) : assistanceMode !== null ? (
                        <HelpAssistanceFlow mode={assistanceMode} subjectName={member.name} onComplete={completeAssistanceFlow} />
                    ) : (
                        <>
                            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-600 text-xs font-extrabold text-white">
                                    {member.initials}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-extrabold text-black">{member.name}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{member.relationship}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2.5">
                                {statusChoices.map((choice) => {
                                    const isSelected = member.status === choice.value;

                                    return (
                                        <button
                                            key={choice.value}
                                            type="button"
                                            onClick={() => selectStatus(choice.value)}
                                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${getChoiceClass(choice.value, isSelected)}`}
                                        >
                                            <ChoiceIcon status={choice.value} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-extrabold">{choice.label}</span>
                                                <span className="mt-0.5 block text-[11px] opacity-70">{choice.description}</span>
                                            </span>
                                            {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
