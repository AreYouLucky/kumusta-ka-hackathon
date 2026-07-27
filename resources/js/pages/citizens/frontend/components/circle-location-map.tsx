import type { LeafletMouseEvent } from 'leaflet';
import { divIcon } from 'leaflet';
import { CheckCircle2, MapPin } from 'lucide-react';
import type { JSX } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

export type MapPoint = {
    latitude: number;
    longitude: number;
};

type CircleLocationMapProps = {
    selectedPoint: MapPoint | null;
    onPointChange: (point: MapPoint) => void;
};

type MapClickHandlerProps = {
    onPointChange: (point: MapPoint) => void;
};

const philippinesCenter: [number, number] = [12.8797, 121.774];

const locationMarkerIcon = divIcon({
    className: '',
    html: '<span style="display:grid;width:36px;height:36px;place-items:center;border:4px solid white;border-radius:9999px;background:#0ea5e9;color:white;box-shadow:0 6px 16px rgba(14,165,233,.32)"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
});

function MapClickHandler({ onPointChange }: MapClickHandlerProps): null {
    useMapEvents({
        click(event: LeafletMouseEvent): void {
            onPointChange({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    return null;
}

export function CircleLocationMap({ selectedPoint, onPointChange }: CircleLocationMapProps): JSX.Element {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <div className="relative h-72 sm:h-80">
                <MapContainer
                    center={philippinesCenter}
                    zoom={6}
                    scrollWheelZoom
                    className="z-0 h-full w-full"
                    aria-label="Select circle location on map"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onPointChange={onPointChange} />
                    {selectedPoint !== null && <Marker position={[selectedPoint.latitude, selectedPoint.longitude]} icon={locationMarkerIcon} />}
                </MapContainer>

                {selectedPoint === null && (
                    <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2.5 text-xs font-bold text-slate-700 shadow-lg backdrop-blur-sm">
                        <MapPin className="size-4 shrink-0 text-sky-500" aria-hidden="true" />
                        Tap anywhere on the map to place the circle pin
                    </div>
                )}

                {selectedPoint !== null && (
                    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[400] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2.5 text-xs font-bold text-green-700 shadow-lg backdrop-blur-sm">
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                        Location selected. Tap again to move the pin.
                    </div>
                )}
            </div>
        </div>
    );
}
