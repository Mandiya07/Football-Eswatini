
import React, { useState, useMemo, useEffect } from 'react';
import { Video } from '../data/videos';
import { fetchVideos, sortByLatest } from '../services/api';
import VideoModal from './VideoModal';
import VideoCard from './VideoCard';
import Spinner from './ui/Spinner';

type VideoCategory = 'highlight' | 'recap' | 'fan';

const Highlights: React.FC = () => {
    const [activeTab, setActiveTab] = useState<VideoCategory>('highlight');
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [allVideos, setAllVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadVideos = async () => {
            setLoading(true);
            const data = await fetchVideos();
            setAllVideos(data);
            setLoading(false);
        };
        loadVideos();
    }, []);

    const filteredVideos = useMemo(() => {
        // Filter by category first, then apply descending sort (newest first)
        const categorized = allVideos.filter(video => video.category === activeTab);
        return sortByLatest(categorized);
    }, [activeTab, allVideos]);

    const handlePlayVideo = (video: Video) => {
        setSelectedVideo(video);
    };

    const handleCloseModal = () => {
        setSelectedVideo(null);
    };
    
    const TabButton: React.FC<{ tabName: VideoCategory; children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                activeTab === tabName 
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={activeTab === tabName}
        >
            {children}
        </button>
    );

    return (
        <section>
          <h2 className="text-3xl font-display font-bold mb-8 text-center">Video Hub</h2>
          
          <div className="border-b border-gray-200 mb-8">
            <div className="-mb-px flex justify-center space-x-4" role="tablist" aria-label="Video Hub">
                <TabButton tabName="highlight">Highlights</TabButton>
                <TabButton tabName="recap">Weekly Recap</TabButton>
                <TabButton tabName="fan">Fan Zone</TabButton>
            </div>
        </div>
            
          {loading ? (
             <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVideos.length > 0 ? filteredVideos.map(video => (
                  <VideoCard key={video.id} video={video} onPlay={handlePlayVideo} />
                )) : <p className="text-center text-gray-500 col-span-3">No videos in this category yet.</p>}
              </div>
          )}

          {selectedVideo && <VideoModal video={selectedVideo} onClose={handleCloseModal} />}
        </section>
      );
};

export default Highlights;
