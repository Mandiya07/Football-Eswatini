export interface Referee {
  id: string;
  name: string;
  photoUrl: string;
  level: 'FIFA' | 'National Elite' | 'Regional';
  bio: string;
  stats: {
    matches: number;
    yellowCards: number;
    redCards: number;
  };
  isSpotlight?: boolean;
}

export interface Rule {
  id: string;
  title: string;
  summary: string;
  explanation: string;
}

export const refereeData: { referees: Referee[], ruleOfTheWeek: Rule } = {
  referees: [
    {
      id: 'ref-1',
      name: 'Thulani Sibandze',
      photoUrl: 'https://i.pravatar.cc/150?u=ref1',
      level: 'FIFA',
      bio: 'One of Eswatini\'s most experienced officials, known for his calm demeanor and accurate decision-making in high-pressure matches. Has officiated in several CAF competitions.',
      stats: {
        matches: 124,
        yellowCards: 412,
        redCards: 18,
      },
      isSpotlight: true,
    },
    {
      id: 'ref-2',
      name: 'Letticia Viana',
      photoUrl: 'https://i.pravatar.cc/150?u=ref2',
      level: 'FIFA',
      bio: 'A trailblazer in Eswatini football, Letticia is a highly-respected FIFA-accredited referee who has officiated in top-tier men\'s and women\'s football, including AWCON qualifiers.',
      stats: {
        matches: 88,
        yellowCards: 250,
        redCards: 9,
      },
    },
    {
      id: 'ref-3',
      name: 'Celumusa Siphepho',
      photoUrl: 'https://i.pravatar.cc/150?u=ref3',
      level: 'National Elite',
      bio: 'An up-and-coming referee known for his excellent fitness and positioning. Tipped for FIFA accreditation in the near future.',
      stats: {
        matches: 52,
        yellowCards: 180,
        redCards: 11,
      },
    },
    {
      id: 'ref-4',
      name: 'Thembinkosi Dlamini',
      photoUrl: 'https://i.pravatar.cc/150?u=ref4',
      level: 'National Elite',
      bio: 'A firm but fair official who commands respect from players. Specializes in managing derby matches with intense atmospheres.',
      stats: {
        matches: 75,
        yellowCards: 310,
        redCards: 15,
      },
    },
  ],
  ruleOfTheWeek: {
    id: 'rule-1',
    title: 'The Offside Law (Law 11)',
    summary: 'A player is in an offside position if any part of their head, body or feet is in the opponents’ half (excluding the halfway line) and any part of their head, body or feet is nearer to the opponents’ goal line than both the ball and the second-last opponent.',
    explanation: 'Being in an offside position is not an offence in itself. A player is only penalised for offside if, at the moment the ball is played by a team-mate, they become involved in active play by: interfering with play (playing or touching the ball), interfering with an opponent (preventing them from playing the ball), or gaining an advantage by being in that position. There is no offside offence if a player receives the ball directly from a goal kick, a throw-in or a corner kick.',
  },
};