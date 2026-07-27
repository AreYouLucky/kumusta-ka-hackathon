import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import type { JSX } from 'react';

import { AppHeader } from './components/app-header';
import { MobileBottomNavigation } from './components/mobile-bottom-navigation';
import { MobileLayout } from './components/mobile-layout';
import { ProfileSection } from './components/profile-section';
import { createCitizenProfile } from './profile';

export default function Profile(): JSX.Element {
    const { auth } = usePage<SharedData>().props;
    const profile = createCitizenProfile(auth.user);

    return (
        <>
            <Head title="Profile | Kumusta Ka" />

            <MobileLayout bottomNavigation={<MobileBottomNavigation activeItem="profile" />}>
                <AppHeader />
                <ProfileSection profile={profile} />
            </MobileLayout>
        </>
    );
}
