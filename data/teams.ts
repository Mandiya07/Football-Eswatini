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
  photoUrl?: string;
}

export interface TeamBranding {
    primaryColor: string;
    secondaryColor: string;
    bannerUrl?: string;
    welcomeMessage?: string;
}

export interface TeamSocialMedia {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
}

export interface TeamVideo {
    id: string;
    title: string;
    url: string;
    date: string;
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
  branding?: TeamBranding;
  socialMedia?: TeamSocialMedia;
  videos?: TeamVideo[];
  competitionId?: string;
}

export interface MatchEvent {
    minute?: number; // Optional minute to support incidents with unknown time
    type: 'goal' | 'yellow-card' | 'red-card' | 'substitution' | 'info' | 'match_status';
    description: string;
    playerName?: string;
    playerID?: number;
    teamName?: string;
}

export interface CompetitionFixture {
    // FIX: Change id type to number | string to accommodate descriptive IDs used in international data
    id: number | string;
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
    scoreAPen?: number;
    scoreBPen?: number;
    liveMinute?: number;
    venue?: string;
    referee?: string;
    teamAForm?: string; // e.g., "W D L W W"
    teamBForm?: string;
    // Added competition property to allow storing competition names in match records, as required by international data objects.
    competition?: string;
    events?: MatchEvent[];
    galleryImages?: string[];
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