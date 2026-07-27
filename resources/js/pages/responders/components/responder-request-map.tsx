import { divIcon, latLngBounds } from 'leaflet';
import { MapPin } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import type { ResponderRequest } from '../index';

import 'leaflet/dist/leaflet.css';

type MappableRequest = ResponderRequest & {
    coordinates: [number, number];
};

type ResponderRequestMapProps = {
    requests: ResponderRequest[];
};

const philippinesCenter: [number, number] = [12.8797, 121.774];

function markerIcon(isUrgent: boolean) {
    const background = isUrgent ? '#dc2626' : '#f97316';

    return divIcon({
        className: '',
        html: `<span style="display:grid;width:38px;height:38px;place-items:center;border:4px solid white;border-radius:9999px;background:${background};color:white;box-shadow:0 8px 20px rgba(15,23,42,.28)"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
    });
}

function MapBounds({ requests }: { requests: MappableRequest[] }): null {
    const map = useMap();

    useEffect(() => {
        if (requests.length === 0) {
            map.setView(philippinesCenter, 6);
        } else if (requests.length === 1) {
            map.setView(requests[0].coordinates, 15);
        } else {
            map.fitBounds(latLngBounds(requests.map((request) => request.coordinates)), {
                padding: [36, 36],
                maxZoom: 15,
            });
        }
    }, [map, requests]);

    return null;
}

export function ResponderRequestMap({ requests }: ResponderRequestMapProps): JSX.Element {
    const [isMounted, setIsMounted] = useState(false);
    const mappableRequests = useMemo(
        () =>
            requests.flatMap((request): MappableRequest[] => {
                if (request.latitude === null || request.longitude === null) {
                    return [];
                }

                const latitude = Number(request.latitude);
                const longitude = Number(request.longitude);

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                    return [];
                }

                return [{ ...request, coordinates: [latitude, longitude] }];
            }),
        [requests],
    );

    useEffect(() => setIsMounted(true), []);

    if (!isMounted) {
        return <div className="h-80 animate-pulse bg-slate-100 sm:h-96" />;
    }

    return (
        <div className="relative h-80 sm:h-96">
            <MapContainer center={mappableRequests[0]?.coordinates ?? philippinesCenter} zoom={6} scrollWheelZoom className="z-0 h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBounds requests={mappableRequests} />
                {mappableRequests.map((request) => {
                    const isUrgent = request.safety_status === 'rescue';

                    return (
                        <Marker key={request.id} position={request.coordinates} icon={markerIcon(isUrgent)}>
                            <Popup>
                                <div className="min-w-52">
                                    <p className={`text-xs font-bold uppercase ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
                                        {isUrgent ? 'Urgent rescue' : 'Needs help'}
                                    </p>
                                    <p className="mt-1 font-bold text-slate-950">{request.citizen_name}</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {request.assistance_type ?? request.situation ?? 'Assistance requested'}
                                    </p>
                                    <p className="mt-2 flex items-start gap-1 text-xs text-slate-600">
                                        <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                                        {request.location_name ?? 'Pinned circle location'}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${request.coordinates[0]},${request.coordinates[1]}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 inline-flex text-xs font-bold text-sky-700 underline"
                                    >
                                        Open directions
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {mappableRequests.length === 0 && (
                <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] rounded-xl bg-white/95 px-4 py-3 text-center text-xs font-bold text-slate-600 shadow-lg">
                    Active requests with saved coordinates will appear here.
                </div>
            )}
        </div>
    );
}
