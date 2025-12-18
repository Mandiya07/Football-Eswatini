import { Tournament } from "./cups";
import { CompetitionFixture } from "./teams";

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
            { id: 101, teamA: 'RS Berkane', teamB: 'Power Dynamos', scoreA: 3, scoreB: 0, status: 'finished', fullDate: '2025-11-21', date: '21', day: 'FRI', time: '18:00', matchday: 1 },
            { id: 102, teamA: 'Pyramids FC', teamB: 'Rivers United FC', scoreA: 3, scoreB: 0, status: 'finished', fullDate: '2025-11-21', date: '21', day: 'FRI', time: '21:00', matchday: 1 },
            { id: 103, teamA: 'Al Ahly FC', teamB: 'JS Kabylie', scoreA: 4, scoreB: 1, status: 'finished', fullDate: '2025-11-22', date: '22', day: 'SAT', time: '18:00', matchday: 1 },
            { id: 104, teamA: 'Young Africans', teamB: 'AS FAR', scoreA: 1, scoreB: 0, status: 'finished', fullDate: '2025-11-22', date: '22', day: 'SAT', time: '21:00', matchday: 1 },
            { id: 105, teamA: 'Mamelodi Sundowns', teamB: 'St Éloi Lupopo', scoreA: 3, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '15:00', matchday: 1 },
            { id: 106, teamA: 'Al Hilal SC', teamB: 'MC Alger', scoreA: 2, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '18:00', matchday: 1 },
            { id: 107, teamA: 'Espérance de Tunis', teamB: 'Stade Malién', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '21:00', matchday: 1 },
            { id: 108, teamA: 'Simba SC', teamB: 'Petro de Luanda', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-23', date: '23', day: 'SUN', time: '15:00', matchday: 1 },
            { id: 109, teamA: 'Rivers United FC', teamB: 'RS Berkane', scoreA: 1, scoreB: 2, status: 'finished', fullDate: '2025-11-28', date: '28', day: 'FRI', time: '15:00', matchday: 2 },
            { id: 110, teamA: 'Power Dynamos', teamB: 'Pyramids FC', scoreA: 0, scoreB: 1, status: 'finished', fullDate: '2025-11-28', date: '28', day: 'FRI', time: '18:00', matchday: 2 },
            { id: 111, teamA: 'JS Kabylie', teamB: 'Young Africans', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2025-11-29', date: '29', day: 'SAT', time: '18:00', matchday: 2 },
            { id: 112, teamA: 'AS FAR', teamB: 'Al Ahly FC', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-29', date: '29', day: 'SAT', time: '21:00', matchday: 2 },
            { id: 113, teamA: 'MC Alger', teamB: 'Mamelodi Sundowns', scoreA: 0, scoreB: 0, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
            { id: 114, teamA: 'St Éloi Lupopo', teamB: 'Al Hilal SC', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '18:00', matchday: 2 },
            { id: 115, teamA: 'Stade Malién', teamB: 'Simba SC', scoreA: 2, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '21:00', matchday: 2 },
            { id: 116, teamA: 'Petro de Luanda', teamB: 'Espérance de Tunis', scoreA: 1, scoreB: 1, status: 'finished', fullDate: '2025-11-30', date: '30', day: 'SUN', time: '15:00', matchday: 2 },
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
        id: 'afcon-2025',
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
            { name: 'Zimbabwe', crestUrl: 'https://via.placeholder.com/64/FFD200/000000?text=ZIM' }
        ],
        groups: [
            { name: 'Group A', teamNames: ['Morocco', 'Mali', 'Zambia', 'Comoros'] },
            { name: 'Group B', teamNames: ['Egypt', 'South Africa', 'Angola', 'Zimbabwe'] }
        ],
        matches: [
            { id: 701, teamA: 'Morocco', teamB: 'Comoros', status: 'scheduled', fullDate: '2025-12-21', date: '21', day: 'SUN', time: '21:00', venue: 'Stade Mohamed V' },
            { id: 702, teamA: 'Mali', teamB: 'Zambia', status: 'scheduled', fullDate: '2025-12-22', date: '22', day: 'MON', time: '15:00', venue: 'Stade de Marrakech' },
        ]
    }
];