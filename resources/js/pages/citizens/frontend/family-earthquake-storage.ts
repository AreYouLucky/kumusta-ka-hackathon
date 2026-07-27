import { useSyncExternalStore } from 'react';

const familyEarthquakeStorageKey = 'kumusta-ka.family-earthquake-active';
const familyEarthquakeChangedEvent = 'kumusta-ka:family-earthquake-changed';

export function readFamilyEarthquakeStatus(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.localStorage.getItem(familyEarthquakeStorageKey) === 'true';
    } catch {
        return false;
    }
}

export function writeFamilyEarthquakeStatus(isActive: boolean): void {
    try {
        window.localStorage.setItem(familyEarthquakeStorageKey, String(isActive));
        window.dispatchEvent(new Event(familyEarthquakeChangedEvent));
    } catch {
        return;
    }
}

function subscribeToFamilyEarthquakeStatus(onStatusChange: () => void): () => void {
    function handleStorageChange(event: StorageEvent): void {
        if (event.key === familyEarthquakeStorageKey) {
            onStatusChange();
        }
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(familyEarthquakeChangedEvent, onStatusChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener(familyEarthquakeChangedEvent, onStatusChange);
    };
}

export function useFamilyEarthquakeStatus(): boolean {
    return useSyncExternalStore(subscribeToFamilyEarthquakeStatus, readFamilyEarthquakeStatus, () => false);
}
