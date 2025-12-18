import { Tournament } from "./cups";
import { Team, CompetitionFixture } from "./teams";

// Define a simplified team structure for configuration within a tournament file
export interface ConfigTeam {
    name: string;
    crestUrl: string;
    // Optional: map to existing ID if they are in the database
    dbId?: number; 
}

export interface HybridTournament {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    type: 'hybrid';
    
    // Teams configuration (source of truth for this tournament's specific teams)
    teams: ConfigTeam[];

    // Structure
    groups?: {
        name: string; // "Group A"
        teamNames: string[]; // List of team names in this group
    }[];
    
    // Matches (All matches: group + knockout)
    matches: CompetitionFixture[];
    
    // Knockout Bracket Data
    bracket?: Tournament;
    bracketId?: string; // ID for linking to cups collection in Firestore
}

export const internationalData: HybridTournament[] = [
    {
        id: 'caf-champions-league',
        name: 'CAF Champions League 2025-26',
        description: "Africa's premier club football tournament. The best clubs across the continent compete for the ultimate trophy and a spot in the FIFA Club World Cup.",
        logoUrl: 'https://via.placeholder.com/150/FF8C00/000000?text=CAF+CL',
        type: 'hybrid',
        teams: [
            // Group A
            { name: 'RS Berkane', crestUrl: 'https://via.placeholder.com/64/FFA500/000000?text=RSB' },
            { name: 'Pyramids FC', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=PFC' },
            { name: 'Rivers United FC', crestUrl: 'https://via.placeholder.com/64/00008B/FFFFFF?text=RUFC' },
            { name: 'Power Dynamos', crestUrl: 'https://via.placeholder.com/64/FFFF00/000000?text=PDFC' },
            // Group B
            { name: 'Al Ahly FC', crestUrl: 'https://via.placeholder.com/64/D22730/FFFFFF?text=Ahly' },
            { name: 'Young Africans', crestUrl: 'https://via.placeholder.com/64/228B22/FFFF00?text=Yanga' },
            { name: 'AS FAR', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=ASFAR' },
            { name: 'JS Kabylie', crestUrl: 'https://via.placeholder.com/64/FFFF00/008000?text=JSK' },
            // Group C
            { name: 'Mamelodi Sundowns', crestUrl: 'https://via.placeholder.com/64/FDB913/006400?text=MSFC' },
            { name: 'Al Hilal SC', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=Hilal' },
            { name: 'MC Alger', crestUrl: 'https://via.placeholder.com/64/008000/FF0000?text=MCA' },
            { name: 'St Éloi Lupopo', crestUrl: 'https://via.placeholder.com/64/FFFF00/0000FF?text=SEL' },
            // Group D
            { name: 'Espérance de Tunis', crestUrl: 'https://via.placeholder.com/64/FF4500/FFFF00?text=EST' },
            { name: 'Simba SC', crestUrl: 'https://via.placeholder.com/64/800000/FFFFFF?text=SSC' },
            { name: 'Petro de Luanda', crestUrl: 'https://via.placeholder.com/64/FFD700/0000CD?text=APL' },
            { name: 'Stade Malién', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=SBM' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['RS Berkane', 'Pyramids FC', 'Rivers United FC', 'Power Dynamos'] },
            { name: 'Group B', teamNames: ['Al Ahly FC', 'Young Africans', 'AS FAR', 'JS Kabylie'] },
            { name: 'Group C', teamNames: ['Mamelodi Sundowns', 'Al Hilal SC', 'MC Alger', 'St Éloi Lupopo'] },
            { name: 'Group D', teamNames: ['Espérance de Tunis', 'Simba SC', 'Petro de Luanda', 'Stade Malién'] }
        ],
        matches: [
            // Matchday 1
            { id: 101, teamA: 'RS Berkane', teamB: 'Power Dynamos', scoreA: 3, scoreB: 0, status: 'finished', fullDate: '2025-11-21', date: '21', day: 'FRI', time: '18:00', matchday: 1 },
            { id: 102, teamA: 'Pyramids FC', teamB: 'Rivers United FC', scoreA: 3, scoreB: 0, status: 'finished', fullDate: '2025-11-21', date: '21', day: 'FRI', time: '21:00', matchday: 1 },
            { id: 103, teamA: 'Al Ahly FC', teamB: 'JS Kabylie', scoreA: 4, scoreB: 1, status: 'finished', fullDate: '2025-11-22', date: '22', day: 'SAT', time: '18:00', matchday: 1 },
            { id: 104, teamA: 'Young Africans', teamB: 'AS FAR', scoreA: 1, scoreB: 0, status: 'finished', fullDate: '2025-11-22', date: '22', day: 'SAT', time: '21:00', matchday: 1 },
            { id: 105, teamA: 'Mamelodi Sundowns', teamB: 'St Éloi Lupopo', scoreA: 3, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '15:00', matchday: 1 },
            { id: 106, teamA: 'Al Hilal SC', teamB: 'MC Alger', scoreA: 2, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '18:00', matchday: 1 },
            { id: 107, teamA: 'Espérance de Tunis', teamB: 'Stade Malién', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '21:00', matchday: 1 },
            { id: 108, teamA: 'Simba SC', teamB: 'Petro de Luanda', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '15:00', matchday: 1 },
            // Matchday 2
            { id: 109, teamA: 'Rivers United FC', teamB: 'RS Berkane', scoreA: 1, scoreB: 2, status: 'finished', fullDate: '2025-11-28', date: '28', day: 'FRI', time: '15:00', matchday: 2 },
            { id: 110, teamA: 'Power Dynamos', teamB: 'Pyramids FC', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-28', date: '28', day: 'FRI', time: '18:00', matchday: 2 },
            { id: 111, teamA: 'JS Kabylie', teamB: 'Young Africans', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2025-11-29', date: '29', day: 'SAT', time: '18:00', matchday: 2 },
            { id: 112, teamA: 'AS FAR', teamB: 'Al Ahly FC', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-29', date: '29', day: 'SAT', time: '21:00', matchday: 2 },
            { id: 113, teamA: 'MC Alger', teamB: 'Mamelodi Sundowns', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
            { id: 114, teamA: 'St Éloi Lupopo', teamB: 'Al Hilal SC', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '18:00', matchday: 2 },
            { id: 115, teamA: 'Stade Malién', teamB: 'Simba SC', scoreA: 2, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '21:00', matchday: 2 },
            { id: 116, teamA: 'Petro de Luanda', teamB: 'Espérance de Tunis', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
            // Matchday 3
            { id: 117, teamA: 'RS Berkane', teamB: 'Pyramids FC', status: 'scheduled', fullDate: '2026-01-23', date: '23', day: 'FRI', time: '21:00', matchday: 3 },
            { id: 118, teamA: 'Al Ahly FC', teamB: 'AS FAR', status: 'scheduled', fullDate: '2026-01-24', date: '24', day: 'SAT', time: '18:00', matchday: 3 },
            { id: 119, teamA: 'Young Africans', teamB: 'JS Kabylie', status: 'scheduled', fullDate: '2026-01-24', date: '24', day: 'SAT', time: '21:00', matchday: 3 },
            { id: 120, teamA: 'Mamelodi Sundowns', teamB: 'Al Hilal SC', status: 'scheduled', fullDate: '2026-01-25', date: '25', day: 'SUN', time: '15:00', matchday: 3 },
            { id: 121, teamA: 'MC Alger', teamB: 'St Éloi Lupopo', status: 'scheduled', fullDate: '2026-01-25', date: '25', day: 'SUN', time: '18:00', matchday: 3 },
            { id: 122, teamA: 'Espérance de Tunis', teamB: 'Simba SC', status: 'scheduled', fullDate: '2026-01-25', date: '25', day: 'SUN', time: '21:00', matchday: 3 },
            { id: 123, teamA: 'Petro de Luanda', teamB: 'Stade Malién', status: 'scheduled', fullDate: '2026-01-25', date: '25', day: 'SUN', time: '15:00', matchday: 3 },
            // Matchday 4
            { id: 124, teamA: 'Pyramids FC', teamB: 'RS Berkane', status: 'scheduled', fullDate: '2026-01-30', date: '30', day: 'FRI', time: '21:00', matchday: 4 },
            { id: 125, teamA: 'AS FAR', teamB: 'Young Africans', status: 'scheduled', fullDate: '2026-01-31', date: '31', day: 'SAT', time: '18:00', matchday: 4 },
            { id: 126, teamA: 'JS Kabylie', teamB: 'Al Ahly FC', status: 'scheduled', fullDate: '2026-01-31', date: '31', day: 'SAT', time: '21:00', matchday: 4 },
            { id: 127, teamA: 'Al Hilal SC', teamB: 'Mamelodi Sundowns', status: 'scheduled', fullDate: '2026-02-01', date: '01', day: 'SUN', time: '15:00', matchday: 4 },
            { id: 128, teamA: 'St Éloi Lupopo', teamB: 'MC Alger', status: 'scheduled', fullDate: '2026-02-01', date: '01', day: 'SUN', time: '18:00', matchday: 4 },
            { id: 129, teamA: 'Simba SC', teamB: 'Espérance de Tunis', status: 'scheduled', fullDate: '2026-02-01', date: '01', day: 'SUN', time: '21:00', matchday: 4 },
            { id: 130, teamA: 'Stade Malién', teamB: 'Petro de Luanda', status: 'scheduled', fullDate: '2026-02-01', date: '01', day: 'SUN', time: '15:00', matchday: 4 },
            // Matchday 5
            { id: 131, teamA: 'Power Dynamos', teamB: 'RS Berkane', status: 'scheduled', fullDate: '2026-02-06', date: '06', day: 'FRI', time: '18:00', matchday: 5 },
            { id: 132, teamA: 'Rivers United FC', teamB: 'Pyramids FC', status: 'scheduled', fullDate: '2026-02-06', date: '06', day: 'FRI', time: '21:00', matchday: 5 },
            { id: 133, teamA: 'JS Kabylie', teamB: 'AS FAR', status: 'scheduled', fullDate: '2026-02-07', date: '07', day: 'SAT', time: '18:00', matchday: 5 },
            { id: 134, teamA: 'Young Africans', teamB: 'Al Ahly FC', status: 'scheduled', fullDate: '2026-02-07', date: '07', day: 'SAT', time: '21:00', matchday: 5 },
            { id: 135, teamA: 'MC Alger', teamB: 'Al Hilal SC', status: 'scheduled', fullDate: '2026-02-08', date: '08', day: 'SUN', time: '15:00', matchday: 5 },
            { id: 136, teamA: 'St Éloi Lupopo', teamB: 'Mamelodi Sundowns', status: 'scheduled', fullDate: '2026-02-08', date: '08', day: 'SUN', time: '18:00', matchday: 5 },
            { id: 137, teamA: 'Simba SC', teamB: 'Stade Malién', status: 'scheduled', fullDate: '2026-02-08', date: '08', day: 'SUN', time: '21:00', matchday: 5 },
            { id: 138, teamA: 'Espérance de Tunis', teamB: 'Petro de Luanda', status: 'scheduled', fullDate: '2026-02-08', date: '08', day: 'SUN', time: '15:00', matchday: 5 },
            // Matchday 6
            { id: 139, teamA: 'RS Berkane', teamB: 'Rivers United FC', status: 'scheduled', fullDate: '2026-02-13', date: '13', day: 'FRI', time: '18:00', matchday: 6 },
            { id: 140, teamA: 'Pyramids FC', teamB: 'Power Dynamos', status: 'scheduled', fullDate: '2026-02-13', date: '13', day: 'FRI', time: '21:00', matchday: 6 },
            { id: 141, teamA: 'Al Ahly FC', teamB: 'Young Africans', status: 'scheduled', fullDate: '2026-02-14', date: '14', day: 'SAT', time: '18:00', matchday: 6 },
            { id: 142, teamA: 'AS FAR', teamB: 'JS Kabylie', status: 'scheduled', fullDate: '2026-02-14', date: '14', day: 'SAT', time: '21:00', matchday: 6 },
            { id: 143, teamA: 'Mamelodi Sundowns', teamB: 'MC Alger', status: 'scheduled', fullDate: '2026-02-15', date: '15', day: 'SUN', time: '15:00', matchday: 6 },
            { id: 144, teamA: 'Al Hilal SC', teamB: 'St Éloi Lupopo', status: 'scheduled', fullDate: '2026-02-15', date: '15', day: 'SUN', time: '18:00', matchday: 6 },
            { id: 145, teamA: 'Petro de Luanda', teamB: 'Simba SC', status: 'scheduled', fullDate: '2026-02-15', date: '15', day: 'SUN', time: '21:00', matchday: 6 },
            { id: 146, teamA: 'Stade Malién', teamB: 'Espérance de Tunis', status: 'scheduled', fullDate: '2026-02-15', date: '15', day: 'SUN', time: '15:00', matchday: 6 },
        ]
    },
    {
        id: 'caf-confederation-cup',
        name: 'CAF Confederation Cup 2025/26',
        description: "The secondary continental club competition for African football. The road to the title features heavyweights from across the continent.",
        logoUrl: 'https://via.placeholder.com/150/228B22/FFFFFF?text=CAF+CC',
        type: 'hybrid',
        teams: [
            // Group A
            { name: 'USM Alger', crestUrl: 'https://via.placeholder.com/64/FF0000/000000?text=USMA' },
            { name: 'Djoliba AC', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=DAC' },
            { name: 'Olympique Club de Safi', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=OCS' },
            { name: 'FC San Pedro', crestUrl: 'https://via.placeholder.com/64/FFA500/FFFFFF?text=FCSP' },
            // Group B
            { name: 'Wydad Casablanca', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=WAC' },
            { name: 'AS Maniema Union', crestUrl: 'https://via.placeholder.com/64/008000/FFFFFF?text=ASMU' },
            { name: 'Azam FC', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=AFC' },
            { name: 'Nairobi United FC', crestUrl: 'https://via.placeholder.com/64/FFFF00/000000?text=NUFC' },
            // Group C
            { name: 'CR Belouizdad', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=CRB' },
            { name: 'Stellenbosch FC', crestUrl: 'https://via.placeholder.com/64/800000/FFFFFF?text=SFC' },
            { name: 'AS Otohô', crestUrl: 'https://via.placeholder.com/64/FFFF00/0000FF?text=ASO' },
            { name: 'Singida Black Stars', crestUrl: 'https://via.placeholder.com/64/000000/FFFF00?text=SBS' },
            // Group D
            { name: 'Zamalek SC', crestUrl: 'https://via.placeholder.com/64/FFFFFF/FF0000?text=ZSC' },
            { name: 'Al Masry SC', crestUrl: 'https://via.placeholder.com/64/008000/FFFFFF?text=AMSC' },
            { name: 'Kaizer Chiefs FC', crestUrl: 'https://via.placeholder.com/64/FFA500/000000?text=KCFC' },
            { name: 'ZESCO United FC', crestUrl: 'https://via.placeholder.com/64/008000/FFFFFF?text=ZUFC' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['USM Alger', 'Djoliba AC', 'Olympique Club de Safi', 'FC San Pedro'] },
            { name: 'Group B', teamNames: ['Wydad Casablanca', 'AS Maniema Union', 'Azam FC', 'Nairobi United FC'] },
            { name: 'Group C', teamNames: ['CR Belouizdad', 'Stellenbosch FC', 'AS Otohô', 'Singida Black Stars'] },
            { name: 'Group D', teamNames: ['Zamalek SC', 'Al Masry SC', 'Kaizer Chiefs FC', 'ZESCO United FC'] }
        ],
        matches: [
            // Matchday 1
            { id: 401, teamA: 'Olympique Club de Safi', teamB: 'Djoliba AC', scoreA: 1, scoreB: 0, status: 'finished', fullDate: '2025-11-22', date: '22', day: 'SAT', time: '18:00', matchday: 1 },
            { id: 402, teamA: 'USM Alger', teamB: 'FC San Pedro', scoreA: 3, scoreB: 2, status: 'finished', fullDate: '2025-11-22', date: '22', day: 'SAT', time: '21:00', matchday: 1 },
            { id: 403, teamA: 'Wydad Casablanca', teamB: 'Nairobi United FC', scoreA: 3, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '21:00', matchday: 1 },
            { id: 404, teamA: 'AS Maniema Union', teamB: 'Azam FC', scoreA: 2, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '15:00', matchday: 1 },
            { id: 405, teamA: 'CR Belouizdad', teamB: 'Singida Black Stars', scoreA: 2, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '18:00', matchday: 1 },
            { id: 406, teamA: 'Stellenbosch FC', teamB: 'AS Otohô', scoreA: 1, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '15:00', matchday: 1 },
            { id: 407, teamA: 'Al Masry SC', teamB: 'Kaizer Chiefs FC', scoreA: 2, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '18:00', matchday: 1 },
            { id: 408, teamA: 'Zamalek SC', teamB: 'ZESCO United FC', scoreA: 1, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '21:00', matchday: 1 },
            // Matchday 2
            { id: 409, teamA: 'ZESCO United FC', teamB: 'Al Masry SC', scoreA: 2, scoreB: 3, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
            { id: 410, teamA: 'Azam FC', teamB: 'Wydad Casablanca', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '18:00', matchday: 2 },
            { id: 411, teamA: 'Olympique Club de Safi', teamB: 'USM Alger', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '21:00', matchday: 2 },
            { id: 412, teamA: 'Nairobi United FC', teamB: 'AS Maniema Union', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
            { id: 413, teamA: 'AS Otohô', teamB: 'CR Belouizdad', scoreA: 4, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
            { id: 414, teamA: 'Singida Black Stars', teamB: 'Stellenbosch FC', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '18:00', matchday: 2 },
        ]
    },
    {
        id: 'uefa-champions-league',
        name: 'UEFA Champions League',
        description: "The biggest club tournament in the world. The best European clubs compete for the most coveted trophy in football.",
        logoUrl: 'https://via.placeholder.com/150/002B7F/FFFFFF?text=UCL',
        type: 'hybrid',
        teams: [
            { name: 'Real Madrid', crestUrl: 'https://via.placeholder.com/64/FFFFFF/00008B?text=RM' },
            { name: 'Manchester City', crestUrl: 'https://via.placeholder.com/64/ADD8E6/FFFFFF?text=MC' },
            { name: 'Bayern Munich', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=FCB' },
            { name: 'PSG', crestUrl: 'https://via.placeholder.com/64/000080/FF0000?text=PSG' },
            { name: 'Arsenal', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=AFC' },
            { name: 'Barcelona', crestUrl: 'https://via.placeholder.com/64/800000/0000FF?text=FCB' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['Real Madrid', 'Manchester City', 'Arsenal'] },
            { name: 'Group B', teamNames: ['Bayern Munich', 'PSG', 'Barcelona'] }
        ],
        matches: [
            { id: 501, teamA: 'Real Madrid', teamB: 'Manchester City', scoreA: 3, scoreB: 3, status: 'finished', fullDate: '2024-04-09', date: '09', day: 'TUE', time: '21:00', venue: 'Santiago Bernabéu' },
        ]
    },
    {
        id: 'uefa-europa-league',
        name: 'UEFA Europa League',
        description: "A fierce competition featuring some of Europe's most historic clubs, fighting for a spot in next season's Champions League.",
        logoUrl: 'https://via.placeholder.com/150/FFA500/000000?text=UEL',
        type: 'hybrid',
        teams: [
            { name: 'Liverpool', crestUrl: 'https://via.placeholder.com/64/FF0000/FFFFFF?text=LFC' },
            { name: 'Bayer Leverkusen', crestUrl: 'https://via.placeholder.com/64/FF0000/000000?text=B04' },
            { name: 'AC Milan', crestUrl: 'https://via.placeholder.com/64/FF0000/000000?text=ACM' },
            { name: 'AS Roma', crestUrl: 'https://via.placeholder.com/64/800000/FFFF00?text=ASR' }
        ],
        groups: [
            { name: 'Group E', teamNames: ['Liverpool', 'Bayer Leverkusen', 'AC Milan', 'AS Roma'] }
        ],
        matches: [
            { id: 601, teamA: 'Liverpool', teamB: 'AC Milan', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2024-03-07', date: '07', day: 'THU', time: '21:00', venue: 'Anfield' },
        ]
    },
    {
        id: 'afcon',
        name: 'Africa Cup of Nations 2025',
        description: "The 35th edition of the biennial African association football tournament. Morocco hosts the continent's elite national teams.",
        logoUrl: 'https://via.placeholder.com/150/228B22/FFD700?text=AFCON+2025',
        type: 'hybrid',
        teams: [
            // Group A
            { name: 'Morocco', crestUrl: 'https://via.placeholder.com/64/C1272D/006233?text=MAR' },
            { name: 'Mali', crestUrl: 'https://via.placeholder.com/64/FCD116/CE1126?text=MLI' },
            { name: 'Zambia', crestUrl: 'https://via.placeholder.com/64/198A4A/FFFFFF?text=ZAM' },
            { name: 'Comoros', crestUrl: 'https://via.placeholder.com/64/3D8E33/FFFFFF?text=COM' },
            // Group B
            { name: 'Egypt', crestUrl: 'https://via.placeholder.com/64/CE1126/000000?text=EGY' },
            { name: 'South Africa', crestUrl: 'https://via.placeholder.com/64/007A4D/FFFFFF?text=RSA' },
            { name: 'Angola', crestUrl: 'https://via.placeholder.com/64/CE1126/000000?text=ANG' },
            { name: 'Zimbabwe', crestUrl: 'https://via.placeholder.com/64/FFD200/000000?text=ZIM' },
            // Group C
            { name: 'Nigeria', crestUrl: 'https://via.placeholder.com/64/008751/FFFFFF?text=NGA' },
            { name: 'Tunisia', crestUrl: 'https://via.placeholder.com/64/E70013/FFFFFF?text=TUN' },
            { name: 'Uganda', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=UGA' },
            { name: 'Tanzania', crestUrl: 'https://via.placeholder.com/64/1EB53A/000000?text=TAN' },
            // Group D
            { name: 'Senegal', crestUrl: 'https://via.placeholder.com/64/00853F/FFFFFF?text=SEN' },
            { name: 'DR Congo', crestUrl: 'https://via.placeholder.com/64/007FFF/F7D117?text=DRC' },
            { name: 'Benin', crestUrl: 'https://via.placeholder.com/64/008751/E8112D?text=BEN' },
            { name: 'Botswana', crestUrl: 'https://via.placeholder.com/64/75AADB/000000?text=BOT' },
            // Group E
            { name: 'Algeria', crestUrl: 'https://via.placeholder.com/64/FFFFFF/006233?text=ALG' },
            { name: 'Burkina Faso', crestUrl: 'https://via.placeholder.com/64/EF2B2D/009E49?text=BFA' },
            { name: 'Equatorial Guinea', crestUrl: 'https://via.placeholder.com/64/31943D/FFFFFF?text=EQG' },
            { name: 'Sudan', crestUrl: 'https://via.placeholder.com/64/D21034/007229?text=SUD' },
            // Group F
            { name: 'Ivory Coast', crestUrl: 'https://via.placeholder.com/64/FF8200/FFFFFF?text=CIV' },
            { name: 'Cameroon', crestUrl: 'https://via.placeholder.com/64/007A5E/CE1126?text=CMR' },
            { name: 'Gabon', crestUrl: 'https://via.placeholder.com/64/36A100/FFFFFF?text=GAB' },
            { name: 'Mozambique', crestUrl: 'https://via.placeholder.com/64/000000/FFFFFF?text=MOZ' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['Morocco', 'Mali', 'Zambia', 'Comoros'] },
            { name: 'Group B', teamNames: ['Egypt', 'South Africa', 'Angola', 'Zimbabwe'] },
            { name: 'Group C', teamNames: ['Nigeria', 'Tunisia', 'Uganda', 'Tanzania'] },
            { name: 'Group D', teamNames: ['Senegal', 'DR Congo', 'Benin', 'Botswana'] },
            { name: 'Group E', teamNames: ['Algeria', 'Burkina Faso', 'Equatorial Guinea', 'Sudan'] },
            { name: 'Group F', teamNames: ['Ivory Coast', 'Cameroon', 'Gabon', 'Mozambique'] }
        ],
        matches: [
            // December 21
            { id: 701, teamA: 'Morocco', teamB: 'Comoros', status: 'scheduled', fullDate: '2025-12-21', date: '21', day: 'SUN', time: '21:00', venue: 'Stade Mohamed V' },
            
            // December 22
            { id: 702, teamA: 'Mali', teamB: 'Zambia', status: 'scheduled', fullDate: '2025-12-22', date: '22', day: 'MON', time: '15:00', venue: 'Stade de Marrakech' },
            { id: 703, teamA: 'South Africa', teamB: 'Angola', status: 'scheduled', fullDate: '2025-12-22', date: '22', day: 'MON', time: '18:00', venue: 'Stade Adrar' },
            { id: 704, teamA: 'Egypt', teamB: 'Zimbabwe', status: 'scheduled', fullDate: '2025-12-22', date: '22', day: 'MON', time: '21:00', venue: 'Stade Adrar' },

            // December 23
            { id: 705, teamA: 'DR Congo', teamB: 'Benin', status: 'scheduled', fullDate: '2025-12-23', date: '23', day: 'TUE', time: '15:00', venue: 'Stade de Tanger' },
            { id: 706, teamA: 'Senegal', teamB: 'Botswana', status: 'scheduled', fullDate: '2025-12-23', date: '23', day: 'TUE', time: '18:00', venue: 'Stade de Tanger' },
            { id: 707, teamA: 'Nigeria', teamB: 'Tanzania', status: 'scheduled', fullDate: '2025-12-23', date: '23', day: 'TUE', time: '15:00', venue: 'Stade Moulay Abdellah' },
            { id: 708, teamA: 'Tunisia', teamB: 'Uganda', status: 'scheduled', fullDate: '2025-12-23', date: '23', day: 'TUE', time: '18:00', venue: 'Stade Moulay Abdellah' },

            // December 24
            { id: 709, teamA: 'Algeria', teamB: 'Sudan', status: 'scheduled', fullDate: '2025-12-24', date: '24', day: 'WED', time: '15:00', venue: 'Stade de Fez' },
            { id: 710, teamA: 'Burkina Faso', teamB: 'Equatorial Guinea', status: 'scheduled', fullDate: '2025-12-24', date: '24', day: 'WED', time: '18:00', venue: 'Stade de Fez' },
            { id: 711, teamA: 'Ivory Coast', teamB: 'Mozambique', status: 'scheduled', fullDate: '2025-12-24', date: '24', day: 'WED', time: '15:00', venue: 'Stade de Nice' },
            { id: 712, teamA: 'Cameroon', teamB: 'Gabon', status: 'scheduled', fullDate: '2025-12-24', date: '24', day: 'WED', time: '18:00', venue: 'Stade de Nice' },

            // December 26
            { id: 713, teamA: 'Angola', teamB: 'Zimbabwe', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '15:00', venue: 'Stade Adrar' },
            { id: 714, teamA: 'Egypt', teamB: 'South Africa', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '18:00', venue: 'Stade Adrar' },
            { id: 715, teamA: 'Zambia', teamB: 'Comoros', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '15:00', venue: 'Stade de Marrakech' },
            { id: 716, teamA: 'Morocco', teamB: 'Mali', status: 'scheduled', fullDate: '2025-12-26', date: '26', day: 'FRI', time: '18:00', venue: 'Stade de Marrakech' },

            // December 27
            { id: 717, teamA: 'Benin', teamB: 'Botswana', status: 'scheduled', fullDate: '2025-12-27', date: '27', day: 'SAT', time: '15:00', venue: 'Stade de Tanger' },
            { id: 718, teamA: 'Senegal', teamB: 'DR Congo', status: 'scheduled', fullDate: '2025-12-27', date: '27', day: 'SAT', time: '18:00', venue: 'Stade de Tanger' },
            { id: 719, teamA: 'Uganda', teamB: 'Tanzania', status: 'scheduled', fullDate: '2025-12-27', date: '27', day: 'SAT', time: '15:00', venue: 'Stade Moulay Abdellah' },
            { id: 720, teamA: 'Nigeria', teamB: 'Tunisia', status: 'scheduled', fullDate: '2025-12-27', date: '27', day: 'SAT', time: '18:00', venue: 'Stade Moulay Abdellah' },

            // December 28
            { id: 721, teamA: 'Gabon', teamB: 'Mozambique', status: 'scheduled', fullDate: '2025-12-28', date: '28', day: 'SUN', time: '15:00', venue: 'Stade de Nice' },
            { id: 722, teamA: 'Equatorial Guinea', teamB: 'Sudan', status: 'scheduled', fullDate: '2025-12-28', date: '28', day: 'SUN', time: '18:00', venue: 'Stade de Fez' },
            { id: 723, teamA: 'Algeria', teamB: 'Burkina Faso', status: 'scheduled', fullDate: '2025-12-28', date: '28', day: 'SUN', time: '21:00', venue: 'Stade de Fez' },
            { id: 724, teamA: 'Ivory Coast', teamB: 'Cameroon', status: 'scheduled', fullDate: '2025-12-28', date: '28', day: 'SUN', time: '18:00', venue: 'Stade de Nice' },

            // December 29
            { id: 725, teamA: 'Comoros', teamB: 'Mali', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '15:00', venue: 'Stade de Marrakech' },
            { id: 726, teamA: 'Zambia', teamB: 'Morocco', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '18:00', venue: 'Stade de Marrakech' },
            { id: 727, teamA: 'Angola', teamB: 'Egypt', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '15:00', venue: 'Stade Adrar' },
            { id: 728, teamA: 'Zimbabwe', teamB: 'South Africa', status: 'scheduled', fullDate: '2025-12-29', date: '29', day: 'MON', time: '18:00', venue: 'Stade Adrar' },

            // December 30
            { id: 729, teamA: 'Tanzania', teamB: 'Tunisia', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '15:00', venue: 'Stade Moulay Abdellah' },
            { id: 730, teamA: 'Uganda', teamB: 'Nigeria', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '18:00', venue: 'Stade Moulay Abdellah' },
            { id: 731, teamA: 'Benin', teamB: 'Senegal', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '15:00', venue: 'Stade de Tanger' },
            { id: 732, teamA: 'Botswana', teamB: 'DR Congo', status: 'scheduled', fullDate: '2025-12-30', date: '30', day: 'TUE', time: '18:00', venue: 'Stade de Tanger' },

            // December 31
            { id: 733, teamA: 'Equatorial Guinea', teamB: 'Algeria', status: 'scheduled', fullDate: '2025-12-31', date: '31', day: 'WED', time: '15:00', venue: 'Stade de Fez' },
            { id: 734, teamA: 'Sudan', teamB: 'Burkina Faso', status: 'scheduled', fullDate: '2025-12-31', date: '31', day: 'WED', time: '18:00', venue: 'Stade de Fez' },
            { id: 735, teamA: 'Gabon', teamB: 'Ivory Coast', status: 'scheduled', fullDate: '2025-12-31', date: '31', day: 'WED', time: '15:00', venue: 'Stade de Nice' },
            { id: 736, teamA: 'Mozambique', teamB: 'Cameroon', status: 'scheduled', fullDate: '2025-12-31', date: '31', day: 'WED', time: '18:00', venue: 'Stade de Nice' },
        ]
    },
    {
        id: 'fifa-world-cup',
        name: 'FIFA World Cup',
        description: "The world's biggest sporting event. Every four years, the globe unites to watch the greatest national teams compete for the ultimate gold.",
        logoUrl: 'https://via.placeholder.com/150/003399/FFFFFF?text=World+Cup',
        type: 'hybrid',
        teams: [
            { name: 'Argentina', crestUrl: 'https://via.placeholder.com/64/ADD8E6/FFFFFF?text=ARG' },
            { name: 'France', crestUrl: 'https://via.placeholder.com/64/0000FF/FFFFFF?text=FRA' },
            { name: 'Brazil', crestUrl: 'https://via.placeholder.com/64/FFFF00/008000?text=BRA' },
            { name: 'England', crestUrl: 'https://via.placeholder.com/64/FFFFFF/FF0000?text=ENG' },
            { name: 'Germany', crestUrl: 'https://via.placeholder.com/64/FFFFFF/000000?text=GER' },
            { name: 'Portugal', crestUrl: 'https://via.placeholder.com/64/FF0000/008000?text=POR' }
        ],
        groups: [
            { name: 'Group C', teamNames: ['Argentina', 'Brazil', 'Portugal'] },
            { name: 'Group D', teamNames: ['France', 'England', 'Germany'] }
        ],
        matches: [
            { id: 801, teamA: 'Argentina', teamB: 'France', scoreA: 3, scoreB: 3, status: 'finished', fullDate: '2022-12-18', date: '18', day: 'SUN', time: '16:00', venue: 'Lusail Stadium' },
        ]
    }
];
