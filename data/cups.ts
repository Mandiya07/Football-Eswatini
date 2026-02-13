export interface BracketMatchTeam {
    id?: number;
    name: string;
    score?: number | string;
    crestUrl?: string;
}

export interface BracketMatch {
    id: number | string;
    team1: BracketMatchTeam;
    team2: BracketMatchTeam;
    winner?: 'team1' | 'team2' | null;
    date?: string;
    time?: string;
    venue?: string;
}

export interface BracketRound {
    title: string;
    matches: BracketMatch[];
}

export type CupHubSlot = 'national' | 'trade-fair' | 'hhohho' | 'manzini' | 'lubombo' | 'shiselweni';

export interface Tournament {
    id: string;
    name: string;
    logoUrl?: string;
    rounds: BracketRound[];
    categoryId?: string;
    type?: 'bracket' | 'league';
    hubSlot?: CupHubSlot; // New property for UI mapping
}

export const cupData: Tournament[] = [];