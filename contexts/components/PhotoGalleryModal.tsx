
import React, { useState, useEffect } from 'react';
import { PhotoAlbum } from '../data/media';
import XIcon from './icons/XIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface PhotoGalleryModalProps {
  album: PhotoAlbum;
  onClose: () => void;
}

const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({ album, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? album.imageUrls.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === album.imageUrls.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);


  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
    >
        <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        `}</style>
        
        <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-[310]"
            aria-label="Close gallery"
        >
            <XIcon className="w-8 h-8" />
        </button>

        <div className="absolute top-4 left-4 text-white z-[310]">
            <h2 id="gallery-title" className="text-xl font-bold">{album.title}</h2>
            <p className="text-sm">{currentIndex + 1} / {album.imageUrls.length}</p>
        </div>

        <button 
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors z-[310]"
            aria-label="Previous image"
        >
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <button 
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors z-[310]"
            aria-label="Next image"
        >
            <ChevronRightIcon className="w-6 h-6" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
                src={album.imageUrls[currentIndex]} 
                alt={`Image ${currentIndex + 1} from ${album.title}`}
                className="max-h-[90vh] max-w-[90vw] object-contain"
            />
        </div>
    </div>
  );
};

export default PhotoGalleryModal;
