
export interface RisingStarPlayer {
    id: number;
    name: string;
    age: number;
    team: string;
    position: string;
    photoUrl: string;
    bio: string;
}

export interface YouthTeam {
    id: number;
    name: string;
    crestUrl: string;
}

export interface YouthArticle {
    id: string;
    title: string;
    summary: string;
    content: string;
    imageUrl: string;
    date: string;
}

export interface YouthLeague {
    id: string;
    name: string;
    description: string;
    logoUrl?: string; // Added for top-level branding
    teams: YouthTeam[];
    risingStars: RisingStarPlayer[];
    articles?: YouthArticle[];
}

export const youthData: YouthLeague[] = [
    // This is the source of truth for structural defaults.
    // Real data is managed in Firestore 'youth' collection.
];
