
export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
  cleanSheets?: number;
  potmWins?: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  age: number;
  nationality: string;
  height?: string;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  appearances?: number;
  photo?: string;
  photoUrl?: string;
  club?: string;
  bio?: string;
  baseStats?: PlayerStats;
  transferHistory?: {
    date: string;
    from: string;
    to: string;
    type: string;
    year?: string;
    fee?: string;
  }[];
  stats?: PlayerStats;
  isDiscovered?: boolean;
}

export interface TeamSocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface TeamVideo {
  id: string;
  title: string;
  url: string;
  date: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  photo?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  stadium: string;
  city: string;
  coach: string;
  founded: number;
  players: Player[];
  crestUrl?: string;
  kitSponsor?: { name: string; logoUrl: string; };
  socialMedia?: TeamSocialMedia;
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    bannerUrl?: string;
    welcomeMessage?: string;
  };
  staff?: StaffMember[];
  fixtures?: CompetitionFixture[];
  results?: CompetitionFixture[];
  videos?: TeamVideo[];
  standings?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  stats?: {
    p: number;
    w: number;
    d: number;
    l: number;
    gs: number;
    gc: number;
    gd: number;
    pts: number;
    form: string;
  };
  region?: string;
}

export interface MatchEvent {
  id?: string;
  minute?: number;
  type: 'goal' | 'yellow' | 'red' | 'substitute' | 'yellow-card' | 'red-card' | 'substitution' | 'info';
  player?: string;
  playerName?: string;
  playerID?: string;
  assist?: string;
  teamId?: string;
  teamName?: string;
  description?: string;
}

export interface CompetitionFixture {
  id: string;
  date: string;
  time: string;
  venue: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'abandoned' | 'suspended' | 'cancelled';
  events?: MatchEvent[];
  competitionId?: string;
  round?: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number;
  scoreB?: number;
  matchday?: number;
  fullDate?: string;
  liveMinute?: number;
  playerOfTheMatch?: {
    name: string;
    teamName: string;
    playerID?: string | number;
  };
  referee?: string;
  lineups?: {
    teamA?: { starters: string[], subs: string[] };
    teamB?: { starters: string[], subs: string[] };
    home?: any[];
    away?: any[];
  };
  day?: string;
  competition?: string;
  galleryImages?: string[];
}

export interface Competition {
  id: string;
  name: string;
  type: 'league' | 'cup' | 'tournament';
  season: string;
  teams: Team[];
  fixtures: CompetitionFixture[];
  results: CompetitionFixture[];
  logoUrl?: string;
  displayName?: string;
  categoryId?: string;
  externalApiId?: string;
  region?: string;
  competitionType?: 'league' | 'cup';
}

export interface LogEntry {
  id: string;
  date: string;
  action: string;
  user: string;
  details: string;
}

export const teams: Team[] = [];
export const competitions: Competition[] = [];
