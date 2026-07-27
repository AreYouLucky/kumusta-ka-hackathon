import { Head } from '@inertiajs/react';
import type { JSX } from 'react';

import { AppHeader } from './components/app-header';
import { CreateCircleForm } from './components/create-circle-form';
import { MobileBottomNavigation } from './components/mobile-bottom-navigation';
import { MobileLayout } from './components/mobile-layout';

export default function CreateCircle(): JSX.Element {
    return (
        <>
            <Head title="Create Circle | Kumusta Ka" />

            <MobileLayout bottomNavigation={<MobileBottomNavigation activeItem="home" />}>
                <AppHeader />
                <CreateCircleForm />
            </MobileLayout>
        </>
    );
}
