import { Link } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, ChevronRight, Clock3, MapPin, Siren, UsersRound } from 'lucide-react';
import type { JSX } from 'react';

import type { SafetyCircle } from '../types';
import { CircleCalamityStatus } from './circle-calamity-status';

type SafetyCircleCardProps = {
    circle: SafetyCircle;
};

const avatarColors = ['bg-sky-600', 'bg-violet-600', 'bg-teal-700', 'bg-slate-600'];

export function SafetyCircleCard({ circle }: SafetyCircleCardProps): JSX.Element {
    const hasHelpRequest = circle.helpCount > 0;
    const hasUrgentAssistance = circle.urgentAssistanceCount > 0;

    return (
        <Link
            href={route('citizen.circles.show', circle.id)}
            prefetch
            aria-label={`View ${circle.name} members`}
            className="block rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
            <article className="relative w-full min-w-0 overflow-hidden rounded-[18px] border border-sky-100 bg-white/95 p-[18px] shadow-[0_8px_24px_rgba(14,116,144,0.10)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_14px_30px_rgba(14,116,144,0.15)] sm:p-5">
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-600" />
                <div className="flex items-start gap-3.5">
                    <div className="grid size-[42px] shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_6px_14px_rgba(37,99,235,0.22)]">
                        <UsersRound className="size-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-extrabold text-black">{circle.name}</h2>
                        <p className="text-xs text-slate-500">{circle.memberCount} members</p>
                    </div>

                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                        <ChevronRight className="size-5" aria-hidden="true" />
                    </span>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{circle.location}</span>
                </div>

                <CircleCalamityStatus status={circle.calamityStatus} compact />

                <div className="mt-3 flex flex-col gap-2">
                    <div className="flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        {circle.safeCount} Ligtas Ako
                    </div>

                    <div className="flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        <Clock3 className="size-4" aria-hidden="true" />
                        {circle.notRespondingCount} No response yet
                    </div>

                    {hasHelpRequest && (
                        <div className="flex w-fit items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
                            <AlertTriangle className="size-4" aria-hidden="true" />
                            {circle.helpCount} Kailangan Ko ng Tulong
                        </div>
                    )}

                    {hasUrgentAssistance && (
                        <div className="flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                            <Siren className="size-4" aria-hidden="true" />
                            {circle.urgentAssistanceCount} Kailangan Ko ng Agarang Saklolo
                        </div>
                    )}
                </div>

                <div className="mt-[18px] flex -space-x-2">
                    {circle.avatarLabels.map((label, index) => (
                        <div
                            key={`${circle.id}-${label}`}
                            className={`grid size-[30px] place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white ${avatarColors[index % avatarColors.length]}`}
                        >
                            {label}
                        </div>
                    ))}
                </div>
            </article>
        </Link>
    );
}
