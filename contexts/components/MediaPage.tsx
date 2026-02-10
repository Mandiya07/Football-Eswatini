import React, { useState } from 'react';
import Highlights from './Highlights';
import PhotoGallery from './PhotoGallery';
import BehindTheScenes from './BehindTheScenes';
import { PhotoAlbum } from '../data/media';
import PhotoGalleryModal from './PhotoGalleryModal';
import FilmIcon from './icons/FilmIcon';
import PhotoIcon from './icons/PhotoIcon';
import CameraIcon from './icons/CameraIcon';

type MediaTab = 'videos' | 'photos' | 'bts';

const MediaPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MediaTab>('videos');
    const [selectedAlbum, setSelectedAlbum] = useState<PhotoAlbum | null>(null);

    const handleOpenAlbum = (album: PhotoAlbum) => setSelectedAlbum(album);
    const handleCloseAlbum = () => setSelectedAlbum(null);

    const TabButton: React.FC<{tabName: MediaTab; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>}> = ({ tabName, label, Icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                activeTab === tabName 
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            role="tab"
            aria-selected={activeTab === tabName}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

  return (
    <div className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                    Media Hub
                </h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Your front-row seat to the action. Explore highlights, photo galleries, and exclusive behind-the-scenes content.
                </p>
            </div>
            
            <div className="border-b border-gray-200 mb-8">
                <div className="-mb-px flex justify-center space-x-2 md:space-x-8" role="tablist" aria-label="Media Hub">
                    <TabButton tabName="videos" label="Videos & Reels" Icon={FilmIcon} />
                    <TabButton tabName="photos" label="Photo Galleries" Icon={PhotoIcon} />
                    <TabButton tabName="bts" label="Behind the Scenes" Icon={CameraIcon} />
                </div>
            </div>

            <div>
                {activeTab === 'videos' && <Highlights />}
                {activeTab === 'photos' && <PhotoGallery onAlbumClick={handleOpenAlbum} />}
                {activeTab === 'bts' && <BehindTheScenes />}
            </div>
        </div>
        
        {selectedAlbum && <PhotoGalleryModal album={selectedAlbum} onClose={handleCloseAlbum} />}

    </div>
  );
};

export default MediaPage;