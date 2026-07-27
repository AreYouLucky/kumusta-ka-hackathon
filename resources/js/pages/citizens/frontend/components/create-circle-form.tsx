import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, LoaderCircle, LocateFixed, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { type FormEvent, type JSX } from 'react';

import { CircleLocationMap, type MapPoint } from './circle-location-map';

type CircleFormData = {
    name: string;
    location: string;
    description: string;
};

export function CreateCircleForm(): JSX.Element {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        location: '',
        description: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });
    const selectedPoint: MapPoint | null =
        data.latitude !== null && data.longitude !== null ? { latitude: data.latitude, longitude: data.longitude } : null;
    const hasCircleDetails = data.name.trim().length > 0 && data.location.trim().length > 0;
    const hasSelectedLocation = selectedPoint !== null;
    const isFormComplete = hasCircleDetails && hasSelectedLocation;
    const completedStepCount = Number(hasCircleDetails) + Number(hasSelectedLocation);

    function updateField(field: keyof CircleFormData, value: string): void {
        setData(field, value);
    }

    function updatePoint(point: MapPoint): void {
        setData((currentData) => ({
            ...currentData,
            latitude: point.latitude,
            longitude: point.longitude,
        }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        post(route('citizen.circles.store'));
    }

    return (
        <section aria-labelledby="create-circle-title" className="pt-4 sm:pt-6">
            <header className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 sm:items-center sm:gap-4 sm:p-5">
                <Link
                    href={route('citizen.home')}
                    aria-label="Back to safety circles"
                    className="grid size-11 shrink-0 place-items-center rounded-xl border border-sky-100 bg-white text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                    <ArrowLeft className="size-5" aria-hidden="true" />
                </Link>
                <div>
                    <p className="text-xs font-extrabold tracking-[0.16em] text-sky-600 uppercase">Safety circles</p>
                    <h1 id="create-circle-title" className="mt-1 text-2xl font-black tracking-tight text-black sm:text-3xl">
                        Create a new circle
                    </h1>
                    <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                        Group the people you want to check on and mark the area where they are usually located.
                    </p>
                </div>
            </header>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-200">
                <SetupStep number={1} label="Circle details" isComplete={hasCircleDetails} />
                <SetupStep number={2} label="Pin location" isComplete={hasSelectedLocation} />
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                            <UsersRound className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-extrabold text-black">Circle details</h2>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-slate-500 uppercase">
                                    Step 1
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">Name the group and explain who it is for.</p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-5">
                        <label className="grid gap-2 text-sm font-bold text-black">
                            <span className="flex items-center justify-between gap-3">
                                Circle name
                                <span className="text-[10px] font-extrabold text-sky-600 uppercase">Required</span>
                            </span>
                            <input
                                type="text"
                                required
                                maxLength={50}
                                value={data.name}
                                onChange={(event) => updateField('name', event.target.value)}
                                placeholder="e.g. My Family"
                                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-black transition outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                            />
                            {errors.name && <span className="text-xs font-semibold text-red-600">{errors.name}</span>}
                            <span className="text-[11px] leading-4 font-medium text-slate-400">Use a name members will recognize immediately.</span>
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-black">
                            <span className="flex items-center justify-between gap-3">
                                Location name
                                <span className="text-[10px] font-extrabold text-sky-600 uppercase">Required</span>
                            </span>
                            <div className="relative">
                                <MapPin
                                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={data.location}
                                    onChange={(event) => updateField('location', event.target.value)}
                                    placeholder="City, barangay, or meeting place"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-11 text-sm font-medium text-black transition outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                            {errors.location && <span className="text-xs font-semibold text-red-600">{errors.location}</span>}
                            <span className="text-[11px] leading-4 font-medium text-slate-400">This label appears on the circle card.</span>
                        </label>

                        <label className="grid gap-2 text-sm font-bold text-black">
                            <span className="flex items-center justify-between gap-3">
                                Short description
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Optional</span>
                            </span>
                            <textarea
                                rows={4}
                                maxLength={180}
                                value={data.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                placeholder="Who belongs in this circle?"
                                className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 font-medium text-black transition outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                            />
                            {errors.description && <span className="text-xs font-semibold text-red-600">{errors.description}</span>}
                            <span className="text-right text-[11px] font-semibold text-slate-400">{data.description.length}/180</span>
                        </label>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-600">
                            <LocateFixed className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-extrabold text-black">Pin circle location</h2>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-slate-500 uppercase">
                                    Step 2
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">Tap the map to select a reference point.</p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <CircleLocationMap selectedPoint={selectedPoint} onPointChange={updatePoint} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <CoordinateValue label="Latitude" value={selectedPoint?.latitude} />
                        <CoordinateValue label="Longitude" value={selectedPoint?.longitude} />
                    </div>
                    {(errors.latitude || errors.longitude) && (
                        <p className="mt-3 text-xs font-semibold text-red-600">{errors.latitude ?? errors.longitude}</p>
                    )}
                </div>

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.04)] md:col-span-2 md:grid-cols-[1fr_auto] md:items-center">
                    <div aria-live="polite">
                        <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-50 text-xs font-black text-sky-700">
                                {completedStepCount}/2
                            </span>
                            <div>
                                <p className="text-xs font-extrabold text-black">Complete both setup steps</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                    {isFormComplete ? 'Everything is ready to save.' : 'Required details and a map pin are needed.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:flex md:justify-end">
                        <Link
                            href={route('citizen.home')}
                            className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={!isFormComplete || processing}
                            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(14,165,233,0.24)] transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                        >
                            {processing ? (
                                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <ShieldCheck className="size-4" aria-hidden="true" />
                            )}
                            {processing ? 'Creating...' : 'Create Circle'}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}

type SetupStepProps = {
    number: number;
    label: string;
    isComplete: boolean;
};

function SetupStep({ number, label, isComplete }: SetupStepProps): JSX.Element {
    return (
        <div className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 transition ${isComplete ? 'bg-white shadow-sm' : ''}`}>
            <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                    isComplete ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}
            >
                {isComplete ? <CheckCircle2 className="size-4" aria-hidden="true" /> : number}
            </span>
            <span className={`truncate text-[11px] font-extrabold sm:text-xs ${isComplete ? 'text-black' : 'text-slate-500'}`}>{label}</span>
        </div>
    );
}

type CoordinateValueProps = {
    label: string;
    value: number | undefined;
};

function CoordinateValue({ label, value }: CoordinateValueProps): JSX.Element {
    return (
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-extrabold tracking-wide text-slate-400 uppercase">{label}</p>
            <p className="mt-1 truncate font-mono text-xs font-bold text-slate-700">{value === undefined ? 'Not selected' : value.toFixed(6)}</p>
        </div>
    );
}
