export type AssistanceFlowMode = 'help' | 'rescue';

export type ParsedAssistanceData = {
    assistanceType: string;
    situation: string;
    priority: string;
    address: string;
    coordinates: string;
};

export type AssistanceResponseSeed = {
    id: 'nasugatan' | 'pagkain' | 'damit' | 'baha' | 'natabunan';
    label: string;
    mode: AssistanceFlowMode;
    keywords: readonly string[];
    sampleInput: string;
    data: Omit<ParsedAssistanceData, 'address' | 'coordinates'>;
    agencyName: string;
    guidance: readonly string[];
};

const DEFAULT_LOCATION = {
    address: 'Pala-o, Iligan City, Lanao del Norte',
    coordinates: '8.2280° N, 124.2452° E',
} as const;

export const assistanceResponseSeeds: readonly AssistanceResponseSeed[] = [
    {
        id: 'nasugatan',
        label: 'Nasugatan',
        mode: 'rescue',
        keywords: ['nasugatan', 'sugat', 'sugatan', 'dumudugo', 'injured'],
        sampleInput: 'May nasugatan at dumudugo. Kailangan namin ng medic.',
        data: {
            assistanceType: 'Medical assistance / first aid response',
            situation: 'May taong nasugatan at nangangailangan ng agarang paunang lunas',
            priority: 'MATAAS — kailangang ma-assess agad ng medical responder',
        },
        agencyName: 'Iligan City CDRRMO / Emergency Medical Services',
        guidance: [
            'Ilayo ang nasugatan sa panganib kung ligtas itong gawin.',
            'Diinan ng malinis na tela ang sugat kung may pagdurugo.',
            'Huwag galawin ang taong may posibleng pinsala sa ulo, leeg, o likod.',
            'Tumawag agad sa 911 kung malakas ang pagdurugo o nawawalan ng malay.',
        ],
    },
    {
        id: 'pagkain',
        label: 'Pagkain',
        mode: 'help',
        keywords: ['pagkain', 'makakain', 'gutom', 'food'],
        sampleInput: 'Kailangan namin ng pagkain dahil wala na kaming makain.',
        data: {
            assistanceType: 'Food assistance / emergency food pack',
            situation: 'Wala nang makakain ang pamilya at kailangan ng agarang suplay ng pagkain',
            priority: 'Kailangan ng tulong — food assistance',
        },
        agencyName: 'Iligan City LGU / CDRRMO',
        guidance: [
            'Manatili muna sa ligtas at madaling maabot na lugar.',
            'Ihanda ang bilang ng mga taong nangangailangan ng pagkain.',
            'Hintayin ang tawag o responder mula sa LGU.',
            'Kung may agarang panganib, tumawag agad sa 911.',
        ],
    },
    {
        id: 'damit',
        label: 'Damit',
        mode: 'help',
        keywords: ['damit', 'kasuotan', 'kumot', 'clothes', 'clothing'],
        sampleInput: 'Kailangan namin ng damit at kumot para sa mga bata.',
        data: {
            assistanceType: 'Clothing, blankets, and relief supplies',
            situation: 'Kailangan ng pamilya ng malinis na damit at kumot matapos lumikas',
            priority: 'Kailangan ng tulong — clothing and relief assistance',
        },
        agencyName: 'Iligan City CSWDO / CDRRMO',
        guidance: [
            'Manatili sa evacuation area o ibang ligtas na lugar.',
            'Ihanda ang bilang at edad ng mga nangangailangan ng damit.',
            'Panatilihing tuyo at mainit ang mga bata at matatanda.',
            'Hintayin ang abiso ng LGU tungkol sa relief distribution.',
        ],
    },
    {
        id: 'baha',
        label: 'Baha',
        mode: 'rescue',
        keywords: ['baha', 'binaha', 'bumabaha', 'flood', 'tubig'],
        sampleInput: 'Mataas na ang baha at hindi na kami makalabas ng bahay.',
        data: {
            assistanceType: 'Flood rescue / emergency evacuation',
            situation: 'Mataas ang baha at may mga residenteng hindi makalikas nang ligtas',
            priority: 'KRITIKAL — agarang evacuation at flood rescue',
        },
        agencyName: 'Iligan City CDRRMO / Search and Rescue',
        guidance: [
            'Pumunta sa pinakamataas at matibay na bahagi ng gusali.',
            'Patayin ang main switch ng kuryente kung ligtas itong maabot.',
            'Huwag lumusong o tumawid sa mabilis na agos ng baha.',
            'Tumawag sa 911 at gumawa ng malinaw na senyas para sa rescuers.',
        ],
    },
    {
        id: 'natabunan',
        label: 'Natabunan',
        mode: 'rescue',
        keywords: ['natabunan', 'naipit', 'guho', 'rubble', 'trapped'],
        sampleInput: 'May natabunan at naipit sa gumuhong bahay. Kailangan ng rescue.',
        data: {
            assistanceType: 'Urban search and rescue / trapped-person rescue',
            situation: 'May taong natabunan o naipit sa gumuhong istruktura at hindi makalabas',
            priority: 'KRITIKAL — agarang search and rescue',
        },
        agencyName: 'Iligan City CDRRMO / Urban Search and Rescue',
        guidance: [
            'Huwag galawin ang malalaking debris na maaaring magdulot ng panibagong pagguho.',
            'Tawagin ang pangalan ng natabunan at alamin kung nakakasagot.',
            'Iwasang magsindi ng apoy dahil maaaring may tagas ng gas.',
            'Tumawag agad sa 911 at gabayan ang rescue team sa eksaktong lokasyon.',
        ],
    },
] as const;

export function findAssistanceResponseSeed(message: string): AssistanceResponseSeed | undefined {
    const normalizedMessage = message
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fil-PH');

    return assistanceResponseSeeds.find((seed) => seed.keywords.some((keyword) => normalizedMessage.includes(keyword)));
}

export function createParsedAssistanceData(seed: AssistanceResponseSeed): ParsedAssistanceData {
    return {
        ...seed.data,
        ...DEFAULT_LOCATION,
    };
}
