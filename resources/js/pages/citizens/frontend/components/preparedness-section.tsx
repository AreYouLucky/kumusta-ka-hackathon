import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Flame, MapPin, Phone, ShieldCheck, Waves, Zap } from 'lucide-react';
import { useState, type JSX } from 'react';

import type { AuthorityContact, HazardType, PreparednessGuide } from '../types';

type PreparednessSectionProps = {
    guides: PreparednessGuide[];
    contacts: AuthorityContact[];
};

type HazardStyle = {
    icon: LucideIcon;
    iconClass: string;
    backgroundClass: string;
    progressClass: string;
};

const hazardStyles: Record<HazardType, HazardStyle> = {
    earthquake: {
        icon: Zap,
        iconClass: 'text-orange-700',
        backgroundClass: 'bg-orange-100',
        progressClass: 'bg-orange-500',
    },
    flood: {
        icon: Waves,
        iconClass: 'text-sky-700',
        backgroundClass: 'bg-sky-100',
        progressClass: 'bg-sky-500',
    },
    fire: {
        icon: Flame,
        iconClass: 'text-red-600',
        backgroundClass: 'bg-red-100',
        progressClass: 'bg-red-500',
    },
};

type CompletedChecklist = Record<HazardType, string[]>;

const initialCompletedChecklist: CompletedChecklist = {
    earthquake: [],
    flood: [],
    fire: [],
};

function calculatePercentage(completedCount: number, totalCount: number): number {
    return totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
}

