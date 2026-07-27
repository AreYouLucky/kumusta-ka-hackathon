import { Head } from '@inertiajs/react';
import type { JSX } from 'react';

import { AppHeader } from './components/app-header';
import { MobileBottomNavigation } from './components/mobile-bottom-navigation';
import { MobileLayout } from './components/mobile-layout';
import { PreparednessSection } from './components/preparedness-section';
import { authorityContacts, preparednessGuides } from './data';

export default function Preparedness(): JSX.Element {
    return (
        <>
            <Head title="Preparedness | Kumusta Ka" />

            <MobileLayout bottomNavigation={<MobileBottomNavigation activeItem="preparedness" />}>
                <AppHeader />
                <PreparednessSection guides={preparednessGuides} contacts={authorityContacts} />
            </MobileLayout>
        </>
    );
}
