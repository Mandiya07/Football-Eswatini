
export interface BracketMatch {
  id: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  date: string;
  status: string;
  team1?: {
    id?: string | number;
    name: string;
    crestUrl: string;
    score: string | number;
  };
  team2?: {
    id?: string | number;
    name: string;
    crestUrl: string;
    score: string | number;
  };
  winner?: string | null;
  venue?: string;
  time?: string;
}

export interface CupHubSlot {
  id: string;
  name: string;
  type: string;
}

export interface Tournament {
  id: string;
  name: string;
  type: 'cup' | 'tournament';
  season: string;
  teams: string[];
  fixtures: string[];
  results: string[];
  hubSlot?: string;
  rounds?: {
    name: string;
    matches: BracketMatch[];
    title?: string;
  }[];
  logoUrl?: string;
  categoryId?: string;
}

export const cupData: Tournament[] = [];
