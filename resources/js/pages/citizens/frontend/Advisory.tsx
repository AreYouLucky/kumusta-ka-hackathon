import { Head } from '@inertiajs/react';
import type { JSX } from 'react';

import { AdvisorySection } from './components/advisory-section';
import { AppHeader } from './components/app-header';
import { MobileBottomNavigation } from './components/mobile-bottom-navigation';
import { MobileLayout } from './components/mobile-layout';
import { sampleTyphoonAdvisory } from './data';

export default function Advisory(): JSX.Element {
    return (
        <>
            <Head title="Advisory | Kumusta Ka" />

            <MobileLayout bottomNavigation={<MobileBottomNavigation activeItem="advisory" />}>
                <AppHeader />
                <AdvisorySection advisory={sampleTyphoonAdvisory} />
            </MobileLayout>
        </>
    );
}
