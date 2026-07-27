import {
    Building2,
    CheckCircle2,
    ImagePlus,
    LoaderCircle,
    LocateFixed,
    MapPin,
    Navigation,
    Radio,
    RefreshCw,
    Send,
    ShieldCheck,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import type { ChangeEvent, JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';

type SafeFlowStep = 'details' | 'sending' | 'guidance';
type LocationStatus = 'requesting' | 'ready' | 'unavailable';

type SafeStatusFlowProps = {
    onComplete: () => void;
    subjectName?: string;
};

function formatCoordinate(value: number, positiveDirection: string, negativeDirection: string): string {
    const direction = value >= 0 ? positiveDirection : negativeDirection;

    return `${Math.abs(value).toFixed(6)}° ${direction}`;
}

export function SafeStatusFlow({ onComplete, subjectName }: SafeStatusFlowProps): JSX.Element {
    const [step, setStep] = useState<SafeFlowStep>('details');
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('requesting');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);

    const captureCurrentLocation = useCallback((): void => {
        setLocationStatus('requesting');

        if (!('geolocation' in navigator)) {
            setLocationStatus('unavailable');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = formatCoordinate(position.coords.latitude, 'N', 'S');
                const longitude = formatCoordinate(position.coords.longitude, 'E', 'W');

                setAddress('Current device location');
                setCoordinates(`${latitude}, ${longitude}`);
                setLocationStatus('ready');
            },
            () => setLocationStatus('unavailable'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
    }, []);

    useEffect(() => {
        captureCurrentLocation();
    }, [captureCurrentLocation]);

    useEffect(() => {
        if (step !== 'sending') {
            return;
        }

        const guidanceTimer = window.setTimeout(() => setStep('guidance'), 3000);

        return () => window.clearTimeout(guidanceTimer);
    }, [step]);

    useEffect(() => {
        return () => {
            if (attachmentPreviewUrl !== null) {
                URL.revokeObjectURL(attachmentPreviewUrl);
            }
        };
    }, [attachmentPreviewUrl]);

    function selectAttachment(event: ChangeEvent<HTMLInputElement>): void {
        const selectedFile = event.target.files?.[0];

        if (selectedFile === undefined || !selectedFile.type.startsWith('image/')) {
            return;
        }

        setAttachment(selectedFile);
        setAttachmentPreviewUrl(URL.createObjectURL(selectedFile));
        event.target.value = '';
    }

    function removeAttachment(): void {
        setAttachment(null);
        setAttachmentPreviewUrl(null);
    }

    if (step === 'sending') {
        return (
            <div className="py-8 text-center">
                <span className="mx-auto grid size-20 place-items-center rounded-full bg-green-100 text-green-600">
                    <LoaderCircle className="size-9 animate-spin" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-black text-black">Ipinapadala ang Ligtas Ako check-in...</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Inihahanda ang safety status, lokasyon, at attachment.</p>

                <div className="mx-auto mt-5 grid max-w-xs gap-2 text-left text-xs font-semibold text-slate-600">
                    <SendingItem label={subjectName === undefined ? 'Ligtas Ako status confirmed' : `${subjectName}'s safe status confirmed`} />
                    <SendingItem label="Current location attached" />
                    {attachment !== null && <SendingItem label="Image attachment prepared" />}
                    <SendingItem label="Connecting to Kumusta Ka response server" isLoading />
                </div>

                <p className="mt-5 text-[11px] leading-5 font-semibold text-slate-400">
                    Prototype mode: walang aktuwal na backend request na ipinapadala.
                </p>
            </div>
        );
    }

    if (step === 'guidance') {
        return (
            <div className="py-4 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="size-8" aria-hidden="true" />
                </span>
                <p className="mt-4 text-xs font-extrabold tracking-[0.14em] text-green-700 uppercase">Ligtas Ako check-in prepared</p>
                <h2 className="mt-1 text-xl font-black text-black">Manatiling alerto sa aftershocks.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Kahit ligtas ka ngayon, maaaring magkaroon pa ng kasunod na pagyanig.</p>

                <div className="mt-5 grid gap-2.5 text-left">
                    <GuidanceItem icon={<ShieldCheck className="size-4" />} text="Kapag muling yumanig: Drop, Cover, at Hold On." />
                    <GuidanceItem
                        icon={<Navigation className="size-4" />}
                        text="Lumipat lamang sa malinaw at ligtas na lugar kapag tumigil na ang pagyanig."
                    />
                    <GuidanceItem
                        icon={<Building2 className="size-4" />}
                        text="Lumayo sa sirang gusali, nahulog na debris, puno, at mga linya ng kuryente."
                    />
                    <GuidanceItem icon={<Radio className="size-4" />} text="Subaybayan ang opisyal na abiso ng PHIVOLCS at inyong LGU." />
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-left text-xs leading-5 font-semibold text-orange-800">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    Huwag bumalik sa napinsalang gusali hangga't hindi sinasabing ligtas ng awtoridad.
                </div>

                <button
                    type="button"
                    onClick={onComplete}
                    className="mt-5 h-11 rounded-xl bg-sky-500 px-8 text-sm font-extrabold text-white transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                    Naiintindihan ko
                </button>
            </div>
        );
    }

    const isLocationReady = address.trim() !== '' && coordinates.trim() !== '';

    return (
        <div className="pt-4">
            <div className="text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-600">
                    <ShieldCheck className="size-8" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-black text-black">Kumpirmahin ang Ligtas Ako status</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                    {subjectName === undefined
                        ? 'Ire-record ang iyong kasalukuyang lokasyon kasama ng check-in.'
                        : `Safety update para kay ${subjectName}.`}
                </p>
            </div>

            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-extrabold text-green-800">
                            <LocateFixed className="size-4" aria-hidden="true" />
                            CURRENT LOCATION
                        </div>
                        <p className="mt-1 text-[11px] leading-5 text-green-700">
                            {locationStatus === 'requesting'
                                ? 'Humihingi ng pahintulot sa lokasyon...'
                                : locationStatus === 'ready'
                                  ? 'Nakuha ang lokasyon mula sa device.'
                                  : 'Hindi nakuha ang lokasyon. Maaari itong ilagay nang manu-mano.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={captureCurrentLocation}
                        aria-label="Capture current location again"
                        className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-green-700 shadow-sm transition hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
                    >
                        <RefreshCw className={`size-4 ${locationStatus === 'requesting' ? 'animate-spin' : ''}`} aria-hidden="true" />
                    </button>
                </div>

                <label className="mt-3 grid gap-1.5 text-[10px] font-extrabold tracking-wide text-green-700 uppercase">
                    Location label
                    <span className="relative">
                        <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-green-500" aria-hidden="true" />
                        <input
                            type="text"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="Ilagay ang kasalukuyang lugar"
                            className="h-11 w-full rounded-xl border border-green-200 bg-white pr-3 pl-9 text-xs font-bold tracking-normal text-slate-700 normal-case outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                        />
                    </span>
                </label>
                <label className="mt-3 grid gap-1.5 text-[10px] font-extrabold tracking-wide text-green-700 uppercase">
                    Coordinates
                    <input
                        type="text"
                        value={coordinates}
                        onChange={(event) => setCoordinates(event.target.value)}
                        placeholder="Latitude, Longitude"
                        className="h-11 rounded-xl border border-green-200 bg-white px-3 font-mono text-xs font-bold tracking-normal text-slate-700 normal-case outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100"
                    />
                </label>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-extrabold text-slate-900">Mag-attach ng larawan</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Optional: magdagdag ng larawan ng iyong kasalukuyang paligid.</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                        <ImagePlus className="size-4" aria-hidden="true" />
                    </span>
                </div>

                {attachmentPreviewUrl !== null && attachment !== null ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img src={attachmentPreviewUrl} alt="Preview ng napiling attachment" className="aspect-video w-full object-cover" />
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <p className="min-w-0 truncate text-xs font-bold text-slate-700">{attachment.name}</p>
                            <div className="flex shrink-0 items-center gap-1">
                                <label className="cursor-pointer rounded-lg px-2.5 py-2 text-[11px] font-extrabold text-sky-600 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-500 hover:bg-sky-50">
                                    Palitan
                                    <input type="file" accept="image/*" capture="environment" onChange={selectAttachment} className="sr-only" />
                                </label>
                                <button
                                    type="button"
                                    onClick={removeAttachment}
                                    aria-label="Remove attached image"
                                    className="grid size-9 place-items-center rounded-lg text-red-500 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                                >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-4 py-4 text-xs font-extrabold text-sky-700 transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-500 hover:border-sky-400 hover:bg-sky-100">
                        <ImagePlus className="size-4" aria-hidden="true" />
                        Kumuha o pumili ng larawan
                        <input type="file" accept="image/*" capture="environment" onChange={selectAttachment} className="sr-only" />
                    </label>
                )}
            </div>

            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs leading-5 font-semibold text-sky-800">
                Ang safety status, lokasyon, at larawan kung mayroon ay ihahanda para sa Kumusta Ka response system.
            </div>

            <button
                type="button"
                disabled={!isLocationReady || locationStatus === 'requesting'}
                onClick={() => setStep('sending')}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(14,165,233,0.24)] transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
                <Send className="size-4" aria-hidden="true" />
                I-submit ang Ligtas Ako Status
            </button>
        </div>
    );
}

function SendingItem({ label, isLoading = false }: { label: string; isLoading?: boolean }): JSX.Element {
    return (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            {isLoading ? (
                <LoaderCircle className="size-4 animate-spin text-sky-500" aria-hidden="true" />
            ) : (
                <CheckCircle2 className="size-4 text-green-500" aria-hidden="true" />
            )}
            {label}
        </div>
    );
}

function GuidanceItem({ icon, text }: { icon: JSX.Element; text: string }): JSX.Element {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs leading-5 font-semibold text-slate-700">
            <span className="mt-0.5 text-sky-600">{icon}</span>
            {text}
        </div>
    );
}
