import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import L from 'leaflet';
import { AlertTriangle, Ambulance, Bell, Building2, Clock, Crosshair, Pencil, Radio, ShieldAlert, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Disaster Map', href: '/gcc/disaster-map' }];

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
    description?: string | null;
    created_at?: string | null;
};

type MapIncident = DisasterIncident & {
    coordinates: [number, number];
};

const hazardOptions = [
    { value: 'flood', label: 'Flood', color: '#2563eb' },
    { value: 'earthquake', label: 'Earthquake', color: '#9333ea' },
    { value: 'fire', label: 'Fire', color: '#dc2626' },
    { value: 'landslide', label: 'Landslide', color: '#a16207' },
    { value: 'storm_surge', label: 'Storm Surge', color: '#0891b2' },
    { value: 'tsunami', label: 'Tsunami', color: '#0e7490' },
    { value: 'medical', label: 'Medical Rescue', color: '#16a34a' },
    { value: 'other', label: 'Other', color: '#64748b' },
];

const units = [
    { name: 'Rescue Team Alpha', status: 'On route', eta: '8 min' },
    { name: 'Medical Unit 2', status: 'Available', eta: 'Ready' },
    { name: 'Relief Truck 1', status: 'Loading', eta: '15 min' },
];

export default function DisasterMap({ incidents = [] }: { incidents?: DisasterIncident[] }) {
    const mapIncidents = incidents.map((incident) => ({
        ...incident,
        coordinates: [incident.latitude, incident.longitude] as [number, number],
    }));

    const openIncidents = mapIncidents.filter((incident) => incident.status !== 'resolved');
    const criticalIncidents = mapIncidents.filter((incident) => incident.severity === 'critical');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Disaster Map" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <section className="grid gap-4 md:grid-cols-4">
                    <StatusTile icon={ShieldAlert} label="Active Incidents" value={String(openIncidents.length)} tone="text-red-600" />
                    <StatusTile icon={Ambulance} label="Teams Deployed" value="7" tone="text-blue-600" />
                    <StatusTile icon={Building2} label="Evacuation Sites" value="12" tone="text-emerald-600" />
                    <StatusTile icon={Bell} label="Critical Alerts" value={String(criticalIncidents.length)} tone="text-amber-600" />
                </section>

                <section className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <Card id="map" className="overflow-hidden rounded-lg">
                        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
                            <div>
                                <CardTitle className="text-base">Philippines Disaster Operations Map</CardTitle>
                                <p className="text-sm text-muted-foreground">Tap the map to save a disaster pin with radius and details.</p>
                            </div>
                            <Badge variant="secondary" className="gap-2">
                                <Crosshair className="size-4" />
                                Click Map
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <PhilippinesOperationsMap incidents={mapIncidents} />
                        </CardContent>
                    </Card>

                    <div className="grid gap-4">
                        <Card id="incidents" className="rounded-lg">
                            <CardHeader>
                                <CardTitle className="text-base">Priority Incidents</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                {mapIncidents.length ? (
                                    mapIncidents.slice(0, 5).map((incident) => (
                                        <div key={incident.id} className="rounded-md border p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="font-medium">{incident.title}</div>
                                                <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>{incident.severity}</Badge>
                                            </div>
                                            <div className="mt-1 text-sm text-muted-foreground">{incident.location_name || 'Pinned map location'}</div>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="size-3" />
                                                {incident.created_at || incident.status}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                        No disaster pins yet. Click the map to add the first incident.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card id="units" className="rounded-lg">
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

function PhilippinesOperationsMap({ incidents }: { incidents: MapIncident[] }) {
    const [selectedPin, setSelectedPin] = useState<MapIncident | null>(incidents[0] ?? null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIncident, setEditingIncident] = useState<MapIncident | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const { data, setData, post, put, processing, reset, errors } = useForm({
        title: '',
        hazard_type: 'flood',
        severity: 'moderate',
        status: 'open',
        latitude: 12.8797,
        longitude: 121.774,
        radius_meters: 1000,
        color: '#2563eb',
        location_name: '',
        description: '',
    });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setSelectedPin(incidents[0]);
    }, [incidents]);

    const openIncidentDialog = (coordinates: [number, number]) => {
        setEditingIncident(null);
        setData({
            title: '',
            hazard_type: 'flood',
            severity: 'moderate',
            status: 'open',
            latitude: Number(coordinates[0].toFixed(7)),
            longitude: Number(coordinates[1].toFixed(7)),
            radius_meters: 1000,
            color: '#2563eb',
            location_name: '',
            description: '',
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (incident: MapIncident) => {
        setEditingIncident(incident);
        setData({
            title: incident.title,
            hazard_type: incident.hazard_type,
            severity: incident.severity,
            status: incident.status,
            latitude: Number(incident.latitude),
            longitude: Number(incident.longitude),
            radius_meters: incident.radius_meters,
            color: incident.color,
            location_name: incident.location_name ?? '',
            description: incident.description ?? '',
        });
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingIncident(null);
        reset();
    };

    const submitIncident = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                closeDialog();
            },
        };

        if (editingIncident) {
            put(route('gcc.incidents.update', editingIncident.id), options);
            return;
        }

        post(route('gcc.incidents.store'), options);
    };

    const handleHazardChange = (hazardType: string) => {
        const hazard = hazardOptions.find((option) => option.value === hazardType);

        setData('hazard_type', hazardType);
        setData('color', hazard?.color ?? data.color);

        if (!data.title && hazard) {
            setData('title', hazard.label);
        }
    };

    return (
        <div className="relative min-h-[520px] overflow-hidden bg-[#dff3f6]">
            <div className="absolute left-4 top-4 z-10 rounded-lg border bg-white/90 p-3 text-xs shadow-sm backdrop-blur">
                <div className="font-medium">Live Layers</div>
                <div className="mt-2 grid gap-1 text-muted-foreground">
                    <span>Incident pins</span>
                    <span>Hazard radius</span>
                    <span>Evacuation readiness</span>
                </div>
            </div>

            {isMounted && (
                <MapContainer center={[12.8797, 121.774]} zoom={6} minZoom={5} maxZoom={15} scrollWheelZoom className="z-0 h-[520px] w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onMapClick={openIncidentDialog} />
                    {selectedPin && <FlyToIncident coordinates={selectedPin.coordinates} />}

                    {incidents.map((pin) => (
                        <Marker
                            key={pin.id}
                            position={pin.coordinates}
                            icon={createIncidentIcon(pin.color)}
                            eventHandlers={{ click: () => setSelectedPin(pin) }}
                        >
                            <Popup>
                                <div className="min-w-44">
                                    <div className="font-semibold">{pin.title}</div>
                                    <div>{pin.location_name || 'Pinned map location'}</div>
                                    <div className="mt-1 text-xs">Status: {pin.status}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {incidents.map((pin) => (
                        <Circle
                            key={`${pin.id}-radius`}
                            center={pin.coordinates}
                            radius={pin.radius_meters}
                            pathOptions={{
                                color: pin.color,
                                fillColor: pin.color,
                                fillOpacity: selectedPin?.id === pin.id ? 0.22 : 0.1,
                                weight: selectedPin?.id === pin.id ? 3 : 1,
                            }}
                        />
                    ))}
                </MapContainer>
            )}

            <div className="absolute bottom-4 right-4 z-20 w-[min(340px,calc(100%-2rem))] rounded-lg border bg-white/95 p-4 shadow-sm backdrop-blur">
                {selectedPin ? (
                    <>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold">{selectedPin.title}</div>
                                <div className="text-xs text-muted-foreground">{selectedPin.location_name || 'Pinned map location'}</div>
                            </div>
                            <Badge variant={selectedPin.severity === 'critical' ? 'destructive' : 'secondary'}>{selectedPin.severity}</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Hazard type</span>
                                <span className="font-medium capitalize">{selectedPin.hazard_type.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">GCC status</span>
                                <span className="font-medium capitalize">{selectedPin.status}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Radius</span>
                                <span className="font-medium">{selectedPin.radius_meters.toLocaleString()} m</span>
                            </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" className="mt-4 w-full gap-2" onClick={() => openEditDialog(selectedPin)}>
                            <Pencil className="size-4" />
                            Edit Incident
                        </Button>
                    </>
                ) : (
                    <div>
                        <div className="text-sm font-semibold">No disaster selected</div>
                        <p className="mt-1 text-xs text-muted-foreground">Click anywhere on the map to add the first disaster pin.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingIncident ? 'Edit Disaster Pin' : 'Add Disaster Pin'}</DialogTitle>
                        <DialogDescription>
                            {editingIncident ? 'Update the selected GCC incident marker.' : 'Save a GCC incident marker at the map point you selected.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitIncident} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Incident title</Label>
                            <Input id="title" value={data.title} onChange={(event) => setData('title', event.target.value)} placeholder="Flooding near riverbank" />
                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Hazard type</Label>
                                <Select value={data.hazard_type} onValueChange={handleHazardChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hazardOptions.map((hazard) => (
                                            <SelectItem key={hazard.value} value={hazard.value}>
                                                {hazard.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.hazard_type && <p className="text-xs text-destructive">{errors.hazard_type}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label>Severity</Label>
                                <Select value={data.severity} onValueChange={(value) => setData('severity', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="moderate">Moderate</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.severity && <p className="text-xs text-destructive">{errors.severity}</p>}
                            </div>
                        </div>

                        {editingIncident && (
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="monitoring">Monitoring</SelectItem>
                                        <SelectItem value="dispatching">Dispatching</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                            <div className="grid gap-2">
                                <Label htmlFor="radius_meters">Affected radius in meters</Label>
                                <Input
                                    id="radius_meters"
                                    type="number"
                                    min="100"
                                    max="200000"
                                    step="100"
                                    value={data.radius_meters}
                                    onChange={(event) => setData('radius_meters', Number(event.target.value))}
                                />
                                {errors.radius_meters && <p className="text-xs text-destructive">{errors.radius_meters}</p>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="color">Map color</Label>
                                <Input id="color" type="color" value={data.color} onChange={(event) => setData('color', event.target.value)} className="h-10 p-1" />
                                {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location_name">Location name</Label>
                            <Input
                                id="location_name"
                                value={data.location_name}
                                onChange={(event) => setData('location_name', event.target.value)}
                                placeholder="Barangay, city, or landmark"
                            />
                            {errors.location_name && <p className="text-xs text-destructive">{errors.location_name}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Details</Label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(event) => setData('description', event.target.value)}
                                className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Current situation, affected families, access notes, or rescue needs"
                            />
                            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                        </div>

                        <div className="grid gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>Latitude: {data.latitude}</span>
                            <span>Longitude: {data.longitude}</span>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingIncident ? 'Save Changes' : 'Save Pin'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function createIncidentIcon(color: string) {
    return L.divIcon({
        className: '',
        html: `<div style="background:${color}" class="flex size-9 items-center justify-center rounded-full border-2 border-white text-white shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
}

function MapClickHandler({ onMapClick }: { onMapClick: (coordinates: [number, number]) => void }) {
    useMapEvents({
        click(event) {
            onMapClick([event.latlng.lat, event.latlng.lng]);
        },
    });

    return null;
}

function FlyToIncident({ coordinates }: { coordinates: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.flyTo(coordinates, Math.max(map.getZoom(), 8), { duration: 0.8 });
    }, [coordinates, map]);

    return null;
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
