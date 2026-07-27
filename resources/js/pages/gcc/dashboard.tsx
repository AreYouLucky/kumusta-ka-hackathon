import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Ambulance, Bell, Building2, Clock, MapPinned, Radio, ShieldAlert, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Overview', href: '/gcc/dashboard' }];

type DisasterIncident = {
    id: number;
    title: string;
    hazard_type: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    status: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    color: string;
    location_name?: string | null;
    created_at?: string | null;
};

const units = [
    { name: 'Rescue Team Alpha', status: 'On route', eta: '8 min' },
    { name: 'Medical Unit 2', status: 'Available', eta: 'Ready' },
    { name: 'Relief Truck 1', status: 'Loading', eta: '15 min' },
];

export default function GCCDashboard({ incidents = [] }: { incidents?: DisasterIncident[] }) {
    const activeIncidents = incidents.filter((incident) => incident.status !== 'resolved');
    const criticalIncidents = incidents.filter((incident) => incident.severity === 'critical');
    const dispatchingIncidents = incidents.filter((incident) => incident.status === 'dispatching');
    const recentIncidents = incidents.slice(0, 5);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="GCC Overview" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <section className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Government Command Center</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Operational summary for current disaster response activity.</p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link href="/gcc/disaster-map">
                            <MapPinned className="size-4" />
                            Open Disaster Map
                        </Link>
                    </Button>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <StatusTile icon={ShieldAlert} label="Active Incidents" value={String(activeIncidents.length)} tone="text-red-600" />
                    <StatusTile icon={Ambulance} label="Teams Deployed" value="7" tone="text-blue-600" />
                    <StatusTile icon={Building2} label="Evacuation Sites" value="12" tone="text-emerald-600" />
                    <StatusTile icon={Bell} label="Critical Alerts" value={String(criticalIncidents.length)} tone="text-amber-600" />
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <Card className="rounded-lg">
                        <CardHeader>
                            <CardTitle className="text-base">Priority Incident Queue</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {recentIncidents.length ? (
                                recentIncidents.map((incident) => (
                                    <div key={incident.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto] md:items-center">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{incident.title}</span>
                                                <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>{incident.severity}</Badge>
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">{incident.location_name || 'Pinned map location'}</div>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="size-3" />
                                                {incident.created_at || incident.status}
                                            </div>
                                        </div>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/gcc/disaster-map">View Map</Link>
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                                    No saved incident pins yet. Open the Disaster Map to add the first report.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        <Card className="rounded-lg">
                            <CardHeader>
                                <CardTitle className="text-base">Response Units</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                {units.map((unit) => (
                                    <div key={unit.name} className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <div className="font-medium">{unit.name}</div>
                                            <div className="text-sm text-muted-foreground">{unit.status}</div>
                                        </div>
                                        <Badge>{unit.eta}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg">
                            <CardHeader>
                                <CardTitle className="text-base">Dispatch Snapshot</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 text-sm">
                                <SnapshotRow label="Dispatching" value={String(dispatchingIncidents.length)} />
                                <SnapshotRow label="Monitoring" value={String(incidents.filter((incident) => incident.status === 'monitoring').length)} />
                                <SnapshotRow label="Resolved" value={String(incidents.filter((incident) => incident.status === 'resolved').length)} />
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    <ActionCard icon={Radio} title="Broadcast Alert" copy="Send public advisories to affected barangays." />
                    <ActionCard icon={Users} title="Assign Responders" copy="Match teams to active incident locations." />
                    <ActionCard icon={AlertTriangle} title="Escalate Disaster Level" copy="Flag incidents for city-wide coordination." />
                </section>
            </div>
        </AppLayout>
    );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function StatusTile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
    return (
        <Card className="rounded-lg">
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-semibold">{value}</p>
                </div>
                <Icon className={`size-6 ${tone}`} />
            </CardContent>
        </Card>
    );
}

function ActionCard({ icon: Icon, title, copy }: { icon: React.ElementType; title: string; copy: string }) {
    return (
        <Card className="rounded-lg">
            <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-5" />
                </div>
                <div>
                    <div className="font-medium">{title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
                </div>
            </CardContent>
        </Card>
    );
}
