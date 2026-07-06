
import { Team, CompetitionFixture } from './teams';

export interface ConfigTeam {
  name: string;
  crestUrl: string;
}

export interface HybridTournament {
  id: string;
  name: string;
  season?: string;
  teams: ConfigTeam[];
  fixtures?: CompetitionFixture[];
  results?: CompetitionFixture[];
  logoUrl?: string;
  description?: string;
  bracketId?: string;
  bracket?: any;
  matches?: CompetitionFixture[];
  groups?: {
    name: string;
    teamNames: string[];
  }[];
  type?: 'hybrid';
  categoryId?: string;
  externalApiId?: string;
}

export const internationalData: HybridTournament[] = [];
export const youthHybridData: HybridTournament[] = [];
