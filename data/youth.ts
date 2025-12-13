
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
        description: "The premier battleground for Eswatini's next generation. The U-20 Elite League showcases the youth squads of the nation's top clubs, serving as the final, crucial step before players transition into senior team football. Scouts frequently monitor these high-stakes matches for emerging talent.",
        teams: [
            { id: 2001, name: "Mbabane Swallows U-20", crestUrl: "https://via.placeholder.com/64/FF0000/FFFFFF?text=MS" },
            { id: 2002, name: "Manzini Wanderers U-20", crestUrl: "https://via.placeholder.com/64/800080/FFFFFF?text=MW" },
            { id: 2003, name: "Mbabane Highlanders U-20", crestUrl: "https://via.placeholder.com/64/000000/FFFFFF?text=MH" },
            { id: 2004, name: "Green Mamba U-20", crestUrl: "https://via.placeholder.com/64/1E4620/FFFFFF?text=GM" },
            { id: 2005, name: "Royal Leopards U-20", crestUrl: "https://via.placeholder.com/64/00008B/FFFFFF?text=RL" },
            { id: 2006, name: "Young Buffaloes U-20", crestUrl: "https://via.placeholder.com/64/A52A2A/FFFFFF?text=YB" },
            { id: 2007, name: "Moneni Pirates U-20", crestUrl: "https://via.placeholder.com/64/FF4500/000000?text=MP" },
            { id: 2008, name: "Nsingizini Hotspurs U-20", crestUrl: "https://via.placeholder.com/64/FFFF00/000000?text=NH" },
        ],
        risingStars: [
            {
                id: 201,
                name: "Sipho 'The Magician' Dlamini",
                age: 18,
                team: "Mbabane Swallows U-20",
                position: "Attacking Midfielder",
                photoUrl: "https://i.pravatar.cc/300?u=youth201",
                bio: "A supremely gifted playmaker with exceptional vision and a deft touch. Sipho's ability to deliver perfectly-weighted through balls and dribble out of tight spaces makes him a nightmare for defenders. Already training with the senior squad."
            },
            {
                id: 202,
                name: "Musa 'The Tank' Ndlovu",
                age: 19,
                team: "Green Mamba U-20",
                position: "Center Forward",
                photoUrl: "https://i.pravatar.cc/300?u=youth202",
                bio: "A classic number 9, combining raw power with a clinical finishing instinct. Musa excels at holding up play, bringing his teammates into the attack, and is a dominant force in the air on set-pieces. Possesses a thunderous shot."
            },
            {
                id: 203,
                name: "Banele 'Flash' Shongwe",
                age: 18,
                team: "Royal Leopards U-20",
                position: "Winger",
                photoUrl: "https://i.pravatar.cc/300?u=youth203",
                bio: "An electrifying winger with explosive pace and dazzling dribbling ability. Banele is a constant threat on the flank, capable of beating his man and delivering pinpoint crosses or cutting inside to shoot. A true game-changer."
            },
            {
                id: 204,
                name: "Linda 'The Wall' Vilakati",
                age: 19,
                team: "Mbabane Highlanders U-20",
                position: "Center Back",
                photoUrl: "https://i.pravatar.cc/300?u=youth204",
                bio: "A composed and intelligent defender who reads the game exceptionally well. Linda is known for his perfectly-timed tackles and ability to organize the backline. Comfortable playing out from the back under pressure."
            },
        ],
        articles: [
            {
                id: 'y1',
                title: "Young Buffaloes U20 Maintain Unbeaten Streak",
                date: "2023-11-05",
                summary: "The young army side proved too strong for Moneni Pirates, securing a 3-0 victory to stay top of the table.",
                content: "Young Buffaloes U20 continued their dominance in the Elite League with a convincing win. Their tactical discipline and physical fitness were on full display...",
                imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?auto=format&fit=crop&w=800&q=80"
            },
            {
                id: 'y2',
                title: "Swallows U20 Unearth New Gem",
                date: "2023-11-02",
                summary: "16-year-old midfielder Sipho Dlamini was the star of the show in the Mbabane Derby, providing two assists.",
                content: "In a tense derby match against Highlanders, it was the youngest player on the pitch who made the difference...",
                imageUrl: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=800&q=80"
            }
        ]
    },
    {
        id: 'hub-hardware-u17',
        name: "The Hub Hardware Under-17 Tournament",
        description: "Also referred to as the Hub Utility Stores U-17 competition, this grassroots football event is organized under the Hhohho Regional Football Association. It identifies raw talent at the regional level.",
        teams: [
            { id: 1701, name: "Hhohho Eagles U-17", crestUrl: "https://via.placeholder.com/64/00008B/FFFFFF?text=HE" },
            { id: 1702, name: "Lubombo Leopards U-17", crestUrl: "https://via.placeholder.com/64/90EE90/000000?text=LL" },
            { id: 1703, name: "Manzini Dynamos U-17", crestUrl: "https://via.placeholder.com/64/FFA500/000000?text=MD" },
            { id: 1704, name: "Shiselweni Saints U-17", crestUrl: "https://via.placeholder.com/64/8A2BE2/FFFFFF?text=SS" },
            { id: 1705, name: "Ezulwini United U-17", crestUrl: "https://via.placeholder.com/64/4B0082/FFFFFF?text=EU" },
            { id: 1706, name: "Big Bend Vipers U-17", crestUrl: "https://via.placeholder.com/64/22C55E/FFFFFF?text=BV" },
        ],
        risingStars: [
            {
                id: 171,
                name: "Thabo Motsa",
                age: 16,
                team: "Hhohho Eagles U-17",
                position: "Striker",
                photoUrl: "https://i.pravatar.cc/300?u=youth171",
                bio: "A natural-born goalscorer. Thabo's predatory instincts in the box are unmatched at this level. He possesses a quick release and is adept at finding space, making him the top scorer in the last regional qualifiers."
            },
            {
                id: 172,
                name: "Kwanele Dlamini",
                age: 16,
                team: "Manzini Dynamos U-17",
                position: "Box-to-Box Midfielder",
                photoUrl: "https://i.pravatar.cc/300?u=youth173",
                bio: "An all-action midfielder with a relentless work rate. Kwanele covers every blade of grass, contributing defensively with key tackles and driving forward to support the attack with powerful runs and late arrivals into the box."
            },
            {
                id: 173,
                name: "Jabulani 'Jabu' Sithole",
                age: 17,
                team: "Lubombo Leopards U-17",
                position: "Central Defensive Midfielder",
                photoUrl: "https://i.pravatar.cc/300?u=youth172",
                bio: "The anchor of his team's midfield. Jabu is a tenacious ball-winner with an impressive tactical understanding of the game. He breaks up opposition attacks and initiates his own team's forward movements with simple, intelligent passes."
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
        name: "Schools Football Championship",
        description: "The bedrock of talent identification and a celebrated part of Eswatini's sporting culture. School tournaments, from primary to high school levels, are fiercely competitive and often provide the first platform for future national stars to showcase their abilities.",
        teams: [
            { id: 9001, name: "Waterford Kamhlaba", crestUrl: "https://via.placeholder.com/64/1E3A8A/FFFFFF?text=WK" },
            { id: 9002, name: "Sifundzani High School", crestUrl: "https://via.placeholder.com/64/D63031/FFFFFF?text=SHS" },
            { id: 9003, name: "Mbabane Central High", crestUrl: "https://via.placeholder.com/64/FBBF24/000000?text=MCH" },
            { id: 9004, name: "Evelyn Baring High", crestUrl: "https://via.placeholder.com/64/34D399/000000?text=EBH" },
            { id: 9005, name: "Salesian High School", crestUrl: "https://via.placeholder.com/64/6B7280/FFFFFF?text=SH" },
            { id: 9006, name: "St. Francis High", crestUrl: "https://via.placeholder.com/64/EF4444/FFFFFF?text=SFH" },
            { id: 9007, name: "Manzini Nazarene High", crestUrl: "https://via.placeholder.com/64/3B82F6/FFFFFF?text=MNH" },
            { id: 9008, name: "St. Marks High", crestUrl: "https://via.placeholder.com/64/14B8A6/FFFFFF?text=SMH" },
        ],
        risingStars: [
             {
                id: 901,
                name: "Sandziso 'The Rocket' Mamba",
                age: 17,
                team: "Salesian High School",
                position: "Full-back / Winger",
                photoUrl: "https://i.pravatar.cc/300?u=youth901",
                bio: "A versatile and incredibly fast player who dominates the entire left flank. Sandziso's blistering recovery speed makes him a formidable defender, while his attacking overlaps and crossing ability create numerous scoring chances. A standout in the recent schools championship."
            }
        ],
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
        name: "Build It Under-13 National Final Competition",
        description: "A national spectacle covering the whole country. The Build It U-13 competition is the ultimate test for the youngest talents, emphasizing fundamental skills, sportsmanship, and fun on a grand stage.",
        teams: [
            { id: 1301, name: "Mbabane Future Stars", crestUrl: "https://via.placeholder.com/64/1E3A8A/FFFFFF?text=FS" },
            { id: 1302, name: "Manzini Youngsters", crestUrl: "https://via.placeholder.com/64/D63031/FFFFFF?text=MY" },
            { id: 1303, name: "Siteki Pros U-13", crestUrl: "https://via.placeholder.com/64/3B82F6/FFFFFF?text=SP" },
            { id: 1304, name: "Nhlangano Football Kids", crestUrl: "https://via.placeholder.com/64/10B981/FFFFFF?text=NK" },
            { id: 1305, name: "Eagles Nest Academy", crestUrl: "https://via.placeholder.com/64/F59E0B/000000?text=EN" },
            { id: 1306, name: "Simunye Colts", crestUrl: "https://via.placeholder.com/64/6D28D9/FFFFFF?text=SC" },
        ],
        risingStars: [], // No rising stars for U-13 to emphasize development over individual accolades
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
