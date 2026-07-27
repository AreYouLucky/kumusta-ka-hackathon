import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import type { JSX } from 'react';
import { useState } from 'react';

import type { MemberSafetyStatus } from '../types';
import { EmergencyCheckInDialog } from './emergency-check-in-dialog';
import type { AssistanceSubmission } from './help-assistance-flow';

export function AppHeader(): JSX.Element {
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    function updateCurrentStatus(status: MemberSafetyStatus, assistance?: AssistanceSubmission): void {
        router.patch(
            route('citizen.check-in'),
            {
                status,
                assistance_type: assistance?.assistanceType,
                situation: assistance?.situation,
                priority: assistance?.priority,
            },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <header className="-mx-5 -mt-6 flex items-center gap-3 rounded-b-[28px] border-b border-sky-400/30 bg-gradient-to-br from-sky-500 to-blue-600 px-5 pt-6 pb-6 text-white shadow-[0_14px_34px_rgba(2,132,199,0.24)] sm:-mx-8 sm:-mt-8 sm:gap-4 sm:px-8 sm:pt-8 sm:pb-7 md:-mx-10 md:-mt-10 md:px-10 md:pt-10">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.16)] sm:size-16">
                    <img src="/images/kumusta-app-logo.png" alt="Kumusta Ka logo" className="size-10 object-contain sm:size-14" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xl font-black tracking-tight text-white sm:text-2xl">Kumusta Ka</p>
                    <p className="text-xs font-semibold text-sky-50 sm:text-sm">Dahil ikaw ay mahalaga</p>
                </div>

                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsNotificationOpen(true)}
                        aria-label="View 1 emergency notification"
                        aria-haspopup="dialog"
                        className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/15 text-white shadow-[0_7px_18px_rgba(15,23,42,0.14)] backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:size-12"
                    >
                        <Bell className="size-5" aria-hidden="true" />
                    </button>
                    <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-blue-600">
                        1
                    </span>
                </div>
            </header>

            {isNotificationOpen && <EmergencyCheckInDialog onClose={() => setIsNotificationOpen(false)} onStatusComplete={updateCurrentStatus} />}
        </>
    );
}
