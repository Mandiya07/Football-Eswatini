
export interface YouthArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  date: string;
  imageUrl: string;
}

export interface RisingStarPlayer {
  id: string;
  name: string;
  position: string;
  age: number;
  team: string;
  bio: string;
  photoUrl: string;
}

export interface YouthTeam {
  id: string;
  name: string;
  crestUrl?: string;
}

export interface YouthLeague {
  id: string;
  name: string;
  ageGroup?: string;
  season?: string;
  teams: YouthTeam[];
  fixtures?: string[];
  results?: string[];
  description?: string;
  articles?: YouthArticle[];
  risingStars?: RisingStarPlayer[];
}

export const youthData: YouthLeague[] = [
  {
    id: 'u20-elite-league',
    name: 'U-20 Elite League',
    ageGroup: 'U-20',
    season: '2025/2026',
    teams: [],
    description: 'The elite under-20 division, nurturing the next generation of professional talent for Eswatini clubs.'
  },
  {
    id: 'schools',
    name: 'Schools Football',
    ageGroup: 'Scholastic',
    season: '2025/2026',
    teams: [],
    description: 'Official scholastic competitions across all regions, integrating education and athletic development.'
  },
  {
    id: 'build-it-u13-national',
    name: 'Build It U-13 National',
    ageGroup: 'U-13',
    season: '2025/2026',
    teams: [],
    description: 'A prestigious national showcase for Under-13 talent and academies, identifying the earliest signs of elite potential.'
  },
  {
    id: 'hub-hardware-u17-competition',
    name: 'Hub Hardware U-17 Tournament',
    ageGroup: 'U-17',
    season: '2025/2026',
    teams: [],
    description: 'A high-stakes hybrid tournament for the nation\'s Under-17 tier, featuring regional groups and national knockout stages.'
  },
  {
    id: 'u13-grassroots-national-football',
    name: 'U-13 Grassroots National Football',
    ageGroup: 'U-13',
    season: '2025/2026',
    teams: [],
    description: 'The foundation of the Kingdom\'s football pyramid. Create and manage your own regional grassroots league here with digital tracking.'
  },
  {
    id: 'u15-national-football',
    name: 'U-15 National Football',
    ageGroup: 'U-15',
    season: '2025/2026',
    teams: [],
    description: 'Focusing on tactical refinement and competitive growth for the Under-15 tier. Launch your regional U-15 center here.'
  },
  {
    id: 'u17-national-football',
    name: 'U-17 National Football',
    ageGroup: 'U-17',
    season: '2025/2026',
    teams: [],
    description: 'Elite developmental football for the Under-17 category. Launch and track your regional U-17 juniors leagues live.'
  },
  {
    id: 'u19-national-football',
    name: 'U-19 National Football',
    ageGroup: 'U-19',
    season: '2025/2026',
    teams: [],
    description: 'The tactical bridge to senior professional football. Organize your regional U-19 juniors competition with live digital standings.'
  }
];
