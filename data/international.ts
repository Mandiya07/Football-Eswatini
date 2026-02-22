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
    categoryId?: string; 
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
        id: 'caf-confederations-cup',
        name: 'CAF Confederations Cup 2025/26',
        description: "Africa's secondary club competition. Follow the journey of the continent's elite clubs through the group stages to the knockout finals.",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/CAF_Confederation_Cup_%282024%29.svg/1200px-CAF_Confederation_Cup_%282024%29.svg.png',
        type: 'hybrid',
        categoryId: 'international-leagues',
        teams: [
            { name: 'USM Alger', crestUrl: 'https://via.placeholder.com/64/CC0000/FFFFFF?text=USM' },
            { name: 'Olympic Safi', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=OCS' },
            { name: 'Djoliba AC', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFF00?text=DAC' },
            { name: 'FC San Pedro', crestUrl: 'https://via.placeholder.com/64/FFA500/000000?text=FCS' },
            { name: 'Maniema Union', crestUrl: 'https://via.placeholder.com/64/FFFF00/000000?text=MUN' },
            { name: 'Nairobi United', crestUrl: 'https://via.placeholder.com/64/008000/FFFFFF?text=NUN' },
            { name: 'Wydad Casablanca', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=WAC' },
            { name: 'Azam FC', crestUrl: 'https://via.placeholder.com/64/00008B/FFFFFF?text=AZM' },
            { name: 'CR Belouizdad', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=CRB' },
            { name: 'AS Otohô', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=ASO' },
            { name: 'Stellenbosch', crestUrl: 'https://via.placeholder.com/64/800000/FFFFFF?text=SFC' },
            { name: 'Singida Black Stars SC', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=SBS' },
            { name: 'Al-Masry', crestUrl: 'https://via.placeholder.com/64/008000/FFFFFF?text=ALM' },
            { name: 'ZESCO United', crestUrl: 'https://via.placeholder.com/64/FFA500/000000?text=ZES' },
            { name: 'Zamalek SC', crestUrl: 'https://via.placeholder.com/64/FFFFFF/FF0000?text=ZAM' },
            { name: 'Kaizer Chiefs', crestUrl: 'https://via.placeholder.com/64/FFD700/000000?text=KZC' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['USM Alger', 'Olympic Safi', 'Djoliba AC', 'FC San Pedro'] },
            { name: 'Group B', teamNames: ['Maniema Union', 'Nairobi United', 'Wydad Casablanca', 'Azam FC'] },
            { name: 'Group C', teamNames: ['CR Belouizdad', 'AS Otohô', 'Stellenbosch', 'Singida Black Stars SC'] },
            { name: 'Group D', teamNames: ['Al-Masry', 'ZESCO United', 'Zamalek SC', 'Kaizer Chiefs'] }
        ],
        matches: [
            {
                id: 'caf-match-1',
                teamA: 'Al-Masry',
                teamB: 'ZESCO United',
                scoreA: 2,
                scoreB: 0,
                fullDate: '2026-02-14',
                date: '14',
                day: 'SAT',
                time: '18:00',
                status: 'finished',
                matchday: 6,
                venue: 'Port Said Stadium'
            },
            {
                id: 'caf-match-2',
                teamA: 'Zamalek SC',
                teamB: 'Kaizer Chiefs',
                scoreA: 2,
                scoreB: 1,
                fullDate: '2026-02-14',
                date: '14',
                day: 'SAT',
                time: '20:00',
                status: 'finished',
                matchday: 6,
                venue: 'Cairo International Stadium'
            },
            {
                id: 'caf-match-3',
                teamA: 'USM Alger',
                teamB: 'Olympic Safi',
                scoreA: 0,
                scoreB: 0,
                fullDate: '2026-02-14',
                date: '14',
                day: 'SAT',
                time: '19:00',
                status: 'finished',
                matchday: 6,
                venue: 'Stade Omar Hamadi'
            },
            {
                id: 'caf-match-4',
                teamA: 'Maniema Union',
                teamB: 'Nairobi United',
                scoreA: 3,
                scoreB: 0,
                fullDate: '2026-02-15',
                date: '15',
                day: 'SUN',
                time: '15:00',
                status: 'finished',
                matchday: 6,
                venue: 'Stade Joseph Kabila'
            },
            {
                id: 'caf-match-5',
                teamA: 'Wydad Casablanca',
                teamB: 'Azam FC',
                scoreA: 2,
                scoreB: 0,
                fullDate: '2026-02-15',
                date: '15',
                day: 'SUN',
                time: '19:00',
                status: 'finished',
                matchday: 6,
                venue: 'Stade Mohamed V'
            },
            {
                id: 'caf-match-6',
                teamA: 'Djoliba AC',
                teamB: 'FC San Pedro',
                scoreA: 4,
                scoreB: 0,
                fullDate: '2026-02-15',
                date: '15',
                day: 'SUN',
                time: '16:00',
                status: 'finished',
                matchday: 6,
                venue: 'Stade Modibo Kéïta'
            },
            {
                id: 'caf-match-7',
                teamA: 'CR Belouizdad',
                teamB: 'AS Otohô',
                scoreA: 2,
                scoreB: 1,
                fullDate: '2026-02-15',
                date: '15',
                day: 'SUN',
                time: '20:00',
                status: 'finished',
                matchday: 6,
                venue: 'Stade du 5 Juillet'
            },
            {
                id: 'caf-match-8',
                teamA: 'Stellenbosch',
                teamB: 'Singida Black Stars SC',
                scoreA: 0,
                scoreB: 0,
                fullDate: '2026-02-15',
                date: '15',
                day: 'SUN',
                time: '15:30',
                status: 'finished',
                matchday: 6,
                venue: 'Danie Craven Stadium'
            }
        ]
    },
    {
        id: 'uefa-champions-league',
        name: 'UEFA Champions League 2025-26',
        description: "The new 36-team league phase. All clubs are ranked in a single league table. Each team plays 8 matches against 8 different opponents to determine who advances to the knockout rounds.",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png',
        type: 'hybrid',
        categoryId: 'international-leagues',
        teams: [
            { name: 'Manchester City', crestUrl: 'https://via.placeholder.com/64/6CABDD/FFFFFF?text=MCI' },
            { name: 'Bayern München', crestUrl: 'https://via.placeholder.com/64/DC052D/FFFFFF?text=FCB' },
            { name: 'Real Madrid', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=RMA' },
            { name: 'Paris Saint-Germain', crestUrl: 'https://via.placeholder.com/64/002B7F/FFFFFF?text=PSG' },
            { name: 'Liverpool', crestUrl: 'https://via.placeholder.com/64/C8102E/FFFFFF?text=LIV' },
            { name: 'Inter Milan', crestUrl: 'https://via.placeholder.com/64/0066B2/FFFFFF?text=INT' },
            { name: 'Borussia Dortmund', crestUrl: 'https://via.placeholder.com/64/FDE100/000000?text=BVB' },
            { name: 'RB Leipzig', crestUrl: 'https://via.placeholder.com/64/DD013F/FFFFFF?text=RBL' },
            { name: 'Barcelona', crestUrl: 'https://via.placeholder.com/64/A50044/FFFFFF?text=BAR' },
            { name: 'Bayer Leverkusen', crestUrl: 'https://via.placeholder.com/64/E32221/000000?text=B04' },
            { name: 'Atlético Madrid', crestUrl: 'https://via.placeholder.com/64/CB3524/FFFFFF?text=ATM' },
            { name: 'Atalanta', crestUrl: 'https://via.placeholder.com/64/1E71B8/000000?text=ATA' },
            { name: 'Juventus', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=JUV' },
            { name: 'Benfica', crestUrl: 'https://via.placeholder.com/64/E83030/FFFFFF?text=SLB' },
            { name: 'Arsenal', crestUrl: 'https://via.placeholder.com/64/EF0107/FFFFFF?text=ARS' },
            { name: 'Club Brugge', crestUrl: 'https://via.placeholder.com/64/003E7E/FFFFFF?text=CLU' },
            { name: 'Shakhtar Donetsk', crestUrl: 'https://via.placeholder.com/64/FF6600/000000?text=SHA' },
            { name: 'AC Milan', crestUrl: 'https://via.placeholder.com/64/FB090B/000000?text=ACM' },
            { name: 'Feyenoord', crestUrl: 'https://via.placeholder.com/64/ED1C24/FFFFFF?text=FEY' },
            { name: 'Sporting CP', crestUrl: 'https://via.placeholder.com/64/008050/FFFFFF?text=SCP' },
            { name: 'PSV Eindhoven', crestUrl: 'https://via.placeholder.com/64/EF3333/FFFFFF?text=PSV' },
            { name: 'GNK Dinamo', crestUrl: 'https://via.placeholder.com/64/004DA0/FFFFFF?text=DIN' },
            { name: 'RB Salzburg', crestUrl: 'https://via.placeholder.com/64/DD013F/FFFFFF?text=RBS' },
            { name: 'Lille OSC', crestUrl: 'https://via.placeholder.com/64/E01E2E/FFFFFF?text=LOSC' },
            { name: 'Crvena Zvezda', crestUrl: 'https://via.placeholder.com/64/E1000F/FFFFFF?text=CZV' },
            { name: 'Young Boys', crestUrl: 'https://via.placeholder.com/64/FEE000/000000?text=YB' },
            { name: 'Celtic', crestUrl: 'https://via.placeholder.com/64/018749/FFFFFF?text=CEL' },
            { name: 'Slovan Bratislava', crestUrl: 'https://via.placeholder.com/64/005CAB/FFFFFF?text=SLO' },
            { name: 'AS Monaco', crestUrl: 'https://via.placeholder.com/64/E41B17/FFFFFF?text=ASM' },
            { name: 'Sparta Praha', crestUrl: 'https://via.placeholder.com/64/D3010C/FFFFFF?text=SPA' },
            { name: 'Aston Villa', crestUrl: 'https://via.placeholder.com/64/95BFE5/670E36?text=AVL' },
            { name: 'Bologna', crestUrl: 'https://via.placeholder.com/64/1A2F50/FFFFFF?text=BOL' },
            { name: 'Girona', crestUrl: 'https://via.placeholder.com/64/D3010C/FFFFFF?text=GIR' },
            { name: 'VfB Stuttgart', crestUrl: 'https://via.placeholder.com/64/FFFFFF/E30613?text=VfB' },
            { name: 'Sturm Graz', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=STU' },
            { name: 'Stade Brestois', crestUrl: 'https://via.placeholder.com/64/E20E18/FFFFFF?text=SB29' }
        ],
        groups: [
            { 
                name: '🏆 League Phase Standings', 
                teamNames: [
                    'Manchester City', 'Bayern München', 'Real Madrid', 'Paris Saint-Germain', 'Liverpool', 'Inter Milan', 'Borussia Dortmund', 'RB Leipzig', 'Barcelona',
                    'Bayer Leverkusen', 'Atlético Madrid', 'Atalanta', 'Juventus', 'Benfica', 'Arsenal', 'Club Brugge', 'Shakhtar Donetsk', 'AC Milan',
                    'Feyenoord', 'Sporting CP', 'PSV Eindhoven', 'GNK Dinamo', 'RB Salzburg', 'Lille OSC', 'Crvena Zvezda', 'Young Boys', 'Celtic',
                    'Slovan Bratislava', 'AS Monaco', 'Sparta Praha', 'Aston Villa', 'Bologna', 'Girona', 'VfB Stuttgart', 'Sturm Graz', 'Stade Brestois'
                ] 
            }
        ],
        matches: [
            { id: 'ucl-m1', teamA: 'Manchester City', teamB: 'Inter Milan', scoreA: 0, scoreB: 0, fullDate: '2025-09-18', date: '18', day: 'WED', time: '21:00', status: 'finished', matchday: 1 },
            { id: 'ucl-m2', teamA: 'Real Madrid', teamB: 'VfB Stuttgart', scoreA: 3, scoreB: 1, fullDate: '2025-09-17', date: '17', day: 'TUE', time: '21:00', status: 'finished', matchday: 1 },
            { id: 'ucl-m3', teamA: 'AC Milan', teamB: 'Liverpool', scoreA: 1, scoreB: 3, fullDate: '2025-09-17', date: '17', day: 'TUE', time: '21:00', status: 'finished', matchday: 1 },
            { id: 'ucl-m4', teamA: 'Arsenal', teamB: 'Paris Saint-Germain', scoreA: 2, scoreB: 0, fullDate: '2025-10-01', date: '01', day: 'WED', time: '21:00', status: 'finished', matchday: 2 },
            { id: 'ucl-m5', teamA: 'Barcelona', teamB: 'Bayern München', scoreA: 4, scoreB: 1, fullDate: '2025-10-23', date: '23', day: 'WED', time: '21:00', status: 'finished', matchday: 3 },
            { id: 'ucl-m6', teamA: 'Liverpool', teamB: 'Bayer Leverkusen', scoreA: 4, scoreB: 0, fullDate: '2025-11-05', date: '05', day: 'WED', time: '21:00', status: 'finished', matchday: 4 }
        ]
    }
];

export const youthHybridData: HybridTournament[] = [
    {
        id: 'instacash-schools-tournament',
        name: 'Instacash Schools Tournament',
        description: 'The national school football championship. Teams compete in regional group stages to qualify for the National Finals bracket.',
        logoUrl: 'https://via.placeholder.com/150/F59E0B/FFFFFF?text=Instacash',
        type: 'hybrid',
        categoryId: 'development',
        teams: [
            { name: 'Waterford Kamhlaba', crestUrl: 'https://via.placeholder.com/64/1E3A8A/FFFFFF?text=WK' },
            { name: 'Sifundzani High School', crestUrl: 'https://via.placeholder.com/64/D63031/FFFFFF?text=SHS' },
            { name: 'Mbabane Central High', crestUrl: 'https://via.placeholder.com/64/FBBF24/000000?text=MCH' },
            { name: 'Evelyn Baring High', crestUrl: 'https://via.placeholder.com/64/34D399/000000?text=EBH' },
            { name: 'Salesian High School', crestUrl: 'https://via.placeholder.com/64/6B7280/FFFFFF?text=SH' },
            { name: 'St. Francis High', crestUrl: 'https://via.placeholder.com/64/EF4444/FFFFFF?text=SFH' },
            { name: 'Manzini Nazarene High', crestUrl: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=MNH' },
            { name: 'St. Marks High', crestUrl: 'https://via.placeholder.com/64/14B8A6/FFFFFF?text=SMH' }
        ],
        groups: [
            { name: 'Hhohho Region', teamNames: ['Waterford Kamhlaba', 'Mbabane Central High', 'St. Marks High'] },
            { name: 'Manzini Region', teamNames: ['Sifundzani High School', 'Salesian High School', 'Manzini Nazarene High'] },
            { name: 'Southern Regions', teamNames: ['Evelyn Baring High', 'St. Francis High'] }
        ],
        matches: [
            { id: 'school-m1', teamA: 'Waterford Kamhlaba', teamB: 'Mbabane Central High', scoreA: 2, scoreB: 1, fullDate: '2025-10-10', date: '10', day: 'FRI', time: '14:00', status: 'finished', matchday: 1 }
        ],
        bracketId: 'instacash-schools-tournament'
    },
    {
        id: 'build-it-u13-national',
        name: 'Build It Under-13 National Final',
        description: 'The premier national festival for Under-13 talent. Featuring top regional academies in a two-pool group stage.',
        logoUrl: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Build+It',
        type: 'hybrid',
        categoryId: 'development',
        teams: [
            { name: 'Mbabane Future Stars', crestUrl: 'https://via.placeholder.com/64/1E3A8A/FFFFFF?text=FS' },
            { name: 'Manzini Youngsters', crestUrl: 'https://via.placeholder.com/64/D63031/FFFFFF?text=MY' },
            { name: 'Siteki Pros U-13', crestUrl: 'https://via.placeholder.com/64/3B82F6/FFFFFF?text=SP' },
            { name: 'Nhlangano Football Kids', crestUrl: 'https://via.placeholder.com/64/10B981/FFFFFF?text=NK' },
            { name: 'Eagles Nest Academy', crestUrl: 'https://via.placeholder.com/64/F59E0B/000000?text=EN' },
            { name: 'Simunye Colts', crestUrl: 'https://via.placeholder.com/64/6D28D9/FFFFFF?text=SC' }
        ],
        groups: [
            { name: 'Pool A', teamNames: ['Mbabane Future Stars', 'Siteki Pros U-13', 'Eagles Nest Academy'] },
            { name: 'Pool B', teamNames: ['Manzini Youngsters', 'Nhlangano Football Kids', 'Simunye Colts'] }
        ],
        matches: [
            { id: 'u13-m1', teamA: 'Mbabane Future Stars', teamB: 'Siteki Pros U-13', scoreA: 1, scoreB: 1, fullDate: '2025-11-20', date: '20', day: 'THU', time: '09:00', status: 'finished', matchday: 1 }
        ]
    }
];