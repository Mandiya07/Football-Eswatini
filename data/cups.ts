
export interface BracketMatchTeam {
    id?: number;
    name: string;
    score?: number;
    crestUrl?: string;
}

export interface BracketMatch {
    id: number | string;
    team1: BracketMatchTeam;
    team2: BracketMatchTeam;
    winner?: 'team1' | 'team2';
    date?: string;
    time?: string;
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
        name: 'Ingwenyama Cup',
        logoUrl: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Ingwenyama',
        rounds: [
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 1, team1: { id: 1, name: 'Green Mamba', score: 1, crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM' }, team2: { id: 4, name: 'Royal Leopards', score: 0, crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RL' }, winner: 'team1', date: '2024-03-15', time: '15:00' },
                    { id: 2, team1: { id: 2, name: 'Mbabane Swallows', score: 2, crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS' }, team2: { id: 3, name: 'Young Buffaloes', score: 1, crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YB' }, winner: 'team1', date: '2024-03-16', time: '15:00' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 3, team1: { id: 1, name: 'Green Mamba', crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM' }, team2: { id: 2, name: 'Mbabane Swallows', crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS' }, date: '2024-04-01', time: '15:00' },
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
                    { id: 1, team1: { id: 5, name: 'Mbabane Highlanders', score: 2, crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=MH' }, team2: { id: 9, name: 'Manzini Sea Birds', score: 0, crestUrl: 'https://via.placeholder.com/128/87CEEB/000000?text=MSB' }, winner: 'team1', date: '2024-08-20', time: '13:00' },
                    { id: 2, team1: { id: 6, name: 'Manzini Wanderers', score: 1, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MW' }, team2: { id: 7, name: 'Moneni Pirates', score: 0, crestUrl: 'https://via.placeholder.com/128/FF4500/000000?text=MP' }, winner: 'team1', date: '2024-08-20', time: '15:30' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 3, team1: { id: 5, name: 'Mbabane Highlanders', score: 2, crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=MH' }, team2: { id: 6, name: 'Manzini Wanderers', score: 1, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MW' }, winner: 'team1', date: '2024-08-27', time: '15:00' },
                ]
            }
        ]
    }
];
