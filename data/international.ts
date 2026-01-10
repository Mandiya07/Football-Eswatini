
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
    },
    {
        id: 'afcon-2025',
        name: 'Africa Cup of Nations 2025',
        description: "The 35th edition of the biennial African association football tournament. Morocco hosts the continent's finest in a thrilling group stage battle for continental dominance.",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/00/2023_Africa_Cup_of_Nations_logo.svg/1200px-2023_Africa_Cup_of_Nations_logo.svg.png',
        type: 'hybrid',
        categoryId: 'international-leagues',
        teams: [
            { name: 'Morocco', crestUrl: 'https://via.placeholder.com/64/C1272D/FFFFFF?text=MAR' },
            { name: 'Mali', crestUrl: 'https://via.placeholder.com/64/FDE100/000000?text=MLI' },
            { name: 'Zambia', crestUrl: 'https://via.placeholder.com/64/006633/FFFFFF?text=ZAM' },
            { name: 'Comoros', crestUrl: 'https://via.placeholder.com/64/009543/FFFFFF?text=COM' },
            { name: 'Egypt', crestUrl: 'https://via.placeholder.com/64/C1272D/FFFFFF?text=EGY' },
            { name: 'South Africa', crestUrl: 'https://via.placeholder.com/64/006633/FFFFFF?text=RSA' },
            { name: 'Angola', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=ANG' },
            { name: 'Zimbabwe', crestUrl: 'https://via.placeholder.com/64/006633/FFFFFF?text=ZIM' },
            { name: 'Nigeria', crestUrl: 'https://via.placeholder.com/64/008751/FFFFFF?text=NGA' },
            { name: 'Tunisia', crestUrl: 'https://via.placeholder.com/64/E70013/FFFFFF?text=TUN' },
            { name: 'Uganda', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=UGA' },
            { name: 'Tanzania', crestUrl: 'https://via.placeholder.com/64/1EB53A/FFFFFF?text=TAN' },
            { name: 'Senegal', crestUrl: 'https://via.placeholder.com/64/00853F/FFFFFF?text=SEN' },
            { name: 'DR Congo', crestUrl: 'https://via.placeholder.com/64/007FFF/FFFFFF?text=DRC' },
            { name: 'Benin', crestUrl: 'https://via.placeholder.com/64/E1000F/000000?text=BEN' },
            { name: 'Botswana', crestUrl: 'https://via.placeholder.com/64/75AADB/FFFFFF?text=BOT' },
            { name: 'Algeria', crestUrl: 'https://via.placeholder.com/64/006233/FFFFFF?text=ALG' },
            { name: 'Burkina Faso', crestUrl: 'https://via.placeholder.com/64/EF2B2D/FFFFFF?text=BFA' },
            { name: 'Equatorial Guinea', crestUrl: 'https://via.placeholder.com/64/E1000F/FFFFFF?text=EQG' },
            { name: 'Sudan', crestUrl: 'https://via.placeholder.com/64/D21034/FFFFFF?text=SUD' },
            { name: 'Ivory Coast', crestUrl: 'https://via.placeholder.com/64/FF8200/FFFFFF?text=CIV' },
            { name: 'Cameroon', crestUrl: 'https://via.placeholder.com/64/007A5E/FFFFFF?text=CMR' },
            { name: 'Gabon', crestUrl: 'https://via.placeholder.com/64/313292/FFFFFF?text=GAB' },
            { name: 'Mozambique', crestUrl: 'https://via.placeholder.com/64/D21034/FFFFFF?text=MOZ' }
        ],
        groups: [
            { name: 'GROUP A', teamNames: ['Morocco', 'Mali', 'Zambia', 'Comoros'] },
            { name: 'GROUP B', teamNames: ['Egypt', 'South Africa', 'Angola', 'Zimbabwe'] },
            { name: 'GROUP C', teamNames: ['Nigeria', 'Tunisia', 'Uganda', 'Tanzania'] },
            { name: 'GROUP D', teamNames: ['Senegal', 'DR Congo', 'Benin', 'Botswana'] },
            { name: 'GROUP E', teamNames: ['Algeria', 'Burkina Faso', 'Equatorial Guinea', 'Sudan'] },
            { name: 'GROUP F', teamNames: ['Ivory Coast', 'Cameroon', 'Gabon', 'Mozambique'] }
        ],
        matches: [
            // GROUP A
            { id: 'afcon-a1', teamA: 'Morocco', teamB: 'Comoros', scoreA: 2, scoreB: 0, fullDate: '2025-12-21', date: '21', day: 'SUN', time: '15:00', status: 'finished' },
            { id: 'afcon-a2', teamA: 'Mali', teamB: 'Zambia', scoreA: 1, scoreB: 1, fullDate: '2025-12-22', date: '22', day: 'MON', time: '15:00', status: 'finished' },
            { id: 'afcon-a3', teamA: 'Morocco', teamB: 'Mali', scoreA: 1, scoreB: 1, fullDate: '2025-12-26', date: '26', day: 'FRI', time: '15:00', status: 'finished' },
            { id: 'afcon-a4', teamA: 'Zambia', teamB: 'Comoros', scoreA: 0, scoreB: 0, fullDate: '2025-12-26', date: '26', day: 'FRI', time: '18:00', status: 'finished' },
            { id: 'afcon-a5', teamA: 'Zambia', teamB: 'Morocco', scoreA: 0, scoreB: 3, fullDate: '2025-12-29', date: '29', day: 'MON', time: '15:00', status: 'finished' },
            { id: 'afcon-a6', teamA: 'Comoros', teamB: 'Mali', scoreA: 0, scoreB: 0, fullDate: '2025-12-29', date: '29', day: 'MON', time: '18:00', status: 'finished' },
            
            // GROUP B
            { id: 'afcon-b1', teamA: 'Egypt', teamB: 'Zimbabwe', scoreA: 2, scoreB: 1, fullDate: '2025-12-22', date: '22', day: 'MON', time: '18:00', status: 'finished' },
            { id: 'afcon-b2', teamA: 'South Africa', teamB: 'Angola', scoreA: 2, scoreB: 1, fullDate: '2025-12-22', date: '22', day: 'MON', time: '21:00', status: 'finished' },
            { id: 'afcon-b3', teamA: 'Egypt', teamB: 'South Africa', scoreA: 1, scoreB: 0, fullDate: '2025-12-26', date: '26', day: 'FRI', time: '21:00', status: 'finished' },
            { id: 'afcon-b4', teamA: 'Angola', teamB: 'Zimbabwe', scoreA: 1, scoreB: 1, fullDate: '2025-12-26', date: '26', day: 'FRI', time: '15:00', status: 'finished' },
            { id: 'afcon-b5', teamA: 'Angola', teamB: 'Egypt', scoreA: 0, scoreB: 0, fullDate: '2025-12-29', date: '29', day: 'MON', time: '21:00', status: 'finished' },
            { id: 'afcon-b6', teamA: 'Zimbabwe', teamB: 'South Africa', scoreA: 2, scoreB: 3, fullDate: '2025-12-29', date: '29', day: 'MON', time: '21:00', status: 'finished' },
            
            // GROUP C
            { id: 'afcon-c1', teamA: 'Nigeria', teamB: 'Tanzania', scoreA: 2, scoreB: 1, fullDate: '2025-12-23', date: '23', day: 'TUE', time: '15:00', status: 'finished' },
            { id: 'afcon-c2', teamA: 'Tunisia', teamB: 'Uganda', scoreA: 3, scoreB: 1, fullDate: '2025-12-23', date: '23', day: 'TUE', time: '18:00', status: 'finished' },
            { id: 'afcon-c3', teamA: 'Nigeria', teamB: 'Tunisia', scoreA: 3, scoreB: 2, fullDate: '2025-12-27', date: '27', day: 'SAT', time: '15:00', status: 'finished' },
            { id: 'afcon-c4', teamA: 'Uganda', teamB: 'Tanzania', scoreA: 1, scoreB: 1, fullDate: '2025-12-27', date: '27', day: 'SAT', time: '18:00', status: 'finished' },
            { id: 'afcon-c5', teamA: 'Uganda', teamB: 'Nigeria', scoreA: 1, scoreB: 3, fullDate: '2025-12-30', date: '30', day: 'TUE', time: '15:00', status: 'finished' },
            { id: 'afcon-c6', teamA: 'Tanzania', teamB: 'Tunisia', scoreA: 1, scoreB: 1, fullDate: '2025-12-30', date: '30', day: 'TUE', time: '18:00', status: 'finished' },
            
            // GROUP D
            { id: 'afcon-d1', teamA: 'Senegal', teamB: 'Botswana', scoreA: 3, scoreB: 0, fullDate: '2025-12-23', date: '23', day: 'TUE', time: '21:00', status: 'finished' },
            { id: 'afcon-d2', teamA: 'DR Congo', teamB: 'Benin', scoreA: 1, scoreB: 0, fullDate: '2025-12-23', date: '23', day: 'TUE', time: '15:00', status: 'finished' },
            { id: 'afcon-d3', teamA: 'Senegal', teamB: 'DR Congo', scoreA: 1, scoreB: 1, fullDate: '2025-12-27', date: '27', day: 'SAT', time: '21:00', status: 'finished' },
            { id: 'afcon-d4', teamA: 'Benin', teamB: 'Botswana', scoreA: 1, scoreB: 0, fullDate: '2025-12-27', date: '27', day: 'SAT', time: '15:00', status: 'finished' },
            { id: 'afcon-d5', teamA: 'Benin', teamB: 'Senegal', scoreA: 0, scoreB: 3, fullDate: '2025-12-30', date: '30', day: 'TUE', time: '21:00', status: 'finished' },
            { id: 'afcon-d6', teamA: 'Botswana', teamB: 'DR Congo', scoreA: 0, scoreB: 3, fullDate: '2025-12-30', date: '30', day: 'TUE', time: '21:00', status: 'finished' },
            
            // GROUP E
            { id: 'afcon-e1', teamA: 'Algeria', teamB: 'Sudan', scoreA: 3, scoreB: 0, fullDate: '2025-12-24', date: '24', day: 'WED', time: '15:00', status: 'finished' },
            { id: 'afcon-e2', teamA: 'Burkina Faso', teamB: 'Equatorial Guinea', scoreA: 2, scoreB: 1, fullDate: '2025-12-24', date: '24', day: 'WED', time: '18:00', status: 'finished' },
            { id: 'afcon-e3', teamA: 'Algeria', teamB: 'Burkina Faso', scoreA: 1, scoreB: 0, fullDate: '2025-12-28', date: '28', day: 'SUN', time: '15:00', status: 'finished' },
            { id: 'afcon-e4', teamA: 'Equatorial Guinea', teamB: 'Sudan', scoreA: 0, scoreB: 1, fullDate: '2025-12-28', date: '28', day: 'SUN', time: '18:00', status: 'finished' },
            { id: 'afcon-e5', teamA: 'Equatorial Guinea', teamB: 'Algeria', scoreA: 1, scoreB: 3, fullDate: '2025-12-31', date: '31', day: 'WED', time: '15:00', status: 'finished' },
            { id: 'afcon-e6', teamA: 'Sudan', teamB: 'Burkina Faso', scoreA: 0, scoreB: 2, fullDate: '2025-12-31', date: '31', day: 'WED', time: '18:00', status: 'finished' },
            
            // GROUP F
            { id: 'afcon-f1', teamA: 'Ivory Coast', teamB: 'Mozambique', scoreA: 1, scoreB: 0, fullDate: '2025-12-24', date: '24', day: 'WED', time: '21:00', status: 'finished' },
            { id: 'afcon-f2', teamA: 'Cameroon', teamB: 'Gabon', scoreA: 1, scoreB: 0, fullDate: '2025-12-24', date: '24', day: 'WED', time: '21:00', status: 'finished' },
            { id: 'afcon-f3', teamA: 'Ivory Coast', teamB: 'Cameroon', scoreA: 1, scoreB: 1, fullDate: '2025-12-28', date: '28', day: 'SUN', time: '21:00', status: 'finished' },
            { id: 'afcon-f4', teamA: 'Gabon', teamB: 'Mozambique', scoreA: 2, scoreB: 3, fullDate: '2025-12-28', date: '28', day: 'SUN', time: '15:00', status: 'finished' },
            { id: 'afcon-f5', teamA: 'Gabon', teamB: 'Ivory Coast', scoreA: 2, scoreB: 3, fullDate: '2025-12-31', date: '31', day: 'WED', time: '21:00', status: 'finished' },
            { id: 'afcon-f6', teamA: 'Mozambique', teamB: 'Cameroon', scoreA: 1, scoreB: 2, fullDate: '2025-12-31', date: '31', day: 'WED', time: '21:00', status: 'finished' }
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
