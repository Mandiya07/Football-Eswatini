
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
        name: 'UEFA Champions League 2025-26',
        description: "The premier club competition for European football. Featuring the new 36-team League Phase where clubs compete in a single league table for qualification to the knockout stages. Each club plays 8 matches against 8 different opponents (two from each of the four pots).",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png',
        type: 'hybrid',
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
                name: 'League Phase', 
                teamNames: [
                    'Paris Saint-Germain', 'Real Madrid', 'Manchester City', 'Bayern München', 'Liverpool', 'Inter Milan', 'Chelsea', 'Borussia Dortmund', 'Barcelona',
                    'Arsenal', 'Bayer Leverkusen', 'Atlético Madrid', 'Benfica', 'Atalanta', 'Villarreal', 'Juventus', 'Eintracht Frankfurt', 'Club Brugge',
                    'Tottenham Hotspur', 'PSV Eindhoven', 'Ajax', 'Napoli', 'Sporting CP', 'Olympiacos', 'Slavia Praha', 'Bodø/Glimt', 'Marseille',
                    'FC Copenhagen', 'AS Monaco', 'Galatasaray', 'Union Saint-Gilloise', 'Qarabağ', 'Athletic Club', 'Newcastle United', 'Pafos FC', 'Kairat Almaty'
                ] 
            }
        ],
        matches: []
    }
];
