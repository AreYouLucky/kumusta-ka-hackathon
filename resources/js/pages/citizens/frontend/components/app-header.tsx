import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Bell } from 'lucide-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';

import type { CitizenDisasterAlert, MemberCheckInStatus } from '../types';
import { EmergencyCheckInDialog } from './emergency-check-in-dialog';
import type { AssistanceSubmission } from './help-assistance-flow';

export function AppHeader(): JSX.Element {
    const { auth, activeDisaster } = usePage<SharedData>().props;
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [disaster, setDisaster] = useState<CitizenDisasterAlert | null>(activeDisaster ?? null);

    useEffect(() => {
        if (!activeDisaster) {
            return;
        }

        setDisaster(activeDisaster);

        try {
            if (window.sessionStorage.getItem(`kumusta-ka.disaster-seen.${activeDisaster.id}`) !== 'true') {
                setIsNotificationOpen(true);
            }
        } catch {
            setIsNotificationOpen(true);
        }
    }, [activeDisaster]);

    useEcho<CitizenDisasterAlert>(`App.Models.User.${auth.user.id}`, 'DisasterAlertTriggered', (triggeredDisaster) => {
        setDisaster(triggeredDisaster);
        setIsNotificationOpen(true);
        router.reload();
    });

    function closeNotification(): void {
        if (disaster) {
            try {
                window.sessionStorage.setItem(`kumusta-ka.disaster-seen.${disaster.id}`, 'true');
            } catch {
                // The dialog can still close when browser storage is unavailable.
            }
        }

        setIsNotificationOpen(false);
    }

    function updateCurrentStatus(status: MemberCheckInStatus, assistance?: AssistanceSubmission): void {
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
                    <img src="/storage/images/kumusta.png" alt="Kumusta Ka logo" className="size-10 object-contain sm:size-14" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-xl font-black tracking-tight text-white sm:text-2xl">Kumusta Ka</p>
                    <p className="text-xs font-semibold text-sky-50 sm:text-sm">Dahil ikaw ay mahalaga</p>
                </div>

                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => disaster && setIsNotificationOpen(true)}
                        disabled={!disaster}
                        aria-label={disaster ? 'View emergency notification' : 'No emergency notifications'}
                        aria-haspopup="dialog"
                        className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/15 text-white shadow-[0_7px_18px_rgba(15,23,42,0.14)] backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default disabled:opacity-60 sm:size-12"
                    >
                        <Bell className="size-5" aria-hidden="true" />
                    </button>
                    {disaster && (
                        <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-blue-600">
                            1
                        </span>
                    )}
                </div>
            </header>

            {isNotificationOpen && disaster && (
                <EmergencyCheckInDialog disaster={disaster} onClose={closeNotification} onStatusComplete={updateCurrentStatus} />
            )}
        </>
    );
}