export function PreparednessSection({ guides, contacts }: PreparednessSectionProps): JSX.Element {
    const [completedChecklist, setCompletedChecklist] = useState<CompletedChecklist>(initialCompletedChecklist);
    const completedTaskCount = Object.values(completedChecklist).reduce((total, items) => total + items.length, 0);
    const totalTaskCount = guides.reduce((total, guide) => total + guide.before.length + guide.supplies.length, 0);
    const overallPercentage = calculatePercentage(completedTaskCount, totalTaskCount);

    function toggleChecklistItem(hazard: HazardType, item: string): void {
        setCompletedChecklist((currentChecklist) => {
            const completedItems = currentChecklist[hazard];
            const nextCompletedItems = completedItems.includes(item)
                ? completedItems.filter((completedItem) => completedItem !== item)
                : [...completedItems, item];

            return {
                ...currentChecklist,
                [hazard]: nextCompletedItems,
            };
        });
    }

    return (
        <section id="preparedness" aria-labelledby="preparedness-title" className="scroll-mt-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
                    <ShieldCheck className="size-6" aria-hidden="true" />
                </div>
                <div>
                    <h2 id="preparedness-title" className="text-xl font-extrabold tracking-tight text-black">
                        Preparedness Guide
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">Simple actions before and during an emergency.</p>
                </div>
            </div>

            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 sm:p-5">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-extrabold tracking-wider text-sky-700 uppercase">Overall readiness</p>
                        <p className="mt-1 text-sm text-slate-600">
                            {completedTaskCount} of {totalTaskCount} preparedness tasks complete
                        </p>
                    </div>
                    <p className="text-3xl font-extrabold tracking-tight text-sky-700">{overallPercentage}%</p>
                </div>
                <div
                    role="progressbar"
                    aria-label="Overall preparedness progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={overallPercentage}
                    className="mt-4 h-2.5 overflow-hidden rounded-full bg-white"
                >
                    <div className="h-full rounded-full bg-sky-500 transition-[width] duration-300" style={{ width: `${overallPercentage}%` }} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                {guides.map((guide) => {
                    const style = hazardStyles[guide.id];
                    const HazardIcon = style.icon;
                    const completedItems = completedChecklist[guide.id];
                    const checklistItems = [...guide.before, ...guide.supplies];
                    const percentage = calculatePercentage(completedItems.length, checklistItems.length);

                    return (
                        <details
                            key={guide.id}
                            className="group rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.04)]"
                        >
                            <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:hidden sm:p-5">
                                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${style.backgroundClass} ${style.iconClass}`}>
                                    <HazardIcon className="size-5" aria-hidden="true" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-extrabold text-black sm:text-base">{guide.title}</span>
                                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{guide.description}</span>
                                </span>
                                <span className="shrink-0 text-right">
                                    <span className={`block text-sm font-extrabold ${style.iconClass}`}>{percentage}%</span>
                                    <span className="block text-[10px] font-semibold text-slate-400">prepared</span>
                                </span>
                                <ChevronDown
                                    className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                                    aria-hidden="true"
                                />
                            </summary>

                            <div className="grid gap-4 border-t border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
                                <div className="rounded-xl bg-slate-50 p-3.5 sm:col-span-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <h4 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase">{guide.title} readiness</h4>
                                        <span className="text-[11px] font-bold text-slate-500">
                                            {completedItems.length}/{checklistItems.length} tasks
                                        </span>
                                    </div>
                                    <div
                                        role="progressbar"
                                        aria-label={`${guide.id} preparedness progress`}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={percentage}
                                        className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"
                                    >
                                        <div
                                            className={`h-full rounded-full transition-[width] duration-300 ${style.progressClass}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>

                                <PreparednessChecklist
                                    title="Before checklist"
                                    hazard={guide.id}
                                    items={guide.before}
                                    completedItems={completedItems}
                                    onToggle={toggleChecklistItem}
                                />
                                <PreparednessChecklist
                                    title="What to prepare"
                                    hazard={guide.id}
                                    items={guide.supplies}
                                    completedItems={completedItems}
                                    onToggle={toggleChecklistItem}
                                />
                                <div className="sm:col-span-2">
                                    <PreparednessList title="During" items={guide.during} />
                                </div>
                            </div>
                        </details>
                    );
                })}
            </div>

            <div className="mt-8">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-extrabold text-black">Nearest authorities</h3>
                        <p className="mt-0.5 text-xs text-slate-500">Sample contact information for this UI prototype.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-500">SAMPLE</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {contacts.map((contact) => (
                        <article
                            key={contact.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
                        >
                            <div className="flex items-start gap-3">
                                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">
                                    <Phone className="size-5" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-extrabold text-black">{contact.name}</h4>
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{contact.service}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-sm font-extrabold text-sky-700">{contact.phone}</p>
                                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                        <MapPin className="size-3.5" aria-hidden="true" />
                                        {contact.distance}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label={`Call ${contact.name}`}
                                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-500 text-white transition-colors hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                                >
                                    <Phone className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

type PreparednessListProps = {
    title: string;
    items: string[];
};

function PreparednessList({ title, items }: PreparednessListProps): JSX.Element {
    return (
        <div className="rounded-xl bg-slate-50 p-3.5">
            <h4 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase">{title}</h4>
            <ul className="mt-3 flex flex-col gap-2.5">
                {items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-slate-600">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

type PreparednessChecklistProps = {
    title: string;
    hazard: HazardType;
    items: string[];
    completedItems: string[];
    onToggle: (hazard: HazardType, item: string) => void;
};

function PreparednessChecklist({ title, hazard, items, completedItems, onToggle }: PreparednessChecklistProps): JSX.Element {
    const completedItemCount = items.filter((item) => completedItems.includes(item)).length;

    return (
        <div className="rounded-xl bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-extrabold tracking-wider text-slate-700 uppercase">{title}</h4>
                <span className="text-[11px] font-bold text-slate-500">
                    {completedItemCount}/{items.length}
                </span>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
                {items.map((item) => {
                    const isCompleted = completedItems.includes(item);

                    return (
                        <label key={item} className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed">
                            <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => onToggle(hazard, item)}
                                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-slate-300 accent-sky-500"
                            />
                            <span className={isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'}>{item}</span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
