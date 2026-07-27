import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { JSX } from 'react';

import type { SafetyCircle } from '../types';
import { SafetyCircleCard } from './safety-circle-card';

type SafetyCircleListProps = {
    circles: SafetyCircle[];
};

export function SafetyCircleList({ circles }: SafetyCircleListProps): JSX.Element {
    return (
        <section aria-label="Your safety circles" className="mt-4 sm:mt-4">
            <Link
                href={route('citizen.circles.create')}
                prefetch
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)] transition hover:from-sky-600 hover:to-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 sm:ml-auto sm:w-auto sm:min-w-56 sm:px-6"
            >
                <Plus className="size-5" aria-hidden="true" />
                Create New Circle
            </Link>

            <div className="mt-5 grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5">
                {circles.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-sky-200 bg-white/80 px-5 py-10 text-center md:col-span-2">
                        <p className="text-sm font-extrabold text-slate-800">No safety circles yet</p>
                        <p className="mt-1 text-xs text-slate-500">Create your first circle to start checking in with people who matter.</p>
                    </div>
                )}
                {circles.map((circle) => {
                    return (
                        <div key={circle.id} className="min-w-0">
                            <SafetyCircleCard circle={circle} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
