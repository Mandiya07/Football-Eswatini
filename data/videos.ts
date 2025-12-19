export interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: string;
    description: string;
    category: 'highlight' | 'recap' | 'fan';
}

export const videoData: Video[] = [
    // Videos are now fetched from Firestore 'videos' collection.
];