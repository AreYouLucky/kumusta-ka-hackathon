import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';

const pusherAppKey = import.meta.env.VITE_PUSHER_APP_KEY?.trim();
const pusherAppCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER?.trim();

if (pusherAppKey && pusherAppCluster) {
    configureEcho({
        broadcaster: 'pusher',
        key: pusherAppKey,
        cluster: pusherAppCluster,
        forceTLS: true,
    });
} else {
    configureEcho({
        broadcaster: 'null',
    });
}
//import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
//initializeTheme();
