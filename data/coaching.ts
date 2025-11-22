
export interface Coach {
  id: string;
  name: string;
  credentials: string;
  photoUrl: string;
}

export interface CoachingContent {
  id: string;
  type: 'Tactic' | 'Drill' | 'Column' | 'Video' | 'Audio';
  title: string;
  summary: string;
  imageUrl?: string; // for articles
  thumbnailUrl?: string; // for videos
  videoUrl?: string;
  audioUrl?: string;
  duration?: string;
  author: Coach | string;
  isFeatured?: boolean;
}

export const coaches: Coach[] = [
  {
    id: 'coach-1',
    name: 'Jabu "Shuffle" Mabuza',
    credentials: 'CAF A License, Former Sihlangu Coach',
    photoUrl: 'https://i.pravatar.cc/150?u=coach1',
  },
  {
    id: 'coach-2',
    name: 'Anna Schmidt',
    credentials: 'UEFA Pro License, Youth Development Expert',
    photoUrl: 'https://i.pravatar.cc/150?u=coach2',
  },
];

export const coachingContent: CoachingContent[] = [
  {
    id: 'feat-1',
    type: 'Tactic',
    title: 'Mastering the 4-4-2 Diamond Midfield',
    summary: 'A deep dive into the tactical nuances of the 4-4-2 diamond, exploring its strengths in controlling the center of the park and creating attacking overloads.',
    imageUrl: 'https://picsum.photos/seed/tactic1/800/450',
    author: coaches[0],
    isFeatured: true,
  },
  {
    id: 'vid-1',
    type: 'Video',
    title: 'Video Lesson: Defensive Positioning for Full-Backs',
    summary: 'Watch and learn the key principles of modern full-back defending, from body shape to when to press vs. when to drop off.',
    thumbnailUrl: 'https://picsum.photos/seed/coachvid1/600/400',
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    duration: '08:15',
    author: 'Football Eswatini Analysis',
  },
  {
    id: 'drill-1',
    type: 'Drill',
    title: 'Passing Drill: The Rondo',
    summary: 'Improve your team\'s short passing, movement, and pressing with this classic and highly effective training drill. Includes variations for all skill levels.',
    imageUrl: 'https://picsum.photos/seed/drill1/600/400',
    author: 'Football Eswatini Analysis',
  },
  {
    id: 'col-1',
    type: 'Column',
    title: 'Guest Column: The Importance of Youth Scouting',
    summary: 'International youth development expert Anna Schmidt shares her insights on how to identify and nurture young talent effectively.',
    imageUrl: 'https://picsum.photos/seed/col1/600/400',
    author: coaches[1],
  },
  {
    id: 'tactic-2',
    type: 'Tactic',
    title: 'Analyzing the High Press (Gegenpressing)',
    summary: 'Breaking down the principles of a successful high press, its triggers, and the risks involved. Learn how to implement it with your team.',
    imageUrl: 'https://picsum.photos/seed/tactic2/600/400',
    author: coaches[0],
  },
    {
    id: 'vid-2',
    type: 'Video',
    title: 'Video Lesson: Finishing Drills for Strikers',
    summary: 'A series of dynamic shooting drills designed to improve accuracy, power, and composure in front of goal for forwards.',
    thumbnailUrl: 'https://picsum.photos/seed/coachvid2/600/400',
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    duration: '11:45',
    author: 'Football Eswatini Analysis',
  },
];