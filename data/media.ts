
export interface PhotoAlbum {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  coverUrl?: string;
  photos: string[];
  imageUrls?: string[];
  date: string;
  category: string;
}

export interface BehindTheScenesContent {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailUrl?: string;
  videoUrl: string;
  contentUrl?: string;
  date: string;
  duration: string;
  category: string;
  type?: 'video' | 'article' | 'gallery';
}

export const photoAlbums: PhotoAlbum[] = [];
export const behindTheScenesData: BehindTheScenesContent[] = [];
