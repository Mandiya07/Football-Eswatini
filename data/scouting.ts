
export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface ScoutedPlayer {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  currentClub: string;
  nationality: string;
  rating: number;
  potential: number;
  strengths: string[];
  weaknesses: string[];
  notes: string;
  videoUrl?: string;
  photoUrl?: string;
  region?: string;
  bio?: string;
  stats: {
    label: string;
    value: string | number;
  }[];
  contactEmail?: string;
}

export const scoutingData: ScoutedPlayer[] = [];
