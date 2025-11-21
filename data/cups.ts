
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
    },
    {
        id: 'instacash-schools-tournament',
        name: 'Instacash Schools Tournament',
        logoUrl: 'https://via.placeholder.com/150/F59E0B/FFFFFF?text=Instacash',
        rounds: [
            {
                title: 'Quarter-Finals',
                matches: [
                    { id: 1, team1: { name: 'Salesian High', score: 3, crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' }, team2: { name: 'Evelyn Baring', score: 1, crestUrl: 'https://via.placeholder.com/64/34D399/000000?text=EBH' }, winner: 'team1', date: '2023-10-10' },
                    { id: 2, team1: { name: 'St. Francis High', score: 0, crestUrl: 'https://via.placeholder.com/64/EF4444/FFFFFF?text=SFH' }, team2: { name: 'Manzini Nazarene', score: 1, crestUrl: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=MNH' }, winner: 'team2', date: '2023-10-10' },
                    { id: 3, team1: { name: 'St. Marks High', score: 2, crestUrl: 'https://via.placeholder.com/64/14B8A6/FFFFFF?text=SMH' }, team2: { name: 'Sifundzani High', score: 2, crestUrl: 'https://via.placeholder.com/64/D63031/FFFFFF?text=SHS' }, winner: 'team1', date: '2023-10-11', time: 'Pen: 4-3' },
                    { id: 4, team1: { name: 'Mbabane Central', score: 1, crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' }, team2: { name: 'Waterford Kamhlaba', score: 0, crestUrl: 'https://via.placeholder.com/64/1E3A8A/FFFFFF?text=WK' }, winner: 'team1', date: '2023-10-11' },
                ]
            },
            {
                title: 'Semi-Finals',
                matches: [
                    { id: 5, team1: { name: 'Salesian High', score: 2, crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' }, team2: { name: 'Manzini Nazarene', score: 0, crestUrl: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=MNH' }, winner: 'team1', date: '2023-10-24' },
                    { id: 6, team1: { name: 'St. Marks High', score: 1, crestUrl: 'https://via.placeholder.com/64/14B8A6/FFFFFF?text=SMH' }, team2: { name: 'Mbabane Central', score: 3, crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' }, winner: 'team2', date: '2023-10-24' },
                ]
            },
            {
                title: 'Final',
                matches: [
                    { id: 7, team1: { name: 'Salesian High', crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' }, team2: { name: 'Mbabane Central', crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' }, date: '2023-11-15', time: '14:00' },
                ]
            }
        ]
    }
];
