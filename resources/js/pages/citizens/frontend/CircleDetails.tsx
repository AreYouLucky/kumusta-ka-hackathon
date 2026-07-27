import { Head } from '@inertiajs/react';
import type { JSX } from 'react';

import { AppHeader } from './components/app-header';
import { CircleDetailsSection } from './components/circle-details-section';
import { MobileBottomNavigation } from './components/mobile-bottom-navigation';
import { MobileLayout } from './components/mobile-layout';
import type { SafetyCircleDetails } from './types';

type CircleDetailsPageProps = {
    circle: SafetyCircleDetails;
};

export default function CircleDetails({ circle }: CircleDetailsPageProps): JSX.Element {
    return (
        <>
            <Head title={`${circle.name} | Kumusta Ka`} />

            <MobileLayout bottomNavigation={<MobileBottomNavigation activeItem="home" />}>
                <AppHeader />
                <CircleDetailsSection circle={circle} />
            </MobileLayout>
        </>
    );
}
