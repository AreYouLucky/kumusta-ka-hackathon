import { type User } from '@/types';

export function getUserDisplayName(user?: User | null): string {
    if (!user) {
        return 'Command User';
    }

    const fullName = [user.fname, user.mname, user.lname, user.suffix].filter(Boolean).join(' ').trim();

    return fullName || user.name || user.username || user.email || 'Command User';
}
