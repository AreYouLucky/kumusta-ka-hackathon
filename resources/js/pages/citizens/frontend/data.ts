import type { AuthorityContact, PreparednessGuide, WeatherAdvisory } from './types';

export const preparednessGuides: PreparednessGuide[] = [
    {
        id: 'earthquake',
        title: 'Earthquake',
        description: 'Know safe spots and practice how to protect yourself when shaking starts.',
        before: [
            'Secure shelves, appliances, and heavy objects that may fall.',
            'Prepare a go bag with water, medicine, a flashlight, and a whistle.',
            'Agree on a family meeting place and emergency contact.',
        ],
        supplies: [
            'Go bag with water, ready-to-eat food, and medicines.',
            'Flashlight, whistle, power bank, and battery-powered radio.',
            'First-aid kit, sturdy shoes, helmet, and copies of documents.',
        ],
        during: [
            'Drop, cover, and hold on until the shaking stops.',
            'Stay away from windows, cabinets, and hanging objects.',
            'If outdoors, move to an open area away from buildings and power lines.',
        ],
    },
    {
        id: 'flood',
        title: 'Flood',
        description: 'Prepare for rising water and know the safest route to higher ground.',
        before: [
            'Monitor local advisories and identify your nearest evacuation center.',
            'Move documents, medicine, and electrical items to a higher place.',
            'Charge phones and prepare clean water, food, and emergency supplies.',
        ],
        supplies: [
            'Waterproof go bag and sealed copies of important documents.',
            'Drinking water, ready-to-eat food, medicines, and hygiene supplies.',
            'Raincoat, boots, flashlight, radio, and fully charged power bank.',
        ],
        during: [
            'Move to higher ground as soon as authorities advise evacuation.',
            'Never walk or drive through moving floodwater.',
            'Switch off electricity only when it is safe and your hands are dry.',
        ],
    },
    {
        id: 'fire',
        title: 'Fire',
        description: 'Plan a fast exit and make sure everyone knows where to meet outside.',
        before: [
            'Check electrical cords, outlets, LPG connections, and smoke alarms.',
            'Keep exits clear and place extinguishers where adults can reach them.',
            'Practice two exit routes and set a family meeting point outdoors.',
        ],
        supplies: [
            'Working fire extinguisher, smoke alarm, and fire blanket.',
            'Emergency flashlight, whistle, first-aid kit, and go bag.',
            'Copies of important documents and emergency contact numbers.',
        ],
        during: [
            'Alert everyone, leave immediately, and call emergency services outside.',
            'Stay low under smoke and use the nearest safe exit.',
            'Do not return inside for belongings once you have evacuated.',
        ],
    },
];

export const authorityContacts: AuthorityContact[] = [
    {
        id: 1,
        name: 'Taguig City DRRMO',
        service: 'Disaster response and rescue',
        phone: '09XX XXX XXXX',
        distance: '1.8 km away',
    },
    {
        id: 2,
        name: 'BFP Taguig',
        service: 'Fire and rescue assistance',
        phone: '(02) 8XXX XXXX',
        distance: '2.4 km away',
    },
    {
        id: 3,
        name: 'National Emergency Hotline',
        service: 'Nationwide emergency coordination',
        phone: '911',
        distance: 'Nationwide',
    },
];

export const sampleTyphoonAdvisory: WeatherAdvisory = {
    status: 'WARNING ADVISORY',
    title: 'Typhoon may hit Taguig',
    description: 'A typhoon track shows possible effects across southern Luzon and Metro Manila. Prepare for strong winds and heavy rainfall.',
    updatedAt: 'Updated 10 minutes ago',
    impactAreas: ['Taguig City', 'Metro Manila', 'Southern Luzon'],
    mapImage: '/storage/images/typhoon-taguig-sample-map.png',
    mapAlt: 'Philippines map showing a typhoon path approaching Luzon and Metro Manila',
};
