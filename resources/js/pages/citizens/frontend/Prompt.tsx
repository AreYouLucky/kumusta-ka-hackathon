import { Head } from '@inertiajs/react';
import type { JSX } from 'react';

import { AppHeader } from './components/app-header';
import { MobileBottomNavigation } from './components/mobile-bottom-navigation';
import { MobileLayout } from './components/mobile-layout';
import { SafetyCircleList } from './components/safety-circle-list';
import type { SafetyCircle } from './types';

type PromptProps = {
    circles: SafetyCircle[];
};

export default function Prompt({ circles }: PromptProps): JSX.Element {
    return (
        <>
            <Head title="Kumusta Ka" />

            <MobileLayout bottomNavigation={<MobileBottomNavigation activeItem="home" />}>
                <AppHeader />
                <SafetyCircleList circles={circles} />
                {/* <StatusSummary items={statusSummary} /> */}
            </MobileLayout>
        </>
    );
}
