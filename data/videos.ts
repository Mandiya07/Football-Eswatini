
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  date: string;
  duration: string;
  category: string;
  views?: number;
}

export const videoData: Video[] = [];
