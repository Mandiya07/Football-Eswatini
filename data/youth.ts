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
        description: "The premier battleground for Eswatini's next generation. The U-20 Elite League showcases the youth squads of the nation's top clubs, serving as the final, crucial step before players transition into senior team football.",
        teams: [
            { id: 2001, name: "Mbabane Swallows U-20", crestUrl: "https://via.placeholder.com/64/FF0000/FFFFFF?text=MS" },
            { id: 2002, name: "Manzini Wanderers U-20", crestUrl: "https://via.placeholder.com/64/800080/FFFFFF?text=MW" },
            { id: 2003, name: "Mbabane Highlanders U-20", crestUrl: "https://via.placeholder.com/64/000000/FFFFFF?text=MH" },
        ],
        risingStars: [
            {
                id: 201,
                name: "Sipho Dlamini",
                age: 18,
                team: "Mbabane Swallows U-20",
                position: "Midfielder",
                photoUrl: "https://i.pravatar.cc/300?u=youth201",
                bio: "A gifted playmaker with exceptional vision and a deft touch. Sipho's ability to deliver weighted through balls is unmatched at this level."
            }
        ],
        articles: [
            {
                id: 'y1',
                title: "Young Buffaloes U20 Maintain Unbeaten Streak",
                date: "2023-11-05",
                summary: "The young army side proved too strong for Moneni Pirates, securing a 3-0 victory to stay top of the table.",
                content: "Young Buffaloes U20 continued their dominance in the Elite League with a convincing win. Their tactical discipline and physical fitness were on full display...",
                imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        id: 'hub-hardware-u17',
        name: "Hub Hardware U-17 National Championship",
        description: "The official Under-17 developmental tournament (incorporating the Hub Utility Stores competition). It serves as the primary identification platform for the national U-17 squad.",
        teams: [
            { id: 1701, name: "Hhohho Eagles U-17", crestUrl: "https://via.placeholder.com/64/00008B/FFFFFF?text=HE" },
            { id: 1702, name: "Lubombo Leopards U-17", crestUrl: "https://via.placeholder.com/64/90EE90/000000?text=LL" },
        ],
        risingStars: [
            {
                id: 171,
                name: "Thabo Motsa",
                age: 16,
                team: "Hhohho Eagles U-17",
                position: "Striker",
                photoUrl: "https://i.pravatar.cc/300?u=youth171",
                bio: "A natural-born goalscorer with predatory instincts in the box."
            }
        ],
        articles: [
            {
                id: 'h1',
                title: "Regional Qualifiers: Hhohho Eagles Soar",
                date: "2023-10-30",
                summary: "The Eagles dominated the northern qualifiers, scoring 12 goals in 3 games.",
                content: "It was a weekend of high scores and attacking football as the Hub Hardware U-17 tournament kicked off...",
                imageUrl: "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        id: 'schools',
        name: "Instacash Schools Competition",
        description: "The bedrock of talent identification and a celebrated part of Eswatini's sporting culture. School tournaments provide the first platform for future stars.",
        teams: [
            { id: 9001, name: "Waterford Kamhlaba", crestUrl: "https://via.placeholder.com/64/1E3A8A/FFFFFF?text=WK" },
            { id: 9005, name: "Salesian High School", crestUrl: "https://via.placeholder.com/64/6B7280/FFFFFF?text=SH" },
        ],
        risingStars: [],
        articles: [
            {
                id: 's1',
                title: "Instacash Schools Final: Salesian vs Central",
                date: "2023-11-14",
                summary: "A preview of the highly anticipated final at Somhlolo Stadium this weekend.",
                content: "The stage is set for a thrilling encounter between two of the country's footballing powerhouses...",
                imageUrl: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        id: 'build-it-u13',
        name: "Build It U-13 National Final & Grassroots Festival",
        description: "The ultimate test for the youngest talents in Eswatini, emphasizing fundamental skills, sportsmanship, and fun on a national stage.",
        teams: [
            { id: 1301, name: "Mbabane Future Stars", crestUrl: "https://via.placeholder.com/64/1E3A8A/FFFFFF?text=FS" },
            { id: 1302, name: "Manzini Youngsters", crestUrl: "https://via.placeholder.com/64/D63031/FFFFFF?text=MY" },
        ],
        risingStars: [],
        articles: [
            {
                id: 'b1',
                title: "Build It U13: Festival of Football",
                date: "2023-11-10",
                summary: "Over 50 teams participated in the regional playoffs this weekend.",
                content: "Grassroots football is alive and well in Eswatini, as demonstrated by the massive turnout...",
                imageUrl: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&w=800&q=80"
            }
        ]
    }
];