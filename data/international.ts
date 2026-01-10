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
        id: 'uefa-champions-league',
        name: 'UEFA Champions League 2025-26',
        description: "The revolutionary 36-team league phase. No more groups—just one giant table. Teams ranked 1-8 go directly to the Round of 16, while 9-24 enter a high-stakes knockout play-off.",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png',
        type: 'hybrid',
        categoryId: 'international-leagues',
        teams: [
            // Pot 1
            { name: 'Manchester City', crestUrl: 'https://via.placeholder.com/64/6CABDD/FFFFFF?text=MCI' },
            { name: 'Bayern München', crestUrl: 'https://via.placeholder.com/64/DC052D/FFFFFF?text=FCB' },
            { name: 'Real Madrid', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=RMA' },
            { name: 'Paris Saint-Germain', crestUrl: 'https://via.placeholder.com/64/002B7F/FFFFFF?text=PSG' },
            { name: 'Liverpool', crestUrl: 'https://via.placeholder.com/64/C8102E/FFFFFF?text=LIV' },
            { name: 'Inter Milan', crestUrl: 'https://via.placeholder.com/64/0066B2/FFFFFF?text=INT' },
            { name: 'Borussia Dortmund', crestUrl: 'https://via.placeholder.com/64/FDE100/000000?text=BVB' },
            { name: 'RB Leipzig', crestUrl: 'https://via.placeholder.com/64/DD013F/FFFFFF?text=RBL' },
            { name: 'Barcelona', crestUrl: 'https://via.placeholder.com/64/A50044/FFFFFF?text=BAR' },
            // Pot 2
            { name: 'Bayer Leverkusen', crestUrl: 'https://via.placeholder.com/64/E32221/000000?text=B04' },
            { name: 'Atlético Madrid', crestUrl: 'https://via.placeholder.com/64/CB3524/FFFFFF?text=ATM' },
            { name: 'Atalanta', crestUrl: 'https://via.placeholder.com/64/1E71B8/000000?text=ATA' },
            { name: 'Juventus', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=JUV' },
            { name: 'Benfica', crestUrl: 'https://via.placeholder.com/64/E83030/FFFFFF?text=SLB' },
            { name: 'Arsenal', crestUrl: 'https://via.placeholder.com/64/EF0107/FFFFFF?text=ARS' },
            { name: 'Club Brugge', crestUrl: 'https://via.placeholder.com/64/003E7E/FFFFFF?text=CLU' },
            { name: 'Shakhtar Donetsk', crestUrl: 'https://via.placeholder.com/64/FF6600/000000?text=SHA' },
            { name: 'AC Milan', crestUrl: 'https://via.placeholder.com/64/FB090B/000000?text=ACM' },
            // Pot 3
            { name: 'Feyenoord', crestUrl: 'https://via.placeholder.com/64/ED1C24/FFFFFF?text=FEY' },
            { name: 'Sporting CP', crestUrl: 'https://via.placeholder.com/64/008050/FFFFFF?text=SCP' },
            { name: 'PSV Eindhoven', crestUrl: 'https://via.placeholder.com/64/EF3333/FFFFFF?text=PSV' },
            { name: 'GNK Dinamo', crestUrl: 'https://via.placeholder.com/64/004DA0/FFFFFF?text=DIN' },
            { name: 'RB Salzburg', crestUrl: 'https://via.placeholder.com/64/DD013F/FFFFFF?text=RBS' },
            { name: 'Lille OSC', crestUrl: 'https://via.placeholder.com/64/E01E2E/FFFFFF?text=LOSC' },
            { name: 'Crvena Zvezda', crestUrl: 'https://via.placeholder.com/64/E1000F/FFFFFF?text=CZV' },
            { name: 'Young Boys', crestUrl: 'https://via.placeholder.com/64/FEE000/000000?text=YB' },
            { name: 'Celtic', crestUrl: 'https://via.placeholder.com/64/018749/FFFFFF?text=CEL' },
            // Pot 4
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
        matches: []
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
        matches: [],
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
        matches: []
    }
];