import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useConnectionStatus, useEcho } from '@laravel/echo-react';
import {
    Ambulance,
    Baby,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock3,
    HandHeart,
    HeartPulse,
    Home,
    MapPin,
    MessageSquare,
    MoreHorizontal,
    PersonStanding,
    Siren,
    Smartphone,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Affected Residents', href: '/gcc/affected-residents' }];
const residentsPerPage = 10;

type Resident = {
    id: number;
    full_name: string;
    birthdate: string | null;
    age: number | null;
    sex: string;
    barangay: string | null;
    city: string | null;
    status: string;
    resident_status: number;
    circle_safety_status: 'no_response' | 'safe' | 'help' | 'rescue' | null;
    is_no_response: boolean;
    is_marked_safe: boolean;
    assistance_type: string | null;
    situation: string | null;
    priority: string | null;
    is_pwd: boolean;
    is_pregnant: boolean;
    has_health_problem: boolean;
    health_problem_details: string | null;
    evacuation_center: string | null;
    last_seen_location: {
        name: string;
        latitude: number;
        longitude: number;
        recordedAt: string | null;
    } | null;
};

type IncidentGroup = {
    id: number;
    title: string;
    hazard_type: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    status: string;
    location_name: string | null;
    radius_meters: number;
    created_at: string | null;
    affected_count: number;
    children_count: number;
    senior_count: number;
    pwd_count: number;
    pregnant_count: number;
    health_problem_count: number;
    evacuated_count: number;
    rescued_count: number;
    marked_safe_count: number;
    no_response_count: number;
    needs_help_count: number;
    urgent_rescue_count: number;
    residents: Resident[];
};

type Summary = {
    total: number;
    children: number;
    senior: number;
    pwd: number;
    pregnant: number;
    health_problem: number;
    evacuated: number;
    rescued: number;
    marked_safe: number;
    no_response: number;
    needs_help: number;
    urgent_rescue: number;
};

type AffectedResidentsChangedPayload = {
    incidentId: number;
    action: string;
    affectedResidentId: number | null;
    memberId: number | null;
    resident: Pick<
        Resident,
        | 'id'
        | 'status'
        | 'resident_status'
        | 'circle_safety_status'
        | 'assistance_type'
        | 'situation'
        | 'priority'
        | 'is_no_response'
        | 'is_marked_safe'
    > | null;
};

type LiveAffectedResidents = {
    incidentGroups: IncidentGroup[];
    summary: Summary;
};

type ResidentRealtimeUpdate = NonNullable<AffectedResidentsChangedPayload['resident']>;

function residentResponsePriority(resident: Resident): number {
    if (
        resident.status !== 'rescued' &&
        (resident.circle_safety_status === 'rescue' || (resident.circle_safety_status === null && resident.resident_status === 3))
    ) {
        return 0;
    }

    if (
        resident.status !== 'rescued' &&
        (resident.circle_safety_status === 'help' || (resident.circle_safety_status === null && resident.resident_status === 2))
    ) {
        return 1;
    }

    if (
        resident.status === 'rescued' ||
        resident.circle_safety_status === 'safe' ||
        (resident.circle_safety_status === null && resident.resident_status === 1)
    ) {
        return 2;
    }

    return 3;
}

function googleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function responseCounts(
    residents: Resident[],
): Pick<IncidentGroup, 'evacuated_count' | 'rescued_count' | 'marked_safe_count' | 'no_response_count' | 'needs_help_count' | 'urgent_rescue_count'> {
    return {
        evacuated_count: residents.filter((resident) => resident.status === 'evacuated').length,
        rescued_count: residents.filter((resident) => resident.status === 'rescued').length,
        marked_safe_count: residents.filter((resident) => resident.is_marked_safe).length,
        no_response_count: residents.filter((resident) => resident.is_no_response).length,
        needs_help_count: residents.filter((resident) => resident.circle_safety_status === 'help').length,
        urgent_rescue_count: residents.filter((resident) => resident.circle_safety_status === 'rescue' && resident.status !== 'rescued').length,
    };
}

function applyResidentUpdate(current: LiveAffectedResidents, incidentId: number, update: ResidentRealtimeUpdate): LiveAffectedResidents {
    const incidentGroups = current.incidentGroups.map((incident) => {
        if (incident.id !== incidentId) {
            return incident;
        }

        const residents = incident.residents
            .map((resident) => (resident.id === update.id ? { ...resident, ...update } : resident))
            .sort((first, second) => residentResponsePriority(first) - residentResponsePriority(second));

        return {
            ...incident,
            ...responseCounts(residents),
            residents,
        };
    });
    const residents = incidentGroups.flatMap((incident) => incident.residents);

    return {
        incidentGroups,
        summary: {
            ...current.summary,
            evacuated: residents.filter((resident) => resident.status === 'evacuated').length,
            rescued: residents.filter((resident) => resident.status === 'rescued').length,
            marked_safe: residents.filter((resident) => resident.is_marked_safe).length,
            no_response: residents.filter((resident) => resident.is_no_response).length,
            needs_help: residents.filter((resident) => resident.circle_safety_status === 'help').length,
            urgent_rescue: residents.filter((resident) => resident.circle_safety_status === 'rescue' && resident.status !== 'rescued').length,
        },
    };
}

export default function AffectedResidents({ incidentGroups = [], summary }: { incidentGroups?: IncidentGroup[]; summary: Summary }) {
    const [liveData, setLiveData] = useState<LiveAffectedResidents>({ incidentGroups, summary });
    const [openIncidentId, setOpenIncidentId] = useState<number | null>(incidentGroups[0]?.id ?? null);
    const [notifiedResident, setNotifiedResident] = useState<Resident | null>(null);
    const [smsNotifiedResident, setSmsNotifiedResident] = useState<Resident | null>(null);
    const [safeResident, setSafeResident] = useState<Resident | null>(null);
    const [dispatchedResident, setDispatchedResident] = useState<Resident | null>(null);
    const connectionStatus = useConnectionStatus();

    useEffect(() => {
        setLiveData({ incidentGroups, summary });
    }, [incidentGroups, summary]);

    useEcho<AffectedResidentsChangedPayload>('gcc.affected-residents', 'AffectedResidentsChanged', (payload) => {
        const updatedResident = payload.resident;
        const canUpdateLocally =
            updatedResident !== null &&
            liveData.incidentGroups.some(
                (incident) => incident.id === payload.incidentId && incident.residents.some((resident) => resident.id === updatedResident.id),
            );

        if (!canUpdateLocally || updatedResident === null) {
            router.reload({
                only: ['incidentGroups', 'summary'],
            });

            return;
        }

        setLiveData((current) => applyResidentUpdate(current, payload.incidentId, updatedResident));
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Affected Residents" />

            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Affected Residents</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Review possibly affected residents grouped by disaster incident.</p>
                    </div>
                    <Badge variant={connectionStatus === 'connected' ? 'secondary' : 'outline'} className="w-fit gap-2">
                        <span
                            className={`size-2 rounded-full ${connectionStatus === 'connected' ? 'animate-pulse bg-emerald-500' : 'bg-amber-500'}`}
                        />
                        WebSocket {connectionStatus === 'connected' ? 'live' : connectionStatus}
                    </Badge>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                    <SummaryTile icon={Users} label="Total Records" value={liveData.summary.total} />
                    <SummaryTile icon={Clock3} label="No Response" value={liveData.summary.no_response} />
                    <SummaryTile icon={HandHeart} label="Needs Help" value={liveData.summary.needs_help} />
                    <SummaryTile icon={Siren} label="Urgent Rescue" value={liveData.summary.urgent_rescue} />
                    <SummaryTile icon={CheckCircle2} label="Marked Safe" value={liveData.summary.marked_safe} />
                    <SummaryTile icon={Ambulance} label="Rescued" value={liveData.summary.rescued} />
                    <SummaryTile icon={Baby} label="Children" value={liveData.summary.children} />
                    <SummaryTile icon={PersonStanding} label="Senior" value={liveData.summary.senior} />
                    <SummaryTile icon={PersonStanding} label="PWD" value={liveData.summary.pwd} />
                    <SummaryTile icon={HeartPulse} label="Pregnant" value={liveData.summary.pregnant} />
                    <SummaryTile icon={HeartPulse} label="Health Risk" value={liveData.summary.health_problem} />
                    <SummaryTile icon={Home} label="Evacuated" value={liveData.summary.evacuated} />
                </section>

                <Card className="min-w-0 rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-base">Affected Lists By Disaster</CardTitle>
                    </CardHeader>
                    <CardContent className="grid min-w-0 gap-3">
                        {liveData.incidentGroups.length ? (
                            liveData.incidentGroups.map((incident) => {
                                const isOpen = openIncidentId === incident.id;

                                return (
                                    <div key={incident.id} className="min-w-0 overflow-hidden rounded-md border">
                                        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold">{incident.title}</span>
                                                    <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>
                                                        {incident.severity}
                                                    </Badge>
                                                    <Badge variant="outline" className="capitalize">
                                                        {incident.hazard_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="text-muted-foreground mt-1 text-sm">
                                                    {incident.location_name || 'Pinned map location'} - Radius{' '}
                                                    {incident.radius_meters.toLocaleString()}m - {incident.created_at || incident.status}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                    <Metric label="Affected" value={incident.affected_count} />
                                                    <Metric label="Children" value={incident.children_count} />
                                                    <Metric label="Senior" value={incident.senior_count} />
                                                    <Metric label="PWD" value={incident.pwd_count} />
                                                    <Metric label="Pregnant" value={incident.pregnant_count} />
                                                    <Metric label="Health risk" value={incident.health_problem_count} />
                                                    <Metric label="Evacuated" value={incident.evacuated_count} />
                                                    <Metric label="No response" value={incident.no_response_count} />
                                                    <Metric label="Needs help" value={incident.needs_help_count} />
                                                    <Metric label="Urgent rescue" value={incident.urgent_rescue_count} />
                                                    <Metric label="Marked safe" value={incident.marked_safe_count} />
                                                    <Metric label="Rescued" value={incident.rescued_count} />
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => setOpenIncidentId(isOpen ? null : incident.id)}
                                            >
                                                {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                {isOpen ? 'Hide affected residents' : 'Show affected residents'}
                                            </Button>
                                        </div>

                                        {isOpen && (
                                            <ResidentList
                                                residents={incident.residents}
                                                onNotifyToApp={setNotifiedResident}
                                                onNotifyViaSms={setSmsNotifiedResident}
                                                onMarkSafe={setSafeResident}
                                                onDispatchResponder={setDispatchedResident}
                                            />
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm">
                                No affected resident lists yet. Change a disaster pin status to monitoring to generate one.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={notifiedResident !== null} onOpenChange={(open) => !open && setNotifiedResident(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <DialogTitle>Push Notification Sent</DialogTitle>
                        <DialogDescription>The Kumusta App alert was delivered to the selected resident.</DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Resident</span>
                            <span className="text-right font-medium">{notifiedResident?.full_name || 'Selected resident'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Channel</span>
                            <span className="font-medium">Kumusta App push</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Message</span>
                            <span className="text-right font-medium">Safety check request</span>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-center text-xs">
                        The resident can respond in the app as safe, needs help, or urgently needs help.
                    </p>

                    <DialogFooter>
                        <Button type="button" className="w-full" onClick={() => setNotifiedResident(null)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={smsNotifiedResident !== null} onOpenChange={(open) => !open && setSmsNotifiedResident(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <MessageSquare className="size-6" />
                        </div>
                        <DialogTitle>SMS Notification Sent</DialogTitle>
                        <DialogDescription>The emergency SMS message was queued for delivery to the selected resident.</DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Resident</span>
                            <span className="text-right font-medium">{smsNotifiedResident?.full_name || 'Selected resident'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Channel</span>
                            <span className="font-medium">SMS alert</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Message</span>
                            <span className="text-right font-medium">Emergency safety check</span>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-center text-xs">
                        SMS is useful when the resident has no data connection or cannot open the app.
                    </p>

                    <DialogFooter>
                        <Button type="button" className="w-full" onClick={() => setSmsNotifiedResident(null)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={safeResident !== null} onOpenChange={(open) => !open && setSafeResident(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <DialogTitle>Resident Marked Safe</DialogTitle>
                        <DialogDescription>The resident response status has been updated successfully.</DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Resident</span>
                            <span className="text-right font-medium">{safeResident?.full_name || 'Selected resident'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">New status</span>
                            <span className="font-medium text-emerald-700">Marked safe</span>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-center text-xs">
                        This record will now appear as safe in the affected resident monitoring list.
                    </p>

                    <DialogFooter>
                        <Button type="button" className="w-full" onClick={() => setSafeResident(null)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dispatchedResident !== null} onOpenChange={(open) => !open && setDispatchedResident(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader className="items-center text-center">
                        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-700">
                            <Ambulance className="size-6" />
                        </div>
                        <DialogTitle>Responder Dispatched</DialogTitle>
                        <DialogDescription>A response request was created for the selected resident.</DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/40 grid gap-3 rounded-lg border p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Resident</span>
                            <span className="text-right font-medium">{dispatchedResident?.full_name || 'Selected resident'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">New status</span>
                            <span className="font-medium text-red-700">Responder dispatched</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Action</span>
                            <span className="text-right font-medium">Dispatch responder</span>
                        </div>
                    </div>

                    <p className="text-muted-foreground text-center text-xs">This resident is now flagged as having a responder dispatched.</p>

                    <DialogFooter>
                        <Button type="button" className="w-full" onClick={() => setDispatchedResident(null)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function ResidentList({
    residents,
    onNotifyToApp,
    onNotifyViaSms,
    onMarkSafe,
    onDispatchResponder,
}: {
    residents: Resident[];
    onNotifyToApp: (resident: Resident) => void;
    onNotifyViaSms: (resident: Resident) => void;
    onMarkSafe: (resident: Resident) => void;
    onDispatchResponder: (resident: Resident) => void;
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(residents.length / residentsPerPage));
    const visiblePage = Math.min(currentPage, totalPages);
    const firstResidentIndex = (visiblePage - 1) * residentsPerPage;
    const visibleResidents = residents.slice(firstResidentIndex, firstResidentIndex + residentsPerPage);
    const firstVisibleResident = residents.length === 0 ? 0 : firstResidentIndex + 1;
    const lastVisibleResident = Math.min(firstResidentIndex + residentsPerPage, residents.length);

    return (
        <div className="border-t">
            <div className="bg-muted text-muted-foreground hidden grid-cols-[minmax(0,1.2fr)_120px_minmax(0,1.3fr)_150px_minmax(0,0.9fr)_40px] gap-3 px-4 py-2 text-xs font-medium lg:grid">
                <span>Resident</span>
                <span>Citizen Status</span>
                <span>Reported Need</span>
                <span>Response Status</span>
                <span>Priority Tags</span>
                <span className="text-right">Actions</span>
            </div>

            {visibleResidents.map((resident) => (
                <div
                    key={resident.id}
                    className="relative grid gap-4 border-t p-4 text-sm first:border-t-0 md:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_120px_minmax(0,1.3fr)_150px_minmax(0,0.9fr)_40px] lg:items-start lg:gap-3"
                >
                    <div className="min-w-0 pr-10 lg:pr-0">
                        <p className="truncate font-medium">{resident.full_name}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {resident.age === null ? 'Age not provided' : `${resident.age} years old`}
                        </p>
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                            {[resident.barangay, resident.city].filter(Boolean).join(', ') || 'Location not provided'}
                        </p>
                        {resident.last_seen_location && (
                            <a
                                href={googleMapsUrl(resident.last_seen_location.latitude, resident.last_seen_location.longitude)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`View ${resident.full_name}'s last seen location in Google Maps`}
                                className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                <span className="min-w-0">
                                    <span className="block truncate">{resident.last_seen_location.name}</span>
                                    <span className="text-muted-foreground block text-[10px] font-normal">
                                        Last seen {resident.last_seen_location.recordedAt ?? 'time unavailable'}
                                    </span>
                                </span>
                                <span className="sr-only"> · Opens Google Maps</span>
                            </a>
                        )}
                    </div>

                    <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium lg:hidden">Citizen Status</p>
                        <div>
                            <CircleSafetyStatusBadge status={resident.circle_safety_status} fallbackStatus={resident.resident_status} />
                        </div>
                    </div>

                    <div className="min-w-0">
                        <p className="text-muted-foreground mb-2 text-xs font-medium lg:hidden">Reported Need</p>
                        <div className="space-y-1">
                            {resident.assistance_type !== null && <p className="font-medium">{resident.assistance_type}</p>}
                            {resident.situation !== null && (
                                <p className="text-muted-foreground text-xs leading-5 break-words">{resident.situation}</p>
                            )}
                            {resident.priority !== null && (
                                <span
                                    className={`inline-block border px-2 py-1 text-xs font-semibold ${
                                        resident.circle_safety_status === 'rescue'
                                            ? 'border-red-300 bg-red-50 text-red-700'
                                            : 'border-border bg-muted text-foreground'
                                    }`}
                                >
                                    {resident.priority}
                                </span>
                            )}
                            {resident.assistance_type === null && resident.situation === null && resident.priority === null && (
                                <span className="text-muted-foreground">No reported need</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium lg:hidden">Response Status</p>
                        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start">
                            <Badge variant="outline" className="capitalize">
                                {resident.status.replace('_', ' ')}
                            </Badge>
                            <RescueStatusBadge resident={resident} />
                        </div>
                    </div>

                    <div>
                        <p className="text-muted-foreground mb-2 text-xs font-medium lg:hidden">Priority Tags</p>
                        <div className="flex flex-wrap gap-1">
                            {resident.age !== null && resident.age <= 12 && <Badge variant="secondary">Child</Badge>}
                            {resident.age !== null && resident.age >= 60 && <Badge variant="secondary">Senior Citizen</Badge>}
                            {resident.is_pwd && <Badge variant="secondary">PWD</Badge>}
                            {resident.is_pregnant && <Badge variant="secondary">Pregnant</Badge>}
                            {resident.has_health_problem && (
                                <Badge variant="secondary" className="max-w-full whitespace-normal">
                                    {resident.health_problem_details || 'Health risk'}
                                </Badge>
                            )}
                            {(resident.age === null || (resident.age > 12 && resident.age < 60)) &&
                                !resident.is_pwd &&
                                !resident.is_pregnant &&
                                !resident.has_health_problem && <span className="text-muted-foreground">None</span>}
                        </div>
                    </div>

                    <div className="absolute top-3 right-3 flex justify-end lg:static">
                        <ResidentActionMenu
                            resident={resident}
                            onNotifyToApp={onNotifyToApp}
                            onNotifyViaSms={onNotifyViaSms}
                            onMarkSafe={onMarkSafe}
                            onDispatchResponder={onDispatchResponder}
                        />
                    </div>
                </div>
            ))}

            {residents.length > residentsPerPage && (
                <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-xs">
                        Showing {firstVisibleResident}-{lastVisibleResident} of {residents.length} residents
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={visiblePage === 1}
                            onClick={() => setCurrentPage(visiblePage - 1)}
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>
                        <span className="text-muted-foreground min-w-20 text-center text-xs">
                            Page {visiblePage} of {totalPages}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={visiblePage === totalPages}
                            onClick={() => setCurrentPage(visiblePage + 1)}
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResidentActionMenu({
    resident,
    onNotifyToApp,
    onNotifyViaSms,
    onMarkSafe,
    onDispatchResponder,
}: {
    resident: Resident;
    onNotifyToApp: (resident: Resident) => void;
    onNotifyViaSms: (resident: Resident) => void;
    onMarkSafe: (resident: Resident) => void;
    onDispatchResponder: (resident: Resident) => void;
}) {
    const markSafe = () => {
        router.patch(
            route('gcc.affected-residents.mark-safe', resident.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => onMarkSafe({ ...resident, resident_status: 1 }),
            },
        );
    };

    const dispatchResponder = () => {
        router.patch(
            route('gcc.affected-residents.dispatch-responder', resident.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => onDispatchResponder({ ...resident, resident_status: 3 }),
            },
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open resident actions</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => onNotifyToApp(resident)}>
                    <Smartphone className="mr-2 size-4" />
                    Notify to App
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNotifyViaSms(resident)}>
                    <MessageSquare className="mr-2 size-4" />
                    Notify via SMS
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={markSafe}>
                    <CheckCircle2 className="mr-2 size-4" />
                    Mark Safe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={dispatchResponder}>
                    <Ambulance className="mr-2 size-4" />
                    Dispatch Responder
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ResidentStatusBadge({ status }: { status: number }) {
    const labels: Record<number, { label: string; className: string }> = {
        0: { label: 'No response', className: 'bg-slate-100 text-slate-700' },
        1: { label: 'Marked safe', className: 'bg-emerald-100 text-emerald-700' },
        2: { label: 'Needs help', className: 'bg-amber-100 text-amber-700' },
        3: { label: 'Responder dispatched', className: 'bg-red-100 text-red-700' },
    };
    const item = labels[status] ?? labels[0];

    return <span className={`rounded-md px-2 py-1 text-xs font-medium ${item.className}`}>{item.label}</span>;
}

function CircleSafetyStatusBadge({ status, fallbackStatus }: { status: Resident['circle_safety_status']; fallbackStatus: number }) {
    if (status === null) {
        return <ResidentStatusBadge status={fallbackStatus} />;
    }

    const labels: Record<Exclude<Resident['circle_safety_status'], null>, { label: string; className: string }> = {
        no_response: { label: 'No response', className: 'bg-slate-100 text-slate-700' },
        safe: { label: 'Ligtas Ako', className: 'bg-emerald-100 text-emerald-700' },
        help: { label: 'Needs help', className: 'bg-amber-100 text-amber-700' },
        rescue: { label: 'Urgent rescue', className: 'bg-red-100 text-red-700' },
    };
    const item = labels[status];

    return <span className={`rounded-md px-2 py-1 text-xs font-medium ${item.className}`}>{item.label}</span>;
}

function RescueStatusBadge({ resident }: { resident: Resident }) {
    if (resident.status === 'rescued') {
        return <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">Rescued</span>;
    }

    if (resident.circle_safety_status === 'rescue') {
        return <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Not yet rescued</span>;
    }

    return <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">No rescue required</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <span className="bg-muted rounded-md px-2 py-1">
            {label}: <span className="font-semibold">{value}</span>
        </span>
    );
}

function SummaryTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <Card className="rounded-lg">
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                </div>
                <Icon className="text-primary size-6" />
            </CardContent>
        </Card>
    );
}
