
export interface ExclusiveItem {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  imageUrl?: string;
  videoUrl?: string;
  articleContent?: string;
  date: string;
  category: string;
  isPremium: boolean;
  role?: string;
  summary?: string;
  author?: string;
}

export interface TeamYamVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailUrl?: string;
  videoUrl: string;
  date: string;
  duration: string;
  category: string;
  teamName?: string;
  uploadedBy?: string;
}

export const initialExclusiveContent: ExclusiveItem[] = [];
export const initialTeamYamVideos: TeamYamVideo[] = [];
