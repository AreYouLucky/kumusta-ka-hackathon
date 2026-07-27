import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Ambulance, Baby, CheckCircle2, ChevronDown, ChevronUp, HeartPulse, Home, MessageSquare, MoreHorizontal, PersonStanding, Smartphone, Users } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Affected Residents', href: '/gcc/affected-residents' }];

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
    is_pwd: boolean;
    is_pregnant: boolean;
    has_health_problem: boolean;
    health_problem_details: string | null;
    evacuation_center: string | null;
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
};

export default function AffectedResidents({ incidentGroups = [], summary }: { incidentGroups?: IncidentGroup[]; summary: Summary }) {
    const [openIncidentId, setOpenIncidentId] = useState<number | null>(incidentGroups[0]?.id ?? null);
    const [notifiedResident, setNotifiedResident] = useState<Resident | null>(null);
    const [smsNotifiedResident, setSmsNotifiedResident] = useState<Resident | null>(null);
    const [safeResident, setSafeResident] = useState<Resident | null>(null);
    const [dispatchedResident, setDispatchedResident] = useState<Resident | null>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Affected Residents" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <section>
                    <h1 className="text-xl font-semibold">Affected Residents</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review possibly affected residents grouped by disaster incident.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-7">
                    <SummaryTile icon={Users} label="Total Records" value={summary.total} />
                    <SummaryTile icon={Baby} label="Children" value={summary.children} />
                    <SummaryTile icon={PersonStanding} label="Senior" value={summary.senior} />
                    <SummaryTile icon={PersonStanding} label="PWD" value={summary.pwd} />
                    <SummaryTile icon={HeartPulse} label="Pregnant" value={summary.pregnant} />
                    <SummaryTile icon={HeartPulse} label="Health Risk" value={summary.health_problem} />
                    <SummaryTile icon={Home} label="Evacuated" value={summary.evacuated} />
                </section>

                <Card className="rounded-lg">
                    <CardHeader>
                        <CardTitle className="text-base">Affected Lists By Disaster</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {incidentGroups.length ? (
                            incidentGroups.map((incident) => {
                                const isOpen = openIncidentId === incident.id;

                                return (
                                    <div key={incident.id} className="overflow-hidden rounded-md border">
                                        <div className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold">{incident.title}</span>
                                                    <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>{incident.severity}</Badge>
                                                    <Badge variant="outline" className="capitalize">
                                                        {incident.hazard_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {incident.location_name || 'Pinned map location'} - Radius {incident.radius_meters.toLocaleString()}m -{' '}
                                                    {incident.created_at || incident.status}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                    <Metric label="Affected" value={incident.affected_count} />
                                                    <Metric label="Children" value={incident.children_count} />
                                                    <Metric label="Senior" value={incident.senior_count} />
                                                    <Metric label="PWD" value={incident.pwd_count} />
                                                    <Metric label="Pregnant" value={incident.pregnant_count} />
                                                    <Metric label="Health risk" value={incident.health_problem_count} />
                                                    <Metric label="Evacuated" value={incident.evacuated_count} />
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
                            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
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
                        <DialogDescription>
                            The Kumusta App alert was delivered to the selected resident.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Resident</span>
                            <span className="font-medium text-right">{notifiedResident?.full_name || 'Selected resident'}</span>
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

                    <p className="text-center text-xs text-muted-foreground">
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
                        <DialogDescription>
                            The emergency SMS message was queued for delivery to the selected resident.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
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

                    <p className="text-center text-xs text-muted-foreground">
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
                        <DialogDescription>
                            The resident response status has been updated successfully.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Resident</span>
                            <span className="text-right font-medium">{safeResident?.full_name || 'Selected resident'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">New status</span>
                            <span className="font-medium text-emerald-700">Marked safe</span>
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground">
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
                        <DialogDescription>
                            A response request was created for the selected resident.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
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

                    <p className="text-center text-xs text-muted-foreground">
                        This resident is now flagged as having a responder dispatched.
                    </p>

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
    return (
        <div className="border-t">
            <div className="grid grid-cols-[1.2fr_70px_1fr_130px_120px_150px_48px] gap-3 bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Name</span>
                <span>Age</span>
                <span>Location</span>
                <span>Resident Status</span>
                <span>Status</span>
                <span>Priority Tags</span>
                <span className="text-right">Actions</span>
            </div>
            {residents.map((resident) => (
                <div key={resident.id} className="grid grid-cols-[1.2fr_70px_1fr_130px_120px_150px_48px] gap-3 border-t px-3 py-3 text-sm">
                    <span className="font-medium">{resident.full_name}</span>
                    <span>{resident.age ?? '-'}</span>
                    <span className="text-muted-foreground">{[resident.barangay, resident.city].filter(Boolean).join(', ') || '-'}</span>
                    <span>
                        <ResidentStatusBadge status={resident.resident_status} />
                    </span>
                    <span className="capitalize">{resident.status.replace('_', ' ')}</span>
                    <span className="flex flex-wrap gap-1">
                        {resident.age !== null && resident.age <= 12 && <Badge variant="secondary">Child</Badge>}
                        {resident.age !== null && resident.age >= 60 && <Badge variant="secondary">Senior Citizen</Badge>}
                        {resident.is_pwd && <Badge variant="secondary">PWD</Badge>}
                        {resident.is_pregnant && <Badge variant="secondary">Pregnant</Badge>}
                        {resident.has_health_problem && <Badge variant="secondary">{resident.health_problem_details || 'Health risk'}</Badge>}
                    </span>
                    <span className="flex justify-end">
                        <ResidentActionMenu
                            resident={resident}
                            onNotifyToApp={onNotifyToApp}
                            onNotifyViaSms={onNotifyViaSms}
                            onMarkSafe={onMarkSafe}
                            onDispatchResponder={onDispatchResponder}
                        />
                    </span>
                </div>
            ))}
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

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <span className="rounded-md bg-muted px-2 py-1">
            {label}: <span className="font-semibold">{value}</span>
        </span>
    );
}

function SummaryTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
    return (
        <Card className="rounded-lg">
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                </div>
                <Icon className="size-6 text-primary" />
            </CardContent>
        </Card>
    );
}
