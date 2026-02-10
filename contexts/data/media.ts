export interface PhotoAlbum {
    id: number;
    title: string;
    date: string;
    coverUrl: string;
    imageUrls: string[];
}

export interface BehindTheScenesContent {
    id: number;
    type: 'photo' | 'video';
    title: string;
    description: string;
    thumbnailUrl: string;
    contentUrl: string; // URL to video or full-size photo
}
