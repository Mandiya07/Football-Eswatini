
export interface Referee {
  id: string;
  name: string;
  age: number;
  nationality: string;
  experience: number;
  photo?: string;
  photoUrl?: string;
  matchesOfficiated: number;
  yellowCardsGiven: number;
  redCardsGiven: number;
  level?: string;
  bio?: string;
  stats?: {
    matches: number;
    yellowCards: number;
    redCards: number;
  };
  isSpotlight?: boolean;
}

export interface Rule {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  explanation?: string;
  category: string;
  updatedAt?: string;
}

export const refereeData: Referee[] = [];
export const rulesData: Rule[] = [];
