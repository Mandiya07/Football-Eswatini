
import React from 'react';
import { Card } from './ui/Card';
import { Video } from '../data/videos';
import PlayIcon from './icons/PlayIcon';

const VideoCard: React.FC<{ video: Video; onPlay: (video: Video) => void }> = React.memo(({ video, onPlay }) => {
    return (
        <Card 
            className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            onClick={() => onPlay(video)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPlay(video)}}
            tabIndex={0}
            role="button"
            aria-label={`Play video: ${video.title}`}
        >
            <img src={video.thumbnailUrl} alt={video.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                    <PlayIcon className="w-8 h-8 text-white ml-1" />
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="absolute top-4 right-4 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-md">{video.duration}</span>
                <h3 className="text-white text-lg font-bold font-display leading-tight">{video.title}</h3>
            </div>
        </Card>
    );
});

export default VideoCard;
