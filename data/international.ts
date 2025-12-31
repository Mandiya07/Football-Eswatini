
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
    categoryId?: string; // Associated category (e.g., 'international-leagues', 'development')
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
        description: "The new 36-team League Phase format. Each club plays two opponents from each of the four pots for a total of 8 matches. Pot 1 includes holders PSG and the top seeds by coefficient.",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png',
        type: 'hybrid',
        categoryId: 'international-leagues',
        teams: [
            // Pot 1 (Top Seeds)
            { name: 'Paris Saint-Germain', crestUrl: 'https://via.placeholder.com/64/002B7F/FFFFFF?text=PSG' },
            { name: 'Real Madrid', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=RMA' },
            { name: 'Manchester City', crestUrl: 'https://via.placeholder.com/64/6CABDD/FFFFFF?text=MCI' },
            { name: 'Bayern München', crestUrl: 'https://via.placeholder.com/64/DC052D/FFFFFF?text=FCB' },
            { name: 'Liverpool', crestUrl: 'https://via.placeholder.com/64/C8102E/FFFFFF?text=LIV' },
            { name: 'Inter Milan', crestUrl: 'https://via.placeholder.com/64/0066B2/FFFFFF?text=INT' },
            { name: 'Chelsea', crestUrl: 'https://via.placeholder.com/64/034694/FFFFFF?text=CHE' },
            { name: 'Borussia Dortmund', crestUrl: 'https://via.placeholder.com/64/FDE100/000000?text=BVB' },
            { name: 'Barcelona', crestUrl: 'https://via.placeholder.com/64/A50044/FFFFFF?text=BAR' },
            // Pot 2
            { name: 'Arsenal', crestUrl: 'https://via.placeholder.com/64/EF0107/FFFFFF?text=ARS' },
            { name: 'Bayer Leverkusen', crestUrl: 'https://via.placeholder.com/64/E32221/000000?text=B04' },
            { name: 'Atlético Madrid', crestUrl: 'https://via.placeholder.com/64/CB3524/FFFFFF?text=ATM' },
            { name: 'Benfica', crestUrl: 'https://via.placeholder.com/64/E83030/FFFFFF?text=SLB' },
            { name: 'Atalanta', crestUrl: 'https://via.placeholder.com/64/1E71B8/000000?text=ATA' },
            { name: 'Villarreal', crestUrl: 'https://via.placeholder.com/64/FFE600/000000?text=VIL' },
            { name: 'Juventus', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=JUV' },
            { name: 'Eintracht Frankfurt', crestUrl: 'https://via.placeholder.com/64/E1000F/000000?text=SGE' },
            { name: 'Club Brugge', crestUrl: 'https://via.placeholder.com/64/003E7E/FFFFFF?text=CLU' },
            // Pot 3
            { name: 'Tottenham Hotspur', crestUrl: 'https://via.placeholder.com/64/132257/FFFFFF?text=TOT' },
            { name: 'PSV Eindhoven', crestUrl: 'https://via.placeholder.com/64/EF3333/FFFFFF?text=PSV' },
            { name: 'Ajax', crestUrl: 'https://via.placeholder.com/64/D2122E/FFFFFF?text=AJX' },
            { name: 'Napoli', crestUrl: 'https://via.placeholder.com/64/12A0D7/FFFFFF?text=NAP' },
            { name: 'Sporting CP', crestUrl: 'https://via.placeholder.com/64/008050/FFFFFF?text=SCP' },
            { name: 'Olympiacos', crestUrl: 'https://via.placeholder.com/64/E30613/FFFFFF?text=OLY' },
            { name: 'Slavia Praha', crestUrl: 'https://via.placeholder.com/64/D3010C/FFFFFF?text=SLA' },
            { name: 'Bodø/Glimt', crestUrl: 'https://via.placeholder.com/64/F6E000/000000?text=BOD' },
            { name: 'Marseille', crestUrl: 'https://via.placeholder.com/64/00ABEE/FFFFFF?text=OM' },
            // Pot 4
            { name: 'FC Copenhagen', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=FCK' },
            { name: 'AS Monaco', crestUrl: 'https://via.placeholder.com/64/E41B17/FFFFFF?text=ASM' },
            { name: 'Galatasaray', crestUrl: 'https://via.placeholder.com/64/A32638/FDB913?text=GAL' },
            { name: 'Union Saint-Gilloise', crestUrl: 'https://via.placeholder.com/64/FCE300/003399?text=USG' },
            { name: 'Qarabağ', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=QAR' },
            { name: 'Athletic Club', crestUrl: 'https://via.placeholder.com/64/EE1C25/FFFFFF?text=ATH' },
            { name: 'Newcastle United', crestUrl: 'https://via.placeholder.com/64/241F20/FFFFFF?text=NEW' },
            { name: 'Pafos FC', crestUrl: 'https://via.placeholder.com/64/005CAB/FFFFFF?text=PAF' },
            { name: 'Kairat Almaty', crestUrl: 'https://via.placeholder.com/64/FDB913/000000?text=KAI' }
        ],
        groups: [
            { 
                name: '🔴 Pot 1 (Top Seeds)', 
                teamNames: ['Paris Saint-Germain', 'Real Madrid', 'Manchester City', 'Bayern München', 'Liverpool', 'Inter Milan', 'Chelsea', 'Borussia Dortmund', 'Barcelona'] 
            },
            { 
                name: '🟡 Pot 2', 
                teamNames: ['Arsenal', 'Bayer Leverkusen', 'Atlético Madrid', 'Benfica', 'Atalanta', 'Villarreal', 'Juventus', 'Eintracht Frankfurt', 'Club Brugge'] 
            },
            { 
                name: '🟢 Pot 3', 
                teamNames: ['Tottenham Hotspur', 'PSV Eindhoven', 'Ajax', 'Napoli', 'Sporting CP', 'Olympiacos', 'Slavia Praha', 'Bodø/Glimt', 'Marseille'] 
            },
            { 
                name: '🔵 Pot 4', 
                teamNames: ['FC Copenhagen', 'AS Monaco', 'Galatasaray', 'Union Saint-Gilloise', 'Qarabağ', 'Athletic Club', 'Newcastle United', 'Pafos FC', 'Kairat Almaty'] 
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
    },
    {
        id: 'hub-hardware-u17-competition',
        name: 'Hub Hardware Under-17 Competition',
        description: 'Organized under the Hhohho Regional Football Association. Identifying raw talent at the regional level through zonal competition.',
        logoUrl: 'https://via.placeholder.com/150/FFFF00/000000?text=Hub+U17',
        type: 'hybrid',
        categoryId: 'development',
        teams: [
            { name: 'Hhohho Eagles U-17', crestUrl: 'https://via.placeholder.com/64/00008B/FFFFFF?text=HE' },
            { name: 'Lubombo Leopards U-17', crestUrl: 'https://via.placeholder.com/64/90EE90/000000?text=LL' },
            { name: 'Manzini Dynamos U-17', crestUrl: 'https://via.placeholder.com/64/FFA500/000000?text=MD' },
            { name: 'Shiselweni Saints U-17', crestUrl: 'https://via.placeholder.com/64/8A2BE2/FFFFFF?text=SS' },
            { name: 'Ezulwini United U-17', crestUrl: 'https://via.placeholder.com/64/4B0082/FFFFFF?text=EU' },
            { name: 'Big Bend Vipers U-17', crestUrl: 'https://via.placeholder.com/64/22C55E/FFFFFF?text=BV' }
        ],
        groups: [
            { name: 'Northern Zone', teamNames: ['Hhohho Eagles U-17', 'Ezulwini United U-17'] },
            { name: 'Zonal Qualifiers', teamNames: ['Lubombo Leopards U-17', 'Manzini Dynamos U-17', 'Shiselweni Saints U-17', 'Big Bend Vipers U-17'] }
        ],
        matches: []
    }
];
