
export interface Coach {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  bio?: string;
  credentials?: string;
}

export interface CoachingContent {
  id: string;
  title: string;
  description: string;
  author: string | Coach;
  date: string;
  category: 'tactics' | 'training' | 'psychology' | 'nutrition';
  content: string;
  videoUrl?: string;
  attachments?: string[];
  imageUrl?: string;
  type?: 'video' | 'article' | 'drill' | 'Tactic' | 'Drill' | 'Video' | 'Column';
  summary?: string;
  isFeatured?: boolean;
  duration?: string;
  thumbnailUrl?: string;
}

export const coachingContent: CoachingContent[] = [];
