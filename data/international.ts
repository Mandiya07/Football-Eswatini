import { Tournament } from "./cups";
import { CompetitionFixture } from "./teams";

export interface ConfigTeam {
    name: string;
    crestUrl: string;
    dbId?: number; 
}

export interface HybridTournament {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    type: 'hybrid';
    externalApiId?: string;
    teams: ConfigTeam[];
    groups?: {
        name: string;
        teamNames: string[];
    }[];
    matches: CompetitionFixture[];
    bracket?: Tournament;
    bracketId?: string;
}

export const internationalData: HybridTournament[] = [
    {
        id: 'uefa-champions-league',
        name: 'UEFA Champions League',
        description: "The ultimate prize in European club football, featuring the continent's elite teams.",
        logoUrl: 'https://via.placeholder.com/150/002B7F/FFFFFF?text=UCL',
        type: 'hybrid',
        teams: [],
        groups: [],
        matches: []
    },
    {
        id: 'uefa-europa-league',
        name: 'UEFA Europa League',
        description: "Europe's intense secondary club competition with high-stakes knockout drama.",
        logoUrl: 'https://via.placeholder.com/150/FF4500/000000?text=UEL',
        type: 'hybrid',
        teams: [],
        groups: [],
        matches: []
    },
    {
        id: 'caf-champions-league',
        name: 'CAF Champions League',
        description: "The premier club competition for African football giants.",
        logoUrl: 'https://via.placeholder.com/150/FF8C00/000000?text=CAF+CL',
        type: 'hybrid',
        teams: [],
        groups: [],
        matches: []
    },
    {
        id: 'caf-confederations-cup',
        name: 'CAF Confederations Cup',
        description: "The exciting continental challenge for Africa's rising and established clubs.",
        logoUrl: 'https://via.placeholder.com/150/228B22/FFFFFF?text=CAF+CC',
        type: 'hybrid',
        teams: [],
        groups: [],
        matches: []
    },
    {
        id: 'fifa-world-cup',
        name: 'FIFA World Cup',
        description: "The biggest sporting event on earth, where nations compete for global immortality.",
        logoUrl: 'https://via.placeholder.com/150/D4AF37/000000?text=FIFA+WC',
        type: 'hybrid',
        teams: [],
        groups: [],
        matches: []
    },
    {
        id: 'afcon-2025',
        name: 'Africa Cup of Nations 2025',
        description: "The 35th edition of Africa's flagship tournament. 24 teams across 6 groups battle for continental glory in Morocco.",
        logoUrl: 'https://via.placeholder.com/150/228B22/FFD700?text=AFCON+2025',
        type: 'hybrid',
        teams: [
            // Group A
            { name: 'Morocco', crestUrl: 'https://via.placeholder.com/64/C1272D/006233?text=MAR' },
            { name: 'Sierra Leone', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=SLE' },
            { name: 'Liberia', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=LBR' },
            { name: 'Chad', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=CHA' },
            // Group B
            { name: 'Egypt', crestUrl: 'https://via.placeholder.com/64/CE1126/000000?text=EGY' },
            { name: 'Nigeria', crestUrl: 'https://via.placeholder.com/64/008751/FFFFFF?text=NGA' },
            { name: 'Benin', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=BEN' },
            { name: 'Rwanda', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=RWA' },
            // Group C
            { name: 'Senegal', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=SEN' },
            { name: 'Burkina Faso', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=BFA' },
            { name: 'Burundi', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=BDI' },
            { name: 'Malawi', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=MWI' },
            // Group D
            { name: 'Ivory Coast', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=CIV' },
            { name: 'Equatorial Guinea', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=EQG' },
            { name: 'Togo', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=TOG' },
            { name: 'South Sudan', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=SSD' },
            // Group E
            { name: 'Algeria', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=ALG' },
            { name: 'Guinea', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=GUI' },
            { name: 'Uganda', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=UGA' },
            { name: 'Botswana', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=BOT' },
            // Group F
            { name: 'Tunisia', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=TUN' },
            { name: 'Mali', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=MLI' },
            { name: 'Gambia', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=GAM' },
            { name: 'Madagascar', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=MAD' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['Morocco', 'Sierra Leone', 'Liberia', 'Chad'] },
            { name: 'Group B', teamNames: ['Egypt', 'Nigeria', 'Benin', 'Rwanda'] },
            { name: 'Group C', teamNames: ['Senegal', 'Burkina Faso', 'Burundi', 'Malawi'] },
            { name: 'Group D', teamNames: ['Ivory Coast', 'Equatorial Guinea', 'Togo', 'South Sudan'] },
            { name: 'Group E', teamNames: ['Algeria', 'Guinea', 'Uganda', 'Botswana'] },
            { name: 'Group F', teamNames: ['Tunisia', 'Mali', 'Gambia', 'Madagascar'] }
        ],
        matches: [
            // GROUP A - 6 matches
            { id: 'afcon-a1', teamA: 'Morocco', teamB: 'Sierra Leone', status: 'scheduled', fullDate: '2025-12-21', date: '21', day: 'SUN', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-a2', teamA: 'Liberia', teamB: 'Chad', status: 'scheduled', fullDate: '2025-12-21', date: '21', day: 'SUN', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-a3', teamA: 'Morocco', teamB: 'Liberia', status: 'scheduled', fullDate: '2025-12-25', date: '25', day: 'THU', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-a4', teamA: 'Sierra Leone', teamB: 'Chad', status: 'scheduled', fullDate: '2025-12-25', date: '25', day: 'THU', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-a5', teamA: 'Chad', teamB: 'Morocco', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-a6', teamA: 'Sierra Leone', teamB: 'Liberia', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '18:00', competition: 'AFCON 2025' },
            // GROUP B - 6 matches
            { id: 'afcon-b1', teamA: 'Egypt', teamB: 'Nigeria', status: 'scheduled', fullDate: '2025-12-22', date: '22', day: 'MON', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-b2', teamA: 'Benin', teamB: 'Rwanda', status: 'scheduled', fullDate: '2025-12-22', date: '22', day: 'MON', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-b3', teamA: 'Egypt', teamB: 'Benin', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-b4', teamA: 'Nigeria', teamB: 'Rwanda', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-b5', teamA: 'Rwanda', teamB: 'Egypt', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-b6', teamA: 'Nigeria', teamB: 'Benin', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '18:00', competition: 'AFCON 2025' },
            // GROUP C - 6 matches
            { id: 'afcon-c1', teamA: 'Senegal', teamB: 'Burkina Faso', status: 'scheduled', fullDate: '2025-12-23', date: '23', day: 'TUE', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-c2', teamA: 'Burundi', teamB: 'Malawi', status: 'scheduled', fullDate: '2025-12-23', date: '23', day: 'TUE', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-c3', teamA: 'Senegal', teamB: 'Burundi', status: 'scheduled', fullDate: '2025-12-27', date: '27', day: 'SAT', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-c4', teamA: 'Burkina Faso', teamB: 'Malawi', status: 'scheduled', fullDate: '2025-12-27', date: '27', day: 'SAT', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-c5', teamA: 'Malawi', teamB: 'Senegal', status: 'scheduled', fullDate: '2025-12-31', date: '31', day: 'WED', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-c6', teamA: 'Burkina Faso', teamB: 'Burundi', status: 'scheduled', fullDate: '2025-12-31', date: '31', day: 'WED', time: '18:00', competition: 'AFCON 2025' },
            // GROUP D - 6 matches
            { id: 'afcon-d1', teamA: 'Ivory Coast', teamB: 'Equatorial Guinea', status: 'scheduled', fullDate: '2025-12-24', date: '24', day: 'WED', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-d2', teamA: 'Togo', teamB: 'South Sudan', status: 'scheduled', fullDate: '2025-12-24', date: '24', day: 'WED', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-d3', teamA: 'Ivory Coast', teamB: 'Togo', status: 'scheduled', fullDate: '2025-12-28', date: '28', day: 'SUN', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-d4', teamA: 'Equatorial Guinea', teamB: 'South Sudan', status: 'scheduled', fullDate: '2025-12-28', date: '28', day: 'SUN', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-d5', teamA: 'South Sudan', teamB: 'Ivory Coast', status: 'scheduled', fullDate: '2026-01-01', date: '01', day: 'THU', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-d6', teamA: 'Equatorial Guinea', teamB: 'Togo', status: 'scheduled', fullDate: '2026-01-01', date: '01', day: 'THU', time: '18:00', competition: 'AFCON 2025' },
            // GROUP E - 6 matches
            { id: 'afcon-e1', teamA: 'Algeria', teamB: 'Guinea', status: 'scheduled', fullDate: '2025-12-25', date: '25', day: 'THU', time: '15:00', competition: 'AFCON 2025' },
            { id: 'afcon-e2', teamA: 'Uganda', teamB: 'Botswana', status: 'scheduled', fullDate: '2025-12-25', date: '25', day: 'THU', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-e3', teamA: 'Algeria', teamB: 'Uganda', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-e4', teamA: 'Guinea', teamB: 'Botswana', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-e5', teamA: 'Botswana', teamB: 'Algeria', status: 'scheduled', fullDate: '2026-01-02', date: '02', day: 'FRI', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-e6', teamA: 'Guinea', teamB: 'Uganda', status: 'scheduled', fullDate: '2026-01-02', date: '02', day: 'FRI', time: '18:00', competition: 'AFCON 2025' },
            // GROUP F - 6 matches
            { id: 'afcon-f1', teamA: 'Tunisia', teamB: 'Mali', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '15:00', competition: 'AFCON 2025' },
            { id: 'afcon-f2', teamA: 'Gambia', teamB: 'Madagascar', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-f3', teamA: 'Tunisia', teamB: 'Gambia', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-f4', teamA: 'Mali', teamB: 'Madagascar', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '21:00', competition: 'AFCON 2025' },
            { id: 'afcon-f5', teamA: 'Madagascar', teamB: 'Tunisia', status: 'scheduled', fullDate: '2026-01-03', date: '03', day: 'SAT', time: '18:00', competition: 'AFCON 2025' },
            { id: 'afcon-f6', teamA: 'Mali', teamB: 'Gambia', status: 'scheduled', fullDate: '2026-01-03', date: '03', day: 'SAT', time: '18:00', competition: 'AFCON 2025' }
        ]
    }
];