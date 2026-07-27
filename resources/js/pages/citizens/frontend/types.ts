export interface DisasterAlert {
    label: string;
    title: string;
    description: string;
    location: string;
    reportedAt: string;
}

export interface SafetyCircle {
    id: number;
    name: string;
    memberCount: number;
    location: string;
    safeCount: number;
    notRespondingCount: number;
    urgentAssistanceCount: number;
    avatarLabels: string[];
    alert?: DisasterAlert;
}

export type MemberSafetyStatus = 'safe' | 'help' | 'rescue';

export type MemberResponseStatus = 'forwarded_to_lgu' | 'responders_dispatched';

export type SafetyCircleMember = {
    id: number;
    name: string;
    initials: string;
    relationship: string;
    status: MemberSafetyStatus;
    responseStatus?: MemberResponseStatus;
    updatedAt: string;
    isCurrentUser?: boolean;
};

export type SafetyCircleDetails = {
    id: number;
    name: string;
    description: string;
    location: string;
    members: SafetyCircleMember[];
    alert?: DisasterAlert;
};

export type StatusTone = 'safe' | 'warning' | 'danger';

export interface StatusSummaryItem {
    label: string;
    value: number;
    tone: StatusTone;
}

export type HazardType = 'earthquake' | 'flood' | 'fire';

export interface PreparednessGuide {
    id: HazardType;
    title: string;
    description: string;
    before: string[];
    supplies: string[];
    during: string[];
}

export interface AuthorityContact {
    id: number;
    name: string;
    service: string;
    phone: string;
    distance: string;
}

export interface WeatherAdvisory {
    status: string;
    title: string;
    description: string;
    updatedAt: string;
    impactAreas: string[];
    mapImage: string;
    mapAlt: string;
}

export type CitizenProfile = {
    id: number;
    username: string;
    email: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    sex: string | null;
    role: string | null;
};
