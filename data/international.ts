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
        description: "The premier club competition for European football. Featuring the new 36-team League Phase where clubs compete in a single league table for qualification to the knockout stages.",
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png',
        type: 'hybrid',
        teams: [
            // Pot 1
            { name: 'Paris Saint-Germain', crestUrl: 'https://via.placeholder.com/64/002B7F/FFFFFF?text=PSG' },
            { name: 'Real Madrid', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=RMA' },
            { name: 'Manchester City', crestUrl: 'https://via.placeholder.com/64/6CABDD/FFFFFF?text=MCI' },
            { name: 'Bayern München', crestUrl: 'https://via.placeholder.com/64/DC052D/FFFFFF?text=FCB' },
            { name: 'Liverpool', crestUrl: 'https://via.placeholder.com/64/C8102E/FFFFFF?text=LIV' },
            { name: 'Inter Milan', crestUrl: 'https://via.placeholder.com/64/0066B2/FFFFFF?text=INT' },
            { name: 'Chelsea', crestUrl: 'https://via.placeholder.com/64/034694/FFFFFF?text=CHE' },
            { name: 'Borussia Dortmund', crestUrl: 'https://via.placeholder.com/64/FDE100/000000?text=BVB' },
            { name: 'Barcelona', crestUrl: 'https://via.placeholder.com/64/A50044/FFFFFF?text=FCB' },
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
        matches: [
            // MATCHDAY 1
            { id: 'ucl-md1-1', teamA: 'PSV Eindhoven', teamB: 'Union Saint-Gilloise', status: 'finished', scoreA: 1, scoreB: 3, fullDate: '2025-09-16', date: '16', day: 'TUE', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-2', teamA: 'Athletic Club', teamB: 'Arsenal', status: 'finished', scoreA: 0, scoreB: 2, fullDate: '2025-09-16', date: '16', day: 'TUE', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-3', teamA: 'Juventus', teamB: 'Borussia Dortmund', status: 'finished', scoreA: 4, scoreB: 4, fullDate: '2025-09-16', date: '16', day: 'TUE', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-4', teamA: 'Benfica', teamB: 'Qarabağ', status: 'finished', scoreA: 2, scoreB: 3, fullDate: '2025-09-16', date: '16', day: 'TUE', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-5', teamA: 'Tottenham Hotspur', teamB: 'Villarreal', status: 'finished', scoreA: 1, scoreB: 0, fullDate: '2025-09-16', date: '16', day: 'TUE', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-6', teamA: 'Real Madrid', teamB: 'Marseille', status: 'finished', scoreA: 2, scoreB: 1, fullDate: '2025-09-17', date: '17', day: 'WED', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-7', teamA: 'Olympiacos', teamB: 'Pafos FC', status: 'finished', scoreA: 0, scoreB: 0, fullDate: '2025-09-17', date: '17', day: 'WED', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-8', teamA: 'Slavia Praha', teamB: 'Bodø/Glimt', status: 'finished', scoreA: 2, scoreB: 2, fullDate: '2025-09-17', date: '17', day: 'WED', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-9', teamA: 'Bayern München', teamB: 'Chelsea', status: 'finished', scoreA: 3, scoreB: 1, fullDate: '2025-09-17', date: '17', day: 'WED', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-10', teamA: 'Paris Saint-Germain', teamB: 'Atalanta', status: 'finished', scoreA: 4, scoreB: 0, fullDate: '2025-09-17', date: '17', day: 'WED', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-11', teamA: 'Ajax', teamB: 'Inter Milan', status: 'finished', scoreA: 0, scoreB: 2, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-12', teamA: 'Liverpool', teamB: 'Atlético Madrid', status: 'finished', scoreA: 3, scoreB: 2, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-13', teamA: 'FC Copenhagen', teamB: 'Bayer Leverkusen', status: 'finished', scoreA: 2, scoreB: 2, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-14', teamA: 'Club Brugge', teamB: 'AS Monaco', status: 'finished', scoreA: 4, scoreB: 1, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-15', teamA: 'Eintracht Frankfurt', teamB: 'Galatasaray', status: 'finished', scoreA: 5, scoreB: 1, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-16', teamA: 'Sporting CP', teamB: 'Kairat Almaty', status: 'finished', scoreA: 4, scoreB: 1, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-17', teamA: 'Newcastle United', teamB: 'Barcelona', status: 'finished', scoreA: 1, scoreB: 2, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            { id: 'ucl-md1-18', teamA: 'Manchester City', teamB: 'Napoli', status: 'finished', scoreA: 2, scoreB: 0, fullDate: '2025-09-18', date: '18', day: 'THU', time: '21:00', matchday: 1 },
            // MATCHDAY 2
            { id: 'ucl-md2-1', teamA: 'Kairat Almaty', teamB: 'Real Madrid', status: 'finished', scoreA: 0, scoreB: 5, fullDate: '2025-09-30', date: '30', day: 'TUE', time: '21:00', matchday: 2 },
            { id: 'ucl-md2-2', teamA: 'Atalanta', teamB: 'Club Brugge', status: 'finished', scoreA: 2, scoreB: 1, fullDate: '2025-10-01', date: '01', day: 'WED', time: '21:00', matchday: 2 },
            // MATCHDAY 3
            { id: 'ucl-md3-1', teamA: 'Arsenal', teamB: 'Atlético Madrid', status: 'finished', scoreA: 4, scoreB: 0, fullDate: '2025-10-21', date: '21', day: 'TUE', time: '21:00', matchday: 3 },
            { id: 'ucl-md3-2', teamA: 'Chelsea', teamB: 'Ajax', status: 'finished', scoreA: 5, scoreB: 1, fullDate: '2025-10-22', date: '22', day: 'WED', time: '21:00', matchday: 3 },
            // MATCHDAY 4
            { id: 'ucl-md4-1', teamA: 'Slavia Praha', teamB: 'Arsenal', status: 'finished', scoreA: 0, scoreB: 3, fullDate: '2025-11-04', date: '04', day: 'TUE', time: '21:00', matchday: 4 },
            { id: 'ucl-md4-2', teamA: 'Ajax', teamB: 'Galatasaray', status: 'finished', scoreA: 0, scoreB: 3, fullDate: '2025-11-05', date: '05', day: 'WED', time: '21:00', matchday: 4 },
            // MATCHDAY 5
            { id: 'ucl-md5-1', teamA: 'FC Copenhagen', teamB: 'Kairat Almaty', status: 'finished', scoreA: 3, scoreB: 2, fullDate: '2025-11-25', date: '25', day: 'TUE', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-2', teamA: 'Pafos FC', teamB: 'AS Monaco', status: 'finished', scoreA: 2, scoreB: 2, fullDate: '2025-11-25', date: '25', day: 'TUE', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-3', teamA: 'Arsenal', teamB: 'Bayern München', status: 'finished', scoreA: 3, scoreB: 1, fullDate: '2025-11-25', date: '25', day: 'TUE', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-4', teamA: 'Atlético Madrid', teamB: 'Inter Milan', status: 'finished', scoreA: 2, scoreB: 1, fullDate: '2025-11-25', date: '25', day: 'TUE', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-5', teamA: 'Eintracht Frankfurt', teamB: 'Atalanta', status: 'finished', scoreA: 0, scoreB: 3, fullDate: '2025-11-26', date: '26', day: 'WED', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-6', teamA: 'Liverpool', teamB: 'PSV Eindhoven', status: 'finished', scoreA: 1, scoreB: 4, fullDate: '2025-11-26', date: '26', day: 'WED', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-7', teamA: 'Olympiacos', teamB: 'Real Madrid', status: 'finished', scoreA: 3, scoreB: 4, fullDate: '2025-11-26', date: '26', day: 'WED', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-8', teamA: 'Paris Saint-Germain', teamB: 'Tottenham Hotspur', status: 'finished', scoreA: 5, scoreB: 3, fullDate: '2025-11-26', date: '26', day: 'WED', time: '21:00', matchday: 5 },
            { id: 'ucl-md5-9', teamA: 'Sporting CP', teamB: 'Club Brugge', status: 'finished', scoreA: 3, scoreB: 0, fullDate: '2025-11-26', date: '26', day: 'WED', time: '21:00', matchday: 5 },
            // MATCHDAY 6
            { id: 'ucl-md6-1', teamA: 'Barcelona', teamB: 'Eintracht Frankfurt', status: 'finished', scoreA: 2, scoreB: 1, fullDate: '2025-12-09', date: '09', day: 'TUE', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-2', teamA: 'Inter Milan', teamB: 'Liverpool', status: 'finished', scoreA: 0, scoreB: 1, fullDate: '2025-12-09', date: '09', day: 'TUE', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-3', teamA: 'Kairat Almaty', teamB: 'Olympiacos', status: 'finished', scoreA: 0, scoreB: 1, fullDate: '2025-12-09', date: '09', day: 'TUE', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-4', teamA: 'Bayern München', teamB: 'Sporting CP', status: 'finished', scoreA: 3, scoreB: 1, fullDate: '2025-12-09', date: '09', day: 'TUE', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-5', teamA: 'Atalanta', teamB: 'Chelsea', status: 'finished', scoreA: 2, scoreB: 1, fullDate: '2025-12-10', date: '10', day: 'WED', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-6', teamA: 'AS Monaco', teamB: 'Galatasaray', status: 'finished', scoreA: 1, scoreB: 0, fullDate: '2025-12-10', date: '10', day: 'WED', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-7', teamA: 'Union Saint-Gilloise', teamB: 'Marseille', status: 'finished', scoreA: 2, scoreB: 3, fullDate: '2025-12-10', date: '10', day: 'WED', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-8', teamA: 'PSV Eindhoven', teamB: 'Atlético Madrid', status: 'finished', scoreA: 2, scoreB: 3, fullDate: '2025-12-10', date: '10', day: 'WED', time: '21:00', matchday: 6 },
            { id: 'ucl-md6-9', teamA: 'Tottenham Hotspur', teamB: 'Slavia Praha', status: 'finished', scoreA: 3, scoreB: 0, fullDate: '2025-12-10', date: '10', day: 'WED', time: '21:00', matchday: 6 },
            // MATCHDAY 7 (Upcoming)
            { id: 'ucl-md7-1', teamA: 'Inter Milan', teamB: 'Arsenal', status: 'scheduled', fullDate: '2026-01-20', date: '20', day: 'TUE', time: '21:00', matchday: 7 },
            { id: 'ucl-md7-2', teamA: 'Villarreal', teamB: 'Ajax', status: 'scheduled', fullDate: '2026-01-20', date: '20', day: 'TUE', time: '21:00', matchday: 7 },
            // MATCHDAY 8 (Upcoming)
            { id: 'ucl-md8-1', teamA: 'Ajax', teamB: 'Olympiacos', status: 'scheduled', fullDate: '2026-01-28', date: '28', day: 'WED', time: '21:00', matchday: 8 },
            { id: 'ucl-md8-2', teamA: 'Arsenal', teamB: 'Kairat Almaty', status: 'scheduled', fullDate: '2026-01-28', date: '28', day: 'WED', time: '21:00', matchday: 8 }
        ]
    }
];
