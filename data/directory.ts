

export type EntityCategory = 'Club' | 'Academy' | 'Referee' | 'Association';
export type Region = 'Hhohho' | 'Manzini' | 'Lubombo' | 'Shiselweni';

export interface DirectoryEntity {
  id: string;
  teamId?: number; // The numeric ID used for linking to /teams/:teamId
  competitionId?: string; // The string ID of the competition, e.g., 'mtn-premier-league'
  name: string;
  nickname?: string;
  founded?: number;
  stadium?: string;
  category: EntityCategory;
  region: Region;
  leaders?: { role: string; name: string }[];
  honours?: string[];
  contact?: { 
    phone?: string; 
    email?: string;
  };
  location?: { 
    address?: string; 
    lat: number; // Percentage from top
    lng: number; // Percentage from left
  };
  crestUrl?: string;
  tier?: 'Premier League' | 'NFD' | 'Womens League' | 'Regional';
}

export const directoryData: DirectoryEntity[] = [
  // Clubs - Premier League
  {
    id: 'club-5', teamId: 5, competitionId: 'mtn-premier-league', name: 'Mbabane Highlanders FC', nickname: 'Inkunzi Emnyama', founded: 1952, stadium: 'Mbabane Stadium',
    category: 'Club', region: 'Hhohho', location: { lat: 38, lng: 48 }, crestUrl: 'https://via.placeholder.com/128/000000/FFFFFF?text=MH', tier: 'Premier League',
  },
  {
    id: 'club-2', teamId: 2, competitionId: 'mtn-premier-league', name: 'Mbabane Swallows FC', nickname: 'Umbonyi Usuthu', founded: 1948, stadium: 'Mbabane Stadium',
    category: 'Club', region: 'Hhohho', location: { lat: 40, lng: 52 }, crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MS', tier: 'Premier League',
  },
  {
    id: 'club-6', teamId: 6, competitionId: 'mtn-premier-league', name: 'Manzini Wanderers FC', category: 'Club', region: 'Manzini',
    location: { lat: 55, lng: 60 }, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MW', tier: 'Premier League',
  },
  {
    id: 'club-7', teamId: 7, competitionId: 'mtn-premier-league', name: 'Moneni Pirates FC', category: 'Club', region: 'Manzini',
    location: { lat: 58, lng: 65 }, crestUrl: 'https://via.placeholder.com/128/FF4500/000000?text=MP', tier: 'Premier League',
  },
  {
    id: 'club-4', teamId: 4, competitionId: 'mtn-premier-league', name: 'Royal Leopards FC', category: 'Club', region: 'Manzini',
    location: { lat: 60, lng: 58 }, crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RL', tier: 'Premier League',
  },
  {
    id: 'club-3', teamId: 3, competitionId: 'mtn-premier-league', name: 'Young Buffaloes FC', category: 'Club', region: 'Manzini',
    location: { lat: 53, lng: 68 }, crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YB', tier: 'Premier League',
  },
  {
    id: 'club-9', teamId: 9, competitionId: 'mtn-premier-league', name: 'Manzini Sea Birds FC', category: 'Club', region: 'Manzini',
    location: { lat: 56, lng: 63 }, crestUrl: 'https://via.placeholder.com/128/87CEEB/000000?text=MSB', tier: 'Premier League',
  },
  {
    id: 'club-1', teamId: 1, competitionId: 'mtn-premier-league', name: 'Green Mamba FC', category: 'Club', region: 'Lubombo',
    location: { lat: 50, lng: 85 }, crestUrl: 'https://via.placeholder.com/128/1E4620/FFFFFF?text=GM', tier: 'Premier League',
  },
  {
    id: 'club-8', teamId: 8, competitionId: 'mtn-premier-league', name: 'Nsingizini Hotspurs FC', category: 'Club', region: 'Shiselweni',
    location: { lat: 80, lng: 55 }, crestUrl: 'https://via.placeholder.com/128/FFFF00/000000?text=NH', tier: 'Premier League',
  },
  { id: 'club-10', teamId: 10, competitionId: 'mtn-premier-league', name: 'Denver Sundowns FC', category: 'Club', region: 'Manzini', tier: 'Premier League', location: { lat: 57, lng: 61 }, crestUrl: 'https://via.placeholder.com/128/F0E68C/000000?text=DS' },
  { id: 'club-11', teamId: 11, competitionId: 'mtn-premier-league', name: 'Madlenya FC', category: 'Club', region: 'Lubombo', tier: 'Premier League', location: { lat: 52, lng: 88 }, crestUrl: 'https://via.placeholder.com/128/483D8B/FFFFFF?text=MFC' },
  { id: 'club-12', teamId: 12, competitionId: 'mtn-premier-league', name: 'Ezulwini United FC', category: 'Club', region: 'Hhohho', tier: 'Premier League', location: { lat: 43, lng: 54 }, crestUrl: 'https://via.placeholder.com/128/008080/FFFFFF?text=EU' },
  { id: 'club-13', teamId: 13, competitionId: 'mtn-premier-league', name: 'Mhlume Peacemakers FC', category: 'Club', region: 'Lubombo', tier: 'Premier League', location: { lat: 48, lng: 90 }, crestUrl: 'https://via.placeholder.com/128/6B8E23/FFFFFF?text=MPF' },


  // Clubs - National First Division
  { id: 'club-101', teamId: 101, competitionId: 'national-first-division', name: 'Hlatikulu Tycoons', category: 'Club', region: 'Shiselweni', tier: 'NFD', location: { lat: 82, lng: 58 }, crestUrl: 'https://via.placeholder.com/128/FF8C00/FFFFFF?text=HT' },
  { id: 'club-102', teamId: 102, competitionId: 'national-first-division', name: 'Illovo FC', category: 'Club', region: 'Lubombo', tier: 'NFD', location: { lat: 65, lng: 88 }, crestUrl: 'https://via.placeholder.com/128/228B22/FFFFFF?text=IFC' },
  { id: 'club-103', teamId: 103, competitionId: 'national-first-division', name: 'Louis XIV FC', category: 'Club', region: 'Manzini', tier: 'NFD', location: { lat: 62, lng: 62 }, crestUrl: 'https://via.placeholder.com/128/4682B4/FFFFFF?text=LFC' },
  { id: 'club-104', teamId: 104, competitionId: 'national-first-division', name: 'Milling Hotspurs', category: 'Club', region: 'Manzini', tier: 'NFD', location: { lat: 59, lng: 61 }, crestUrl: 'https://via.placeholder.com/128/B22222/FFFFFF?text=MH' },
  
  // Clubs - Women's League
  { id: 'club-501', teamId: 501, competitionId: 'eswatini-women-football-league', name: 'Young Buffaloes Ladies', category: 'Club', region: 'Manzini', tier: 'Womens League', location: { lat: 54, lng: 67 }, crestUrl: 'https://via.placeholder.com/128/A52A2A/FFFFFF?text=YBL' },
  { id: 'club-502', teamId: 502, competitionId: 'eswatini-women-football-league', name: 'Manzini Wanderers Ladies', category: 'Club', region: 'Manzini', tier: 'Womens League', location: { lat: 56, lng: 59 }, crestUrl: 'https://via.placeholder.com/128/800080/FFFFFF?text=MWL' },
  { id: 'club-503', teamId: 503, competitionId: 'eswatini-women-football-league', name: 'Royal Leopards Ladies', category: 'Club', region: 'Manzini', tier: 'Womens League', location: { lat: 61, lng: 57 }, crestUrl: 'https://via.placeholder.com/128/00008B/FFFFFF?text=RLL' },
  { id: 'club-504', teamId: 504, competitionId: 'eswatini-women-football-league', name: 'Mbabane Swallows Ladies', category: 'Club', region: 'Hhohho', tier: 'Womens League', location: { lat: 41, lng: 53 }, crestUrl: 'https://via.placeholder.com/128/FF0000/FFFFFF?text=MSL' },

  // Academies
  {
    id: 'acad-1', name: 'Sihlangu Academy', category: 'Academy', region: 'Hhohho',
    location: { lat: 42, lng: 49, address: 'Mbabane, Eswatini' }, contact: { email: 'info@sihlanguacademy.com' }
  },
  {
    id: 'acad-2', name: 'Manzini Youth Hub', category: 'Academy', region: 'Manzini',
    location: { lat: 57, lng: 62, address: 'Manzini, Eswatini' }, contact: { phone: '+268 7600 0002' }
  },

  // Referees
  { id: 'ref-1', name: 'Thulani Sibandze', category: 'Referee', region: 'Hhohho' },
  { id: 'ref-2', name: 'Letticia Viana', category: 'Referee', region: 'Manzini' },
  { id: 'ref-3', name: 'Thembinkosi Dlamini', category: 'Referee', region: 'Lubombo' },
  { id: 'ref-4', name: 'Celumusa Siphepho', category: 'Referee', region: 'Shiselweni' },

  // Associations
  {
    id: 'assoc-1', name: 'Eswatini Football Association (EFA)', category: 'Association', region: 'Hhohho',
    contact: { email: 'info@efa.org.sz', phone: '+268 2404 2928' }
  },
  {
    id: 'assoc-2', name: 'Premier League of Eswatini (PLE)', category: 'Association', region: 'Hhohho',
    contact: { email: 'info@ple.co.sz' }
  },
  { id: 'assoc-3', name: 'Hhohho Regional Football Association', category: 'Association', region: 'Hhohho' },
  { id: 'assoc-4', name: 'Manzini Regional Football Association', category: 'Association', region: 'Manzini' },
];