export interface NewsItem {
  id: string;
  image: string;
  title: string;
  date: string;
  url: string;
  category: string | string[];
  summary: string;
  content: string;
}

export const newsData: NewsItem[] = [
  // Live news is pulled from Firestore 'news' collection.
  // This array is kept minimal to avoid cluttering the UI with stale mock data.
];