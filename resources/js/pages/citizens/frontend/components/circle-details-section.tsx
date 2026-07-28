import { Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Clock3,
    HeartHandshake,
    MapPin,
    Radio,
    ScanLine,
    Send,
    ShieldCheck,
    Siren,
    UserPlus,
} from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import type { MemberCheckInStatus, MemberResponseStatus, MemberSafetyStatus, SafetyCircleDetails, SafetyCircleMember } from '../types';
import { CircleCalamityStatus } from './circle-calamity-status';
import type { AssistanceSubmission } from './help-assistance-flow';
import { MemberStatusDialog } from './member-status-dialog';
import { QrScannerDialog } from './qr-scanner-dialog';

type CircleDetailsSectionProps = {
    circle: SafetyCircleDetails;
};

type StatusOption = {
    value: MemberSafetyStatus;
    label: string;
    description: string;
};

const statusOptions: StatusOption[] = [
    { value: 'no_response', label: 'No response yet', description: 'Hindi pa nakakapag-update' },
    { value: 'safe', label: 'Ligtas Ako', description: 'Walang agarang panganib' },
    { value: 'help', label: 'Kailangan Ko ng Tulong', description: 'May kailangan ngunit hindi kritikal' },
    { value: 'rescue', label: 'Kailangan Ko ng Agarang Saklolo', description: 'Nasa agarang panganib' },
];

const avatarColors = ['bg-sky-600', 'bg-violet-600', 'bg-teal-700', 'bg-slate-700', 'bg-indigo-600', 'bg-cyan-700'];

function getStatusOption(status: MemberSafetyStatus): StatusOption {
    return statusOptions.find((option) => option.value === status) ?? statusOptions[0];
}

function getStatusBadgeClass(status: MemberSafetyStatus): string {
    if (status === 'no_response') {
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }

    if (status === 'safe') {
        return 'border-green-200 bg-green-50 text-green-700';
    }

    if (status === 'help') {
        return 'border-orange-200 bg-orange-50 text-orange-700';
    }

    return 'border-red-200 bg-red-50 text-red-600';
}

function googleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function StatusIcon({ status, className = 'size-4' }: { status: MemberSafetyStatus; className?: string }): JSX.Element {
    if (status === 'no_response') {
        return <Clock3 className={className} aria-hidden="true" />;
    }

    if (status === 'safe') {
        return <CheckCircle2 className={className} aria-hidden="true" />;
    }

    if (status === 'help') {
        return <HeartHandshake className={className} aria-hidden="true" />;
    }

    return <Siren className={className} aria-hidden="true" />;
}

function ResponseStatusBadge({ status }: { status: MemberResponseStatus }): JSX.Element {
    const isEmergencyDispatch = status === 'responders_dispatched';

    return (
        <span
            className={`mt-2 flex w-fit max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-extrabold ${
                isEmergencyDispatch ? 'border-red-200 bg-red-50 text-red-700' : 'border-orange-200 bg-orange-50 text-orange-700'
            }`}
        >
            {isEmergencyDispatch ? <Radio className="size-3 shrink-0" aria-hidden="true" /> : <Send className="size-3 shrink-0" aria-hidden="true" />}
            <span className="truncate">{isEmergencyDispatch ? 'Emergency responders dispatched' : 'Forwarded to LGU responders'}</span>
        </span>
    );
}

export function CircleDetailsSection({ circle }: CircleDetailsSectionProps): JSX.Element {
    const [members, setMembers] = useState<SafetyCircleMember[]>(circle.members);
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [memberError, setMemberError] = useState<string | undefined>();

    useEffect(() => {
        setMembers(circle.members);
    }, [circle.members]);

    useEcho<SafetyCircleMember>(`safety-circles.${circle.id}`, 'SafetyCircleMemberAdded', (addedMember) => {
        setMembers((currentMembers) => {
            const alreadyExists = currentMembers.some((member) => member.id === addedMember.id);

            return alreadyExists
                ? currentMembers.map((member) => (member.id === addedMember.id ? addedMember : member))
                : [...currentMembers, addedMember];
        });
    });

    useEcho<SafetyCircleMember>(`safety-circles.${circle.id}`, 'SafetyCircleMemberStatusUpdated', (updatedMember) => {
        setMembers((currentMembers) =>
            currentMembers.map((member) =>
                member.id === updatedMember.id
                    ? {
                          ...updatedMember,
                          isCurrentUser: member.isCurrentUser,
                      }
                    : member,
            ),
        );
    });

    const statusCounts: Record<MemberSafetyStatus, number> = {
        no_response: members.filter((member) => member.status === 'no_response').length,
        safe: members.filter((member) => member.status === 'safe').length,
        help: members.filter((member) => member.status === 'help').length,
        rescue: members.filter((member) => member.status === 'rescue').length,
    };
    const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;

    function updateMemberStatus(memberId: number, status: MemberCheckInStatus, assistance?: AssistanceSubmission): void {
        const responseStatus: MemberResponseStatus | undefined =
            status === 'help' ? 'forwarded_to_lgu' : status === 'rescue' ? 'responders_dispatched' : undefined;

        setMembers((currentMembers) =>
            currentMembers.map((member) => (member.id === memberId ? { ...member, status, responseStatus, updatedAt: 'Updated just now' } : member)),
        );
        setSelectedMemberId(null);

        router.patch(
            route('citizen.circles.members.status', {
                circle: circle.id,
                member: memberId,
            }),
            {
                status,
                assistance_type: assistance?.assistanceType,
                situation: assistance?.situation,
                priority: assistance?.priority,
            },
            { preserveScroll: true },
        );
    }

    function addScannedMember(memberCode: string): void {
        setIsAddingMember(true);
        setMemberError(undefined);

        router.post(
            route('citizen.circles.members.store', { circle: circle.id }),
            { member_code: memberCode },
            {
                preserveScroll: true,
                onSuccess: () => setIsScannerOpen(false),
                onError: (errors) => setMemberError(errors.member_code ?? 'The member could not be added.'),
                onFinish: () => setIsAddingMember(false),
            },
        );
    }

    return (
        <section aria-labelledby="circle-title" className="pt-4 sm:pt-6">
            <div className="rounded-2xl border border-sky-100 bg-white p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:items-center">
                    <Link
                        href={route('citizen.home')}
                        aria-label="Back to safety circles"
                        className="grid size-11 shrink-0 place-items-center rounded-xl border border-sky-100 bg-white text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                        <ArrowLeft className="size-5" aria-hidden="true" />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <h1 id="circle-title" className="mt-1 truncate text-2xl font-black tracking-tight text-black sm:text-3xl">
                            {circle.name}
                        </h1>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{circle.location}</span>
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{circle.description}</p>
            </div>

            <CircleCalamityStatus status={circle.calamityStatus} />

            <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3">
                {statusOptions.map((option) => (
                    <div
                        key={option.value}
                        className={`min-w-0 rounded-xl border px-2.5 py-2.5 sm:rounded-2xl sm:p-3.5 ${getStatusBadgeClass(option.value)}`}
                    >
                        <div className="flex items-center gap-1.5">
                            <StatusIcon status={option.value} className="size-4 shrink-0 sm:size-5" />
                            <p className="text-lg font-black sm:text-xl">{statusCounts[option.value]}</p>
                        </div>
                        <p className="mt-1 text-[9px] leading-[1.2] font-bold sm:text-xs sm:leading-tight">{option.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4 sm:mt-8">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.14em] text-sky-600 uppercase">Circle members</p>
                    <h2 className="mt-1 text-xl font-black text-black">Kumusta sila?</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600 sm:inline-flex">
                        {members.length} members
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setMemberError(undefined);
                            setIsScannerOpen(true);
                        }}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    >
                        <UserPlus className="size-4" aria-hidden="true" />
                        Add member
                    </button>
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500 sm:hidden">
                <ScanLine className="size-4 text-sky-600" aria-hidden="true" />
                {members.length} members in this circle
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 font-semibold text-sky-800">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>Sinumang miyembro ay maaaring mag-update ng status. Use the arrow to update or tap a location to open Google Maps.</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                {members.map((member, index) => {
                    const currentStatus = getStatusOption(member.status);

                    return (
                        <div
                            key={member.id}
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:border-sky-200 hover:shadow-[0_7px_18px_rgba(15,23,42,0.07)]"
                        >
                            <span
                                className={`grid size-11 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white ${avatarColors[index % avatarColors.length]}`}
                            >
                                {member.initials}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-sm font-extrabold text-black">{member.name}</span>
                                    {member.isCurrentUser && (
                                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-black text-sky-700 uppercase">You</span>
                                    )}
                                </span>
                                <span className="mt-0.5 block text-xs text-slate-500">{member.relationship}</span>
                                <span
                                    className={`mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 ${getStatusBadgeClass(member.status)}`}
                                >
                                    <StatusIcon status={member.status} />
                                    <span className="truncate text-[11px] font-extrabold">{currentStatus.label}</span>
                                </span>
                                {member.responseStatus && <ResponseStatusBadge status={member.responseStatus} />}
                                <span className="mt-1.5 block text-[10px] text-slate-400">{member.updatedAt}</span>
                                {member.lastSeenLocation && (
                                    <a
                                        href={googleMapsUrl(member.lastSeenLocation.latitude, member.lastSeenLocation.longitude)}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label={`View ${member.name}'s last seen location in Google Maps`}
                                        className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-extrabold text-sky-700 transition hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                                    >
                                        <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                        <span className="min-w-0">
                                            <span className="block truncate">{member.lastSeenLocation.name}</span>
                                            <span className="block text-[9px] font-semibold text-sky-600">
                                                Last seen {member.lastSeenLocation.recordedAt ?? 'time unavailable'}
                                            </span>
                                        </span>
                                        <span className="sr-only"> · Opens Google Maps</span>
                                    </a>
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedMemberId(member.id)}
                                aria-label={`Update status for ${member.name}`}
                                className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-xl px-2 text-[10px] font-extrabold text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                            >
                                Update
                                <ChevronRight className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <MemberStatusDialog member={selectedMember} onClose={() => setSelectedMemberId(null)} onStatusChange={updateMemberStatus} />
            <QrScannerDialog
                isOpen={isScannerOpen}
                isProcessing={isAddingMember}
                error={memberError}
                onClose={() => setIsScannerOpen(false)}
                onMemberDetected={addScannedMember}
            />
        </section>
    );
}
