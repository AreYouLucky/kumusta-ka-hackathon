import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Home, Megaphone, QrCode, ShieldCheck, UserRound } from 'lucide-react';
import type { JSX } from 'react';
import { useState } from 'react';

import { createCitizenProfile } from '../profile';
import { PersonalQrDialog } from './personal-qr-dialog';

type NavigationItem = 'home' | 'preparedness' | 'advisory' | 'profile';

type MobileBottomNavigationProps = {
    activeItem: NavigationItem;
};

const navigationItemClass =
    'relative flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors hover:text-sky-600 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500';

function getNavigationClass(item: NavigationItem, activeItem: NavigationItem): string {
    return `${navigationItemClass} ${item === activeItem ? 'text-blue-600 after:absolute after:bottom-0 after:h-1 after:w-7 after:rounded-t-full after:bg-gradient-to-r after:from-sky-500 after:to-blue-600' : 'text-slate-400'}`;
}

export function MobileBottomNavigation({ activeItem }: MobileBottomNavigationProps): JSX.Element {
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const { auth } = usePage<SharedData>().props;
    const profile = createCitizenProfile(auth.user);

    return (
        <>
            <nav
                aria-label="Primary navigation"
                className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-sky-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_rgba(14,116,144,0.12)] backdrop-blur-xl sm:max-w-3xl"
            >
                <div className="grid h-[72px] grid-cols-5">
                    <Link href="/frontend" prefetch className={getNavigationClass('home', activeItem)}>
                        <Home className="size-5 sm:size-6" aria-hidden="true" />
                        <span className="text-[9px] font-bold sm:text-[11px]">Home</span>
                    </Link>

                    <Link href="/frontend/preparedness" prefetch className={getNavigationClass('preparedness', activeItem)}>
                        <ShieldCheck className="size-5 sm:size-6" aria-hidden="true" />
                        <span className="max-w-full truncate text-[9px] font-bold sm:text-[11px]">Preparedness</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setIsQrDialogOpen(true)}
                        aria-label="Show my QR code"
                        className="flex min-w-0 flex-col items-center justify-end gap-1 pb-2 text-slate-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500"
                    >
                        <span className="grid size-12 -translate-y-2 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.34)]">
                            <QrCode className="size-6" aria-hidden="true" />
                        </span>
                        <span className="-mt-2 text-[9px] font-bold sm:text-[11px]">QR Code</span>
                    </button>

                    <Link href="/frontend/advisory" prefetch className={getNavigationClass('advisory', activeItem)}>
                        <span className="relative">
                            <Megaphone className="size-5 sm:size-6" aria-hidden="true" />
                            <span className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-extrabold text-white ring-2 ring-white">
                                1
                            </span>
                        </span>
                        <span className="text-[9px] font-bold sm:text-[11px]">Advisory</span>
                    </Link>

                    <Link href="/frontend/profile" prefetch className={getNavigationClass('profile', activeItem)}>
                        <UserRound className="size-5 sm:size-6" aria-hidden="true" />
                        <span className="text-[9px] font-bold sm:text-[11px]">Profile</span>
                    </Link>
                </div>
            </nav>

            <PersonalQrDialog isOpen={isQrDialogOpen} profile={profile} onClose={() => setIsQrDialogOpen(false)} />
        </>
    );
}
