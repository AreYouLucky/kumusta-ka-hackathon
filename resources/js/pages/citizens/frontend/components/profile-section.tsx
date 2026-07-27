import { BadgeCheck, Hash, Mail, ShieldCheck, UserRound } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import type { CitizenProfile } from '../types';

type ProfileSectionProps = {
    profile: CitizenProfile;
};

type DetailItemProps = {
    icon: ReactNode;
    label: string;
    value: string;
};

function displayValue(value: string | null): string {
    return value || 'Not provided';
}

function formatFullName(profile: CitizenProfile): string {
    return [profile.first_name, profile.middle_name, profile.last_name, profile.suffix]
        .filter((namePart): namePart is string => Boolean(namePart))
        .join(' ');
}

function getInitials(profile: CitizenProfile): string {
    return [profile.first_name, profile.last_name]
        .filter(Boolean)
        .map((namePart) => namePart.charAt(0).toUpperCase())
        .join('');
}

export function ProfileSection({ profile }: ProfileSectionProps): JSX.Element {
    const fullName = formatFullName(profile);

    return (
        <section aria-labelledby="profile-title" className="pt-4 sm:pt-6">
            <div className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-5 shadow-[0_8px_24px_rgba(14,165,233,0.08)] sm:p-7">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="relative grid size-24 shrink-0 place-items-center rounded-3xl border-4 border-white bg-gradient-to-br from-sky-500 to-blue-600 text-2xl font-black text-white shadow-lg sm:size-28">
                        {getInitials(profile) || 'KA'}
                        <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-green-500 text-white ring-4 ring-white">
                            <BadgeCheck className="size-4" aria-hidden="true" />
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 id="profile-title" className="mt-2 text-xl font-extrabold tracking-tight text-black sm:text-2xl">
                            {fullName}
                        </h1>
                        <p className="mt-1 text-sm break-all text-slate-500">{profile.email}</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 font-mono text-[11px] font-bold text-slate-500 shadow-sm">
                            <Hash className="size-3.5" aria-hidden="true" />@{profile.username}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DetailItem icon={<Mail className="size-5" />} label="Email address" value={profile.email} />
                <DetailItem icon={<ShieldCheck className="size-5" />} label="Account role" value={displayValue(profile.role)} />
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-extrabold tracking-tight text-black">Personal information</h2>
                <div className="mt-4 grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-3">
                    <ProfileValue icon={<UserRound className="size-4" />} label="First name" value={profile.first_name} />
                    <ProfileValue icon={<UserRound className="size-4" />} label="Middle name" value={displayValue(profile.middle_name)} />
                    <ProfileValue icon={<UserRound className="size-4" />} label="Last name" value={profile.last_name} />
                    <ProfileValue icon={<UserRound className="size-4" />} label="Suffix" value={displayValue(profile.suffix)} />
                    <ProfileValue icon={<UserRound className="size-4" />} label="Sex" value={displayValue(profile.sex)} capitalize />
                    <ProfileValue icon={<Hash className="size-4" />} label="User ID" value={String(profile.id)} />
                </div>
            </div>
        </section>
    );
}

function DetailItem({ icon, label, value }: DetailItemProps): JSX.Element {
    return (
        <article className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700">{icon}</div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">{label}</p>
                <p className="mt-0.5 truncate text-sm font-bold text-black">{value}</p>
            </div>
        </article>
    );
}

type ProfileValueProps = {
    icon: ReactNode;
    label: string;
    value: string;
    capitalize?: boolean;
};

function ProfileValue({ icon, label, value, capitalize = false }: ProfileValueProps): JSX.Element {
    return (
        <div className="border-b border-slate-200 p-4 last:border-b-0 sm:border-r sm:[&:nth-child(3n)]:border-r-0">
            <div className="flex items-center gap-1.5 text-slate-400">
                {icon}
                <p className="text-[10px] font-bold tracking-wide uppercase">{label}</p>
            </div>
            <p className={`mt-2 text-sm font-bold text-black ${capitalize ? 'capitalize' : ''}`}>{value}</p>
        </div>
    );
}
