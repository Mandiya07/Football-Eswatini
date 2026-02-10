
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
    winner?: 'team1' | 'team2' | null;
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
    categoryId?: string;
    type?: 'bracket' | 'league';
}

export const cupData: Tournament[] = [
    {
        id: 'ingwenyama-cup',
        name: 'Ingwenyama Cup - National Finals',
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
        id: 'hhohho-super-league-ingwenyama-cup',
        name: 'Hhohho Super League Ingwenyama Cup',
        logoUrl: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Ingwenyama',
        rounds: [
            {
                title: 'Quarter-Finals',
                matches: [
                    { id: 'h-qf1', team1: { name: 'Malanti Chiefs', score: 2, crestUrl: 'https://via.placeholder.com/128/FFD700/000000?text=MC' }, team2: { name: 'Pigg\'s Peak Black Swallows', score: 1, crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=BS' }, winner: 'team1', venue: 'Killarney Stadium' },
                    { id: 'h-qf2', team1: { name: 'Seven Dreams', score: 0, crestUrl: 'https://via.placeholder.com/128/4B0082/FFFFFF?text=SD' }, team2: { name: 'Manchester United (PP)', score: 3, crestUrl: 'https://via.placeholder.com/128/DA291C/FFFFFF?text=MU' }, winner: 'team2', venue: 'Rocklands Stadium' },
                    { id: 'h-qf3', team1: { name: 'Hhohho Stars', score: 1, crestUrl: 'https://via.placeholder.com/128/1E90FF/FFFFFF?text=HS' }, team2: { name: 'Northern Lions', score: 2, crestUrl: 'https://via.placeholder.com/128/FFA500/FFFFFF?text=NL' }, winner: 'team2', venue: 'Prince of Wales' },
                    { id: 'h-qf4', team1: { name: 'Mbabane City', score: 1, crestUrl: 'https://via.placeholder.com/128/32CD32/FFFFFF?text=MC' }, team2: { name: 'Lobamba Wanderers', score: 1, crestUrl: 'https://via.placeholder.com/128/FF69B4/FFFFFF?text=LW' }, date: 'TBD', venue: 'Somhlolo' }
                ]
            },
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 'h-sf1', team1: { name: 'Malanti Chiefs', crestUrl: 'https://via.placeholder.com/128/FFD700/000000?text=MC' }, team2: { name: 'Manchester United (PP)', crestUrl: 'https://via.placeholder.com/128/DA291C/FFFFFF?text=MU' } },
                    { id: 'h-sf2', team1: { name: 'Northern Lions', crestUrl: 'https://via.placeholder.com/128/FFA500/FFFFFF?text=NL' }, team2: { name: 'TBD' } }
                ]
            },
            {
                title: 'Final',
                matches: [{ id: 'h-f', team1: { name: 'TBD' }, team2: { name: 'TBD' } }]
            }
        ]
    },
    {
        id: 'shiselweni-super-league-ingwenyama-cup',
        name: 'Shiselweni Super League Ingwenyama Cup',
        logoUrl: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Ingwenyama',
        rounds: [
            {
                title: 'Quarter-Finals',
                matches: [
                    { id: 's-qf1', team1: { name: 'Vovovo FC', score: 3, crestUrl: 'https://via.placeholder.com/128/FF4500/FFFFFF?text=VFC' }, team2: { name: 'Rangers FC', score: 2, crestUrl: 'https://via.placeholder.com/128/006400/FFFFFF?text=RFC' }, winner: 'team1', venue: 'King Sobhuza II' },
                    { id: 's-qf2', team1: { name: 'Shiselweni Celtics', score: 0, crestUrl: 'https://via.placeholder.com/128/008000/FFFFFF?text=SC' }, team2: { name: 'Nkwene Lions', score: 1, crestUrl: 'https://via.placeholder.com/128/8B4513/FFFFFF?text=NL' }, winner: 'team2', venue: 'Nhlangano Stadium' },
                    { id: 's-qf3', team1: { name: 'Southern Aces', score: 4, crestUrl: 'https://via.placeholder.com/128/FFD700/000000?text=SA' }, team2: { name: 'Hlatikulu Tycoons', score: 0, crestUrl: 'https://via.placeholder.com/128/4682B4/FFFFFF?text=HT' }, winner: 'team1', venue: 'King Sobhuza II' },
                    { id: 's-qf4', team1: { name: 'Mhlosheni United', score: 2, crestUrl: 'https://via.placeholder.com/128/800000/FFFFFF?text=MU' }, team2: { name: 'Matsanjeni FC', score: 2, crestUrl: 'https://via.placeholder.com/128/2F4F4F/FFFFFF?text=MFC' }, venue: 'Nhlangano Stadium' }
                ]
            },
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 's-sf1', team1: { name: 'Vovovo FC', crestUrl: 'https://via.placeholder.com/128/FF4500/FFFFFF?text=VFC' }, team2: { name: 'Nkwene Lions', crestUrl: 'https://via.placeholder.com/128/8B4513/FFFFFF?text=NL' } },
                    { id: 's-sf2', team1: { name: 'Southern Aces', crestUrl: 'https://via.placeholder.com/128/FFD700/000000?text=SA' }, team2: { name: 'TBD' } }
                ]
            },
            {
                title: 'Final',
                matches: [{ id: 's-f', team1: { name: 'TBD' }, team2: { name: 'TBD' } }]
            }
        ]
    }
];
