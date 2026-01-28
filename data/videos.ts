
export interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    description: string;
    date?: string; // ISO date string YYYY-MM-DD
    category: 'highlight' | 'recap' | 'fan';
}

export const videoData: Video[] = [
    // Videos are now fetched from Firestore 'videos' collection.
];
