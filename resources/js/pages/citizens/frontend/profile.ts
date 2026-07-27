import type { User } from '@/types';

import type { CitizenProfile } from './types';

function requiredProfileValue(value: string | null | undefined, fallback: string): string {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : fallback;
}

export function createCitizenProfile(user: User): CitizenProfile {
    return {
        id: user.id,
        username: requiredProfileValue(user.username, String(user.id)),
        email: user.email,
        first_name: requiredProfileValue(user.fname, user.username ?? 'Citizen'),
        middle_name: user.mname?.trim() || null,
        last_name: requiredProfileValue(user.lname, ''),
        suffix: user.suffix?.trim() || null,
        sex: typeof user.sex === 'string' ? user.sex : null,
        role: user.role?.trim() || null,
    };
}
