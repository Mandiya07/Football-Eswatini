
export interface PodcastEpisode {
    id: string;
    title: string;
    topics: string[];
    audioUrl: string; // Base64 or URL
    transcript: string;
    coverArtUrl?: string;
    createdAt: any;
    author: string;
}
