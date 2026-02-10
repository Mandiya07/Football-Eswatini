
export type EntityCategory = 'Club' | 'Academy' | 'Referee' | 'Association' | 'Schools';
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
  tier?: 'Premier League' | 'NFD' | 'Womens League' | 'Regional' | 'Schools';
}

export const directoryData: DirectoryEntity[] = [
  // Existing data remains...
  {
    id: 'school-1', name: 'Waterford Kamhlaba', category: 'Schools', region: 'Hhohho',
    location: { lat: 38, lng: 45 }, crestUrl: 'https://via.placeholder.com/128/1E3A8A/FFFFFF?text=WK', tier: 'Schools',
  },
  {
    id: 'school-2', name: 'Salesian High School', category: 'Schools', region: 'Manzini',
    location: { lat: 55, lng: 58 }, crestUrl: 'https://via.placeholder.com/128/6B7280/FFFFFF?text=SH', tier: 'Schools',
  },
];
