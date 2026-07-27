import { Head, Link, router } from '@inertiajs/react';
import { useConnectionStatus, useEcho } from '@laravel/echo-react';
import { CheckCircle2, ClipboardCheck, Clock3, ListFilter, MapPin, Phone, Radio, ShieldAlert, Siren, UserRoundCheck, UsersRound } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

type AssistanceStatus = 'help' | 'rescue' | 'safe';
type ResponderStatus = 'pending' | 'accepted' | 'resolved' | null;

type ResponderRequest = {
    id: number;
    citizen_id: number | null;
    citizen_name: string;
    mobile_number: string | null;
    circle_name: string | null;
    location_name: string | null;
    latitude: string | null;
    longitude: string | null;
    safety_status: AssistanceStatus;
    response_status: string | null;
    assistance_type: string | null;
    situation: string | null;
    priority: string | null;
    responder_id: number | null;
    responder_status: ResponderStatus;
    responder_name: string | null;
    checked_in_at: string | null;
    accepted_at: string | null;
    resolved_at: string | null;
};

type ResponderIndexProps = {
    initialRequests: ResponderRequest[];
    view: 'queue' | 'assigned';
    currentResponderId: number | null;
};

function requestTimestamp(request: ResponderRequest): number {
    return request.checked_in_at === null ? 0 : new Date(request.checked_in_at).getTime();
}

function formatTime(value: string | null): string {
    if (value === null) {
        return 'Just now';
    }

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function ResponderIndex({ initialRequests, view, currentResponderId }: ResponderIndexProps): JSX.Element {
    const [requests, setRequests] = useState(initialRequests);
    const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
    const connectionStatus = useConnectionStatus();
    const isAssignedView = view === 'assigned';

    useEffect(() => setRequests(initialRequests), [initialRequests]);

    useEcho<ResponderRequest>('responders', 'CitizenAssistanceStatusUpdated', (updatedRequest) => {
        setRequests((currentRequests) => {
            const shouldShowRequest =
                ['help', 'rescue'].includes(updatedRequest.safety_status) && (!isAssignedView || updatedRequest.responder_id === currentResponderId);

            if (!shouldShowRequest) {
                return currentRequests.filter((request) => request.id !== updatedRequest.id);
            }

            const requestExists = currentRequests.some((request) => request.id === updatedRequest.id);
            const nextRequests = requestExists
                ? currentRequests.map((request) => (request.id === updatedRequest.id ? updatedRequest : request))
                : [updatedRequest, ...currentRequests];

            return nextRequests.toSorted((left, right) => requestTimestamp(right) - requestTimestamp(left));
        });
    });

    function updateRequest(requestId: number, status: Exclude<ResponderStatus, 'pending' | null>): void {
        setProcessingRequestId(requestId);
        router.patch(
            route('responder.requests.update', requestId),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setProcessingRequestId(null),
            },
        );
    }

    const activeRequests = requests.filter((request) => request.responder_status !== 'resolved');
    const resolvedRequests = requests.filter((request) => request.responder_status === 'resolved');
    const urgentCount = activeRequests.filter((request) => request.safety_status === 'rescue').length;

    return (
        <>
            <Head title={isAssignedView ? 'My Responder Assignments' : 'Responder Queue'} />

            <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    <header className="rounded-3xl bg-gradient-to-br from-sky-600 to-blue-700 p-6 text-white shadow-xl shadow-sky-900/10 sm:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-sky-100 uppercase">
                                    <Radio className="size-4" aria-hidden="true" />
                                    Live responder operations
                                </div>
                                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    {isAssignedView ? 'My assigned requests' : 'Citizen assistance queue'}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-50">
                                    {isAssignedView
                                        ? 'Track the requests you accepted and complete their response status.'
                                        : 'New citizen check-ins and status changes are delivered from Laravel in real time.'}
                                </p>
                            </div>
                            <span
                                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                                    connectionStatus === 'connected' ? 'bg-green-400/20 text-green-50' : 'bg-amber-300/20 text-amber-50'
                                }`}
                            >
                                <span
                                    className={`size-2 rounded-full ${connectionStatus === 'connected' ? 'animate-pulse bg-green-300' : 'bg-amber-300'}`}
                                />
                                WebSocket {connectionStatus === 'connected' ? 'connected' : connectionStatus}
                            </span>
                        </div>
                    </header>

                    <nav className="mt-4 flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Responder requests">
                        <Link
                            href={route('responder.index')}
                            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition ${
                                !isAssignedView ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ListFilter className="size-4" aria-hidden="true" />
                            All requests
                        </Link>
                        <Link
                            href={route('responder.assigned')}
                            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition ${
                                isAssignedView ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ClipboardCheck className="size-4" aria-hidden="true" />
                            My assignments
                        </Link>
                    </nav>

                    <section className="mt-5 grid gap-3 sm:grid-cols-3">
                        <SummaryCard icon={<UsersRound className="size-5" />} label="Active requests" value={activeRequests.length} />
                        <SummaryCard icon={<Siren className="size-5" />} label="Urgent rescue" value={urgentCount} isUrgent />
                        <SummaryCard icon={<CheckCircle2 className="size-5" />} label="Resolved" value={resolvedRequests.length} />
                    </section>

                    <section className="mt-6">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <p className="text-xs font-extrabold tracking-[0.14em] text-sky-700 uppercase">
                                    {isAssignedView ? 'Assigned requests' : 'Incoming requests'}
                                </p>
                                <h2 className="mt-1 text-2xl font-black">{isAssignedView ? 'Assigned to me' : 'Needs response'}</h2>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">Newest first</p>
                        </div>

                        {activeRequests.length === 0 ? (
                            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                                <CheckCircle2 className="mx-auto size-10 text-green-500" aria-hidden="true" />
                                <h3 className="mt-4 text-lg font-black">{isAssignedView ? 'No active assignments' : 'No active requests'}</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    {isAssignedView
                                        ? 'Accept a request from the main queue and it will appear here.'
                                        : 'New citizen assistance requests will appear here automatically.'}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                {activeRequests.map((request) => (
                                    <RequestCard
                                        key={request.id}
                                        request={request}
                                        isProcessing={processingRequestId === request.id}
                                        onAccept={() => updateRequest(request.id, 'accepted')}
                                        onResolve={() => updateRequest(request.id, 'resolved')}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}

type SummaryCardProps = {
    icon: JSX.Element;
    label: string;
    value: number;
    isUrgent?: boolean;
};

function SummaryCard({ icon, label, value, isUrgent = false }: SummaryCardProps): JSX.Element {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <span className={`grid size-10 place-items-center rounded-xl ${isUrgent ? 'bg-red-50 text-red-600' : 'bg-sky-50 text-sky-600'}`}>
                    {icon}
                </span>
                <strong className="text-2xl font-black">{value}</strong>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">{label}</p>
        </article>
    );
}

type RequestCardProps = {
    request: ResponderRequest;
    isProcessing: boolean;
    onAccept: () => void;
    onResolve: () => void;
};

function RequestCard({ request, isProcessing, onAccept, onResolve }: RequestCardProps): JSX.Element {
    const isUrgent = request.safety_status === 'rescue';
    const isAccepted = request.responder_status === 'accepted';

    return (
        <article className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${isUrgent ? 'border-red-200' : 'border-orange-200'}`}>
            <div className={`flex items-center justify-between gap-3 px-5 py-3 ${isUrgent ? 'bg-red-50' : 'bg-orange-50'}`}>
                <span className={`flex items-center gap-2 text-xs font-black uppercase ${isUrgent ? 'text-red-700' : 'text-orange-700'}`}>
                    {isUrgent ? <Siren className="size-4" aria-hidden="true" /> : <ShieldAlert className="size-4" aria-hidden="true" />}
                    {isUrgent ? 'Urgent rescue' : 'Assistance needed'}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {formatTime(request.checked_in_at)}
                </span>
            </div>

            <div className="p-5">
                <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-600 text-white">
                        <UserRoundCheck className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-lg font-black">{request.citizen_name || 'Citizen'}</h3>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{request.circle_name ?? 'Citizen safety circle'}</p>
                    </div>
                </div>

                <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                    {request.assistance_type !== null && <p className="font-extrabold text-slate-900">{request.assistance_type}</p>}
                    {request.situation !== null && <p className="leading-5">{request.situation}</p>}
                    <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-sky-600" aria-hidden="true" />
                        {request.location_name ?? 'Location unavailable'}
                    </p>
                    {request.mobile_number !== null && (
                        <p className="flex items-center gap-2">
                            <Phone className="size-4 shrink-0 text-sky-600" aria-hidden="true" />
                            {request.mobile_number}
                        </p>
                    )}
                </div>

                {request.priority !== null && (
                    <p
                        className={`mt-3 rounded-xl px-3 py-2 text-xs font-extrabold ${isUrgent ? 'bg-red-50 text-red-800' : 'bg-orange-50 text-orange-800'}`}
                    >
                        {request.priority}
                    </p>
                )}

                {isAccepted && (
                    <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-800">
                        Accepted by {request.responder_name ?? 'responder'}
                    </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        disabled={isProcessing || isAccepted}
                        onClick={onAccept}
                        className="h-11 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-extrabold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isAccepted ? 'Accepted' : 'Accept request'}
                    </button>
                    <button
                        type="button"
                        disabled={isProcessing}
                        onClick={onResolve}
                        className="h-11 rounded-xl bg-green-600 px-3 text-xs font-extrabold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Mark resolved
                    </button>
                </div>
            </div>
        </article>
    );
}
