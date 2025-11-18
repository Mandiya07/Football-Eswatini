
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { BehindTheScenesContent } from '../data/media';
// FIX: Import 'fetchBehindTheScenesData' which is now correctly exported from the API service.
import { fetchBehindTheScenesData } from '../services/api';
import PlayIcon from './icons/PlayIcon';
import Spinner from './ui/Spinner';
import VideoModal from './VideoModal';
import { Video } from '../data/videos';

const BehindTheScenes: React.FC = () => {
    const [content, setContent] = useState<BehindTheScenesContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchBehindTheScenesData();
            setContent(data);
            setLoading(false);
        };
        loadData();
    }, []);

    const handlePlayVideo = (item: BehindTheScenesContent) => {
        if (item.type !== 'video') return;
        const video: Video = {
            id: item.id.toString(),
            title: item.title,
            description: item.description,
            thumbnailUrl: item.thumbnailUrl,
            videoUrl: item.contentUrl,
            duration: '', // Duration not available in this data model
            category: 'fan', // Placeholder
        };
        setSelectedVideo(video);
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Spinner /></div>;
    }

    return (
        <>
            <div className="max-w-2xl mx-auto space-y-8">
                {content.map(item => (
                    <Card 
                        key={item.id} 
                        className="shadow-lg transition-shadow duration-300 hover:shadow-xl"
                        onClick={() => handlePlayVideo(item)}
                        role={item.type === 'video' ? 'button' : undefined}
                        tabIndex={item.type === 'video' ? 0 : -1}
                        aria-label={item.type === 'video' ? `Play video: ${item.title}` : undefined}
                    >
                        <div className={`relative ${item.type === 'video' ? 'cursor-pointer group' : ''}`}>
                            <img src={item.thumbnailUrl} alt={item.title} loading="lazy" className="w-full h-64 object-cover" />
                            {item.type === 'video' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                                    <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                                        <PlayIcon className="w-8 h-8 text-white ml-1" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <CardContent className="p-6">
                            <h3 className="font-bold font-display text-xl mb-2">{item.title}</h3>
                            <p className="text-gray-600">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </>
    );
};

export default BehindTheScenes;