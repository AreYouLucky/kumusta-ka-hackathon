import type { JSX, ReactNode } from 'react';

type MobileLayoutProps = {
    children: ReactNode;
    bottomNavigation: ReactNode;
};

export function MobileLayout({ children, bottomNavigation }: MobileLayoutProps): JSX.Element {
    return (
        <div className="min-h-dvh bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100">
            <main
                id="home"
                className="relative mx-auto min-h-dvh w-full max-w-[430px] scroll-smooth bg-gradient-to-b from-sky-100 via-sky-50 to-blue-50 px-5 pt-6 pb-[calc(7.5rem+env(safe-area-inset-bottom))] text-black shadow-[0_0_40px_rgba(14,116,144,0.12)] sm:max-w-3xl sm:px-8 sm:pt-8 md:px-10 md:pt-10"
            >
                {children}
                {bottomNavigation}
            </main>
        </div>
    );
}
