
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
    teams: YouthTeam[];
    risingStars: RisingStarPlayer[];
    articles?: YouthArticle[];
}

export const youthData: YouthLeague[] = [
    {
        id: 'u20-elite-league',
        name: "U-20 Elite League",
        description: "The premier development platform for Eswatini's future professional stars. The final bridge between youth and senior football.",
        teams: [],
        risingStars: [],
        articles: []
    },
    {
        id: 'schools',
        name: "Schools Football Championship",
        description: "The national championship for the Kingdom's most talented scholastic teams. Promoting education through football excellence.",
        teams: [],
        risingStars: [],
        articles: []
    },
    {
        id: 'build-it-u13-national',
        name: "Built it U13 National Competition",
        description: "A prestigious national showcase for Under-13 talent and academies, identifying the earliest signs of elite potential.",
        teams: [],
        risingStars: [],
        articles: []
    },
    {
        id: 'hub-hardware-u17-competition',
        name: "The Hub Hardware Under -17 Tournament",
        description: "A high-stakes hybrid tournament for the nation's Under-17 tier, featuring regional groups and national knockout stages.",
        teams: [],
        risingStars: [],
        articles: []
    },
    {
        id: 'u13-grassroots-national-football',
        name: "U-13 Grassroots National Football",
        description: "The foundation of the Kingdom's football pyramid. Create and manage your own regional grassroots league here with digital tracking.",
        teams: [],
        risingStars: [],
        articles: []
    },
    {
        id: 'u17-national-football',
        name: "U-17 National Football",
        description: "Elite developmental football for the Under-17 category. Launch and track your regional U-17 juniors leagues live.",
        teams: [],
        risingStars: [],
        articles: []
    },
    {
        id: 'u19-national-football',
        name: "U-19 National Football",
        description: "The tactical bridge to senior professional football. Organize your regional U-19 juniors competition with live digital standings.",
        teams: [],
        risingStars: [],
        articles: []
    }
];
