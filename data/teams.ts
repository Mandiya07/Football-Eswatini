
export interface LogEntry {
  p: number;
  w: number;
  d: number;
  l: number;
  gs: number;
  gc: number;
  gd: number;
  pts: number;
  form: string;
}

export interface Player {
    id: number;
    name: string;
    position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
    number: number;
    photoUrl: string;
    club?: string; // Player's current club
    bio: {
        nationality: string;
        age: number;
        height: string;
    };
    stats: {
        appearances: number;
        goals: number;
        assists: number;
    };
    transferHistory: {
        from: string;
        to: string;
        year: number;
    }[];
}

export interface TeamFixture {
    opponent: string;
    date: string;
}

export interface TeamResult {
    opponent: string;

    score: string; // e.g., "W 2-1"
}

export interface StaffMember {
  id: number;
  name: string;
  role: 'Head Coach' | 'Assistant Coach' | 'Goalkeeper Coach' | 'Physiotherapist' | 'Team Doctor' | 'Kit Manager';
  email: string;
  phone: string;
}

export interface Team {
  id: number;
  name: string;
  stats: LogEntry;
  crestUrl: string;
  players: Player[];
  fixtures: TeamFixture[];
  results: TeamResult[];
  staff: StaffMember[];
  kitSponsor?: {
    name: string;
    logoUrl: string;
  };
  competitionId?: string;
}

export interface MatchEvent {
    minute: number;
    type: 'goal' | 'yellow-card' | 'red-card' | 'substitution' | 'info' | 'match_status';
    description: string;
}

export interface CompetitionFixture {
    id: number;
    matchday?: number;
    date: string;
    day: string;
    fullDate?: string;
    teamA: string;
    teamB: string;
    time: string;
    status?: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | 'abandoned' | 'suspended';
    scoreA?: number;
    scoreB?: number;
    liveMinute?: number;
    venue?: string;
    referee?: string;
    teamAForm?: string; // e.g., "W D L W W"
    teamBForm?: string;
    events?: MatchEvent[];
}
  
export interface Competition {
    name: string;
    logoUrl?: string;
    fixtures: CompetitionFixture[];
    results: CompetitionFixture[];
    teamIds?: number[]; // Changed from `teams?: Team[]`
    teams?: Team[]; // Kept for in-memory representation after joining
    categoryId?: string;
    externalApiId?: string;
    displayName?: string;
    description?: string;
}