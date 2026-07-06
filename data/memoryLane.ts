
import { Video } from './videos';

export interface OnThisDayEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string;
  year: number;
  month?: number;
  day?: number;
}

export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  type: 'photo' | 'match' | 'clip' | 'video' | 'article';
  url?: string;
  thumbnail?: string;
  tags?: string[];
  details?: ArchiveMatch | ArchivePhoto | ArchiveClip | string;
  year?: number;
}

export interface ArchiveClip {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  video: Video;
}

export interface ArchiveMatch {
  id: string;
  title: string;
  date: string;
  score: string;
  competition: string;
  teams: string;
}

export interface ArchivePhoto {
  id: string;
  url: string;
  imageUrl: string;
  caption: string;
}

export const onThisDayData: OnThisDayEvent[] = [];
export const archiveData: ArchiveItem[] = [];
