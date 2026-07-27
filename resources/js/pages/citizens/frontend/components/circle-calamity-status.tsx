import { CheckCircle2, Clock3, MapPin, TriangleAlert } from 'lucide-react';
import type { JSX } from 'react';

import type { CircleCalamityStatus as CircleCalamityStatusData } from '../types';

type CircleCalamityStatusProps = {
    status: CircleCalamityStatusData;
    compact?: boolean;
};

export function CircleCalamityStatus({ status, compact = false }: CircleCalamityStatusProps): JSX.Element {
    if (!status.isAffected) {
        return (
            <div className={`${compact ? 'mt-4 p-3' : 'mt-5 p-4 sm:p-5'} rounded-2xl border border-emerald-200 bg-emerald-50`}>
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white">
                        <CheckCircle2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-emerald-700">
                            {status.label}
                        </span>
                        <p className="mt-1.5 text-sm font-extrabold text-emerald-950">{status.title}</p>
                        {!compact && <p className="mt-1 text-xs leading-5 text-emerald-800">{status.description}</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <article className={`${compact ? 'mt-4 p-3.5' : 'mt-5 p-4 sm:p-5'} rounded-2xl border border-red-200 bg-red-50`}>
            <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-500 text-white">
                    <TriangleAlert className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-black tracking-wider text-red-700">
                        {status.label}
                    </span>
                    <h2 className="mt-1.5 text-base font-black text-black">{status.title}</h2>
                </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-700 sm:text-sm">{status.description}</p>

            <div className="mt-3 grid gap-2 text-xs font-semibold text-red-800 sm:grid-cols-2">
                <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{status.location}</span>
                </span>
                <span className="flex items-center gap-1.5 sm:justify-end">
                    <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                    {status.reportedAt}
                </span>
            </div>
        </article>
    );
}
