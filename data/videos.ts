export interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    description: string;
    category: 'highlight' | 'recap' | 'fan';
}

// Using placeholder video and image URLs
export const videoData: Video[] = [
    {
        id: '1',
        title: "Goal of the Week: Highlanders vs Swallows",
        thumbnailUrl: "https://picsum.photos/seed/vid1/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        duration: "1:23",
        description: "Relive the stunning last-minute goal from the intense derby between Mbabane Highlanders and Mbabane Swallows. A contender for goal of the season!",
        category: 'highlight',
    },
    {
        id: '2',
        title: "Post-Match Interview with Green Mamba Coach",
        thumbnailUrl: "https://picsum.photos/seed/vid2/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        duration: "5:45",
        description: "Green Mamba's head coach shares his thoughts on the team's performance, tactical decisions, and what to expect in the upcoming matches.",
        category: 'highlight',
    },
    {
        id: '7',
        title: "This Week in Eswatini Football - Ep. 5",
        thumbnailUrl: "https://picsum.photos/seed/recap1/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: "12:30",
        description: "Join us for the latest episode where we break down all the action from the Premier League, analyze key performances, and look ahead to next week's fixtures.",
        category: 'recap',
    },
    {
        id: '8',
        title: "This Week in Eswatini Football - Ep. 4",
        thumbnailUrl: "https://picsum.photos/seed/recap2/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        duration: "11:45",
        description: "A look back at the biggest stories from the previous gameweek, including controversial decisions and standout players.",
        category: 'recap',
    },
    {
        id: '3',
        title: "Top 5 Saves from Last Weekend's Games",
        thumbnailUrl: "https://picsum.photos/seed/vid3/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        duration: "3:12",
        description: "A compilation of the most acrobatic and game-changing saves from goalkeepers across the league during the last round of fixtures.",
        category: 'highlight',
    },
    {
        id: '9',
        title: "Fan Vlog: My Derby Day Experience!",
        thumbnailUrl: "https://picsum.photos/seed/fan1/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        duration: "8:15",
        description: "Follow along as one passionate fan takes you through the highs and lows of the electrifying Mbabane derby from the stadium stands.",
        category: 'fan',
    },
    {
        id: '5',
        title: "Fan Cam: Derby Day Atmosphere",
        thumbnailUrl: "https://picsum.photos/seed/vid5/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        duration: "2:50",
        description: "Experience the passion and energy of the fans on derby day. The chants, the colors, and the unforgettable atmosphere.",
        category: 'fan',
    },
    {
        id: '4',
        title: "Young Buffaloes: Training Ground Drills",
        thumbnailUrl: "https://picsum.photos/seed/vid4/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        duration: "4:05",
        description: "An exclusive look into a high-intensity training session with the Young Buffaloes squad as they prepare for their next big match.",
        category: 'highlight',
    },
    {
        id: '6',
        title: "Tactics Board: How Royal Leopards Broke the Deadlock",
        thumbnailUrl: "https://picsum.photos/seed/vid6/600/400",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        duration: "6:18",
        description: "A deep-dive analysis into the tactical shift that allowed Royal Leopards to secure a crucial victory in their latest game.",
        category: 'highlight',
    },
];