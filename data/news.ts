
export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  imageUrl?: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  url?: string;
}

export const newsData: NewsItem[] = [];
