
export interface BracketMatchTeam {
    id?: number;
    name: string;
    score?: number | string;
    crestUrl?: string;
}

export interface BracketMatch {
    id: number | string;
    team1: BracketMatchTeam;
    team2: BracketMatchTeam;
    winner?: 'team1' | 'team2';
    date?: string;
    time?: string;
    venue?: string;
}

export interface BracketRound {
    title: string;
    matches: BracketMatch[];
}

export interface Tournament {
    id: string;
    name: string;
    logoUrl?: string;
    rounds: BracketRound[];
}

export const cupData: Tournament[] = [
    {
        id: 'ingwenyama-cup',
        name: 'Ingwenyama Cup (National Finals)',
        logoUrl: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Ingwenyama',
        rounds: [
            {
                title: 'Quarter-Finals',
                matches: [
                    { id: 'qf1', team1: { name: 'Mbabane Swallows', score: 3, crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS' }, team2: { name: 'Madlenya FC', score: 0, crestUrl: 'https://via.placeholder.com/128/483D8B/FFFFFF?text=MFC' }, winner: 'team1', date: '2024-02-10', venue: 'Somhlolo Stadium' },
                    { id: 'qf2', team1: { name: 'Green Mamba', score: 1, crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM' }, team2: { name: 'Nsingizini Hotspurs', score: 0, crestUrl: 'https://via.placeholder.com/128/FFFF00/000000?text=NH' }, winner: 'team1', date: '2024-02-10', venue: 'Somhlolo Stadium' },
                    { id: 'qf3', team1: { name: 'Royal Leopards', score: 2, crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RL' }, team2: { name: 'Ezulwini United', score: 1, crestUrl: 'https://via.placeholder.com/128/008080/FFFFFF?text=EU' }, winner: 'team1', date: '2024-02-11', venue: 'Mavuso Sports Centre' },
                    { id: 'qf4', team1: { name: 'Young Buffaloes', score: 4, crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YB' }, team2: { name: 'Illovo FC', score: 1, crestUrl: 'https://via.placeholder.com/128/228B22/FFFFFF?text=IFC' }, winner: 'team1', date: '2024-02-11', venue: 'Mavuso Sports Centre' },
                ]
            },
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 'sf1', team1: { name: 'Green Mamba', score: 1, crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM' }, team2: { name: 'Royal Leopards', score: 0, crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RL' }, winner: 'team1', date: '2024-03-15', time: '15:00', venue: 'Somhlolo Stadium' },
                    { id: 'sf2', team1: { name: 'Mbabane Swallows', score: 2, crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS' }, team2: { name: 'Young Buffaloes', score: 1, crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YB' }, winner: 'team1', date: '2024-03-16', time: '15:00', venue: 'Somhlolo Stadium' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 'f1', team1: { name: 'Green Mamba', crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM' }, team2: { name: 'Mbabane Swallows', crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS' }, date: '2024-04-01', time: '15:00', venue: 'Somhlolo National Stadium' },
                ]
            }
        ]
    },
    {
        id: 'ingwenyama-hhohho',
        name: 'Ingwenyama Cup (Hhohho Region)',
        logoUrl: 'https://via.placeholder.com/150/00008B/FFFFFF?text=Hhohho',
        rounds: [
             {
                title: 'Regional Final',
                matches: [
                    { id: 'hhohho-f', team1: { name: 'Pigg\'s Peak Rangers' }, team2: { name: 'Motshane FC' }, date: '2024-01-20', venue: 'Rocklands Stadium' }
                ]
            }
        ]
    },
    {
        id: 'ingwenyama-manzini',
        name: 'Manzini Super League Ingwenyama Cup',
        logoUrl: 'https://via.placeholder.com/150/800000/FFFFFF?text=Manzini',
        rounds: [
            {
                title: 'Quarter-Finals',
                matches: [
                    { id: 'manz-qf1', team1: { name: 'Manzini Sea Birds II', score: 2 }, team2: { name: 'Malkerns FC', score: 0 }, winner: 'team1', date: '2024-01-06', venue: 'Manzini Club' },
                    { id: 'manz-qf2', team1: { name: 'Ludzeludze Brothers', score: 1 }, team2: { name: 'Luyengo Foxes', score: 0 }, winner: 'team1', date: '2024-01-06', venue: 'Manzini Club' },
                    { id: 'manz-qf3', team1: { name: 'Matsapha United', score: 3 }, team2: { name: 'Tinyosi FC', score: 2 }, winner: 'team1', date: '2024-01-07', venue: 'Mavuso Sports Centre' },
                    { id: 'manz-qf4', team1: { name: 'Moneni Pirates II', score: 1 }, team2: { name: 'Mhubhe United', score: 0 }, winner: 'team1', date: '2024-01-07', venue: 'Mavuso Sports Centre' }
                ]
            },
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 'manz-sf1', team1: { name: 'Manzini Sea Birds II', score: 2 }, team2: { name: 'Ludzeludze Brothers', score: 1 }, winner: 'team1', date: '2024-01-13', venue: 'Manzini Club' },
                    { id: 'manz-sf2', team1: { name: 'Matsapha United', score: 0 }, team2: { name: 'Moneni Pirates II', score: 1 }, winner: 'team2', date: '2024-01-13', venue: 'Manzini Club' }
                ]
            },
            {
                title: 'Regional Final',
                matches: [
                    { id: 'manz-f', team1: { name: 'Manzini Sea Birds II' }, team2: { name: 'Moneni Pirates II' }, date: '2024-01-20', time: '15:00', venue: 'Mavuso Sports Centre' }
                ]
            }
        ]
    },
    {
        id: 'ingwenyama-lubombo',
        name: 'Ingwenyama Cup (Lubombo Region)',
        logoUrl: 'https://via.placeholder.com/150/006400/FFFFFF?text=Lubombo',
        rounds: [
             {
                title: 'Regional Final',
                matches: [
                    { id: 'lub-f', team1: { name: 'Siteki Scouts' }, team2: { name: 'Big Bend United' }, date: '2024-01-21', venue: 'Mayaluka Stadium' }
                ]
            }
        ]
    },
    {
        id: 'ingwenyama-shiselweni',
        name: 'Ingwenyama Cup (Shiselweni Region)',
        logoUrl: 'https://via.placeholder.com/150/FF4500/FFFFFF?text=Shiselweni',
        rounds: [
             {
                title: 'Regional Final',
                matches: [
                    { id: 'shis-f', team1: { name: 'Nhlangano Sun' }, team2: { name: 'Zombodze Eels' }, date: '2024-01-21', venue: 'King Sobhuza II Stadium' }
                ]
            }
        ]
    },
    {
        id: 'ingwenyama-cup-women',
        name: 'Ingwenyama Cup (Women)',
        logoUrl: 'https://via.placeholder.com/150/FF69B4/FFFFFF?text=Ingwenyama+Ladies',
        rounds: [
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 'wsf1', team1: { name: 'Young Buffaloes Ladies', score: 5, crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YBL' }, team2: { name: 'Manzini Wanderers Ladies', score: 0, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MWL' }, winner: 'team1', date: '2024-03-10', venue: 'Malkerns Country Club' },
                    { id: 'wsf2', team1: { name: 'Royal Leopards Ladies', score: 2, crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RLL' }, team2: { name: 'Mbabane Swallows Ladies', score: 1, crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MSL' }, winner: 'team1', date: '2024-03-10', venue: 'Malkerns Country Club' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 'wf1', team1: { name: 'Young Buffaloes Ladies', crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YBL' }, team2: { name: 'Royal Leopards Ladies', crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RLL' }, date: '2024-04-01', time: '11:00', venue: 'Somhlolo National Stadium' },
                ]
            }
        ]
    },
    {
        id: 'trade-fair-cup',
        name: 'Trade Fair Cup',
        logoUrl: 'https://via.placeholder.com/150/4682B4/FFFFFF?text=Trade+Fair',
        rounds: [
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 1, team1: { id: 5, name: 'Mbabane Highlanders', score: 2, crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=MH' }, team2: { id: 9, name: 'Manzini Sea Birds', score: 0, crestUrl: 'https://via.placeholder.com/128/87CEEB/000000?text=MSB' }, winner: 'team1', date: '2024-08-20', time: '13:00', venue: 'Mavuso' },
                    { id: 2, team1: { id: 6, name: 'Manzini Wanderers', score: 1, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MW' }, team2: { id: 7, name: 'Moneni Pirates', score: 0, crestUrl: 'https://via.placeholder.com/128/FF4500/000000?text=MP' }, winner: 'team1', date: '2024-08-20', time: '15:30', venue: 'Mavuso' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 3, team1: { id: 5, name: 'Mbabane Highlanders', score: 2, crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=MH' }, team2: { id: 6, name: 'Manzini Wanderers', score: 1, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MW' }, winner: 'team1', date: '2024-08-27', time: '15:00', venue: 'Mavuso Sports Centre' },
                ]
            }
        ]
    },
    {
        id: 'instacash-schools-tournament',
        name: 'Instacash Schools Tournament',
        logoUrl: 'https://via.placeholder.com/150/F59E0B/FFFFFF?text=Instacash',
        rounds: [
            {
                title: 'Quarter-Finals',
                matches: [
                    { id: 1, team1: { name: 'Salesian High', score: 3, crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' }, team2: { name: 'Evelyn Baring', score: 1, crestUrl: 'https://via.placeholder.com/64/34D399/000000?text=EBH' }, winner: 'team1', date: '2023-10-10', venue: 'King Sobhuza II' },
                    { id: 2, team1: { name: 'St. Francis High', score: 0, crestUrl: 'https://via.placeholder.com/64/EF4444/FFFFFF?text=SFH' }, team2: { name: 'Manzini Nazarene', score: 1, crestUrl: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=MNH' }, winner: 'team2', date: '2023-10-10', venue: 'King Sobhuza II' },
                    { id: 3, team1: { name: 'St. Marks High', score: '2 (4)', crestUrl: 'https://via.placeholder.com/64/14B8A6/FFFFFF?text=SMH' }, team2: { name: 'Sifundzani High', score: '2 (3)', crestUrl: 'https://via.placeholder.com/64/D63031/FFFFFF?text=SHS' }, winner: 'team1', date: '2023-10-11', venue: 'Mavuso' },
                    { id: 4, team1: { name: 'Mbabane Central', score: 1, crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' }, team2: { name: 'Waterford Kamhlaba', score: 0, crestUrl: 'https://via.placeholder.com/64/1E3A8A/FFFFFF?text=WK' }, winner: 'team1', date: '2023-10-11', venue: 'Mavuso' },
                ]
            },
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 5, team1: { name: 'Salesian High', score: 2, crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' }, team2: { name: 'Manzini Nazarene', score: 0, crestUrl: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=MNH' }, winner: 'team1', date: '2023-10-24', venue: 'Somhlolo Stadium' },
                    { id: 6, team1: { name: 'St. Marks High', score: 1, crestUrl: 'https://via.placeholder.com/64/14B8A6/FFFFFF?text=SMH' }, team2: { name: 'Mbabane Central', score: 3, crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' }, winner: 'team2', date: '2023-10-24', venue: 'Somhlolo Stadium' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 7, team1: { name: 'Salesian High', crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' }, team2: { name: 'Mbabane Central', crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' }, date: '2023-11-15', time: '14:00', venue: 'Somhlolo Stadium' },
                ]
            }
        ]
    }
];
