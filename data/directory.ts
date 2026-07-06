
export type Region = 'Hhohho' | 'Manzini' | 'Lubombo' | 'Shiselweni' | 'National';
export type EntityCategory = 'Club' | 'Academy' | 'Organization' | 'Other' | 'Referee' | 'Schools' | 'Association' | 'Stadium' | 'Media' | 'Sponsor';

export interface DirectoryEntity {
  id: string;
  name: string;
  type: 'club' | 'association' | 'stadium' | 'media' | 'sponsor';
  description: string;
  contact: {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  logo: string;
  crestUrl?: string;
  category?: EntityCategory;
  tier?: string;
  teamId?: string;
  competitionId?: string;
  nickname?: string;
  founded?: number;
  stadium?: string;
  region?: Region;
  leaders?: {
    name: string;
    role: string;
  }[];
  honours?: string[];
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  location?: {
    lat: number;
    lng: number;
  };
}

export const directoryData: DirectoryEntity[] = [];
