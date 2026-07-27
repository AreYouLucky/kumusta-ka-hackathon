import type { JSX } from 'react';

import type { StatusSummaryItem, StatusTone } from '../types';

type StatusSummaryProps = {
    items: StatusSummaryItem[];
};

const toneClasses: Record<StatusTone, string> = {
    safe: 'text-green-700',
    warning: 'text-orange-700',
    danger: 'text-red-600',
};

export function StatusSummary({ items }: StatusSummaryProps): JSX.Element {
    return (
        <section aria-labelledby="status-summary-title" className="mt-8 sm:mt-10">
            <h2 id="status-summary-title" className="mb-4 text-lg font-extrabold tracking-tight text-black">
                Quick Status
            </h2>

            <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.04)] sm:grid-cols-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex min-w-0 flex-row items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 last:border-b-0 sm:flex-col sm:justify-center sm:gap-1 sm:border-r sm:border-b-0 sm:px-2 sm:py-5 sm:last:border-r-0"
                    >
                        <span className={`text-xl font-extrabold sm:text-2xl ${toneClasses[item.tone]}`}>{item.value}</span>
                        <span className="text-right text-xs leading-tight font-semibold text-slate-500 sm:text-center">{item.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
