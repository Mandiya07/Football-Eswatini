
export interface ExclusiveItem {
    id: string;
    title: string;
    summary: string;
    content: string; // Full text or link
    imageUrl: string;
    videoUrl?: string;
    audioUrl?: string;
    author: string;
    role: string; // e.g., "FIFA Representative", "PLE CEO"
    date: string;
}

export interface TeamYamVideo {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    teamName: string;
    uploadedBy: string;
    date: string;
    likes: number;
}

export const initialExclusiveContent: ExclusiveItem[] = [
    {
        id: 'exc-1',
        title: "Vision 2025: An Interview with the EFA President",
        summary: "We sat down with the Eswatini Football Association President to discuss the roadmap for the national team and infrastructure development.",
        content: "In this candid interview, the President outlines the strategic goals for the next two years, emphasizing youth development academies in all four regions and the upgrade of Somhlolo National Stadium...",
        imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
        author: "Peter Dlamini",
        role: "EFA President",
        date: "2023-11-01"
    },
    {
        id: 'exc-2',
        title: "From Mhlume to Madrid: A Scout's Diary",
        summary: "Top international scout shares insights on what European clubs are looking for in Eswatini talent.",
        content: "Technical ability is a given, but what sets players apart at the elite level is mental resilience and tactical discipline...",
        imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d64b8?auto=format&fit=crop&w=800&q=80",
        author: "Carlos Fernandez",
        role: "La Liga Scout",
        date: "2023-10-25"
    }
];

export const initialTeamYamVideos: TeamYamVideo[] = [
    {
        id: 'yam-1',
        title: "Highlanders Fan Chant - Derby Day",
        description: "The Gwaza Nkunzi faithful in full voice at Somhlolo!",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        thumbnailUrl: "https://via.placeholder.com/600x400/000000/FFFFFF?text=Highlanders+Fans",
        teamName: "Mbabane Highlanders",
        uploadedBy: "Sipho M.",
        date: "2023-10-28",
        likes: 124
    },
    {
        id: 'yam-2',
        title: "Green Mamba Warm Up Routine",
        description: "Behind the scenes look at the pre-match prep.",
        videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnailUrl: "https://via.placeholder.com/600x400/1E4620/FFFFFF?text=Green+Mamba",
        teamName: "Green Mamba",
        uploadedBy: "Media Team",
        date: "2023-11-02",
        likes: 85
    }
];
