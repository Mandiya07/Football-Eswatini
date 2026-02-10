
import React, { useEffect } from 'react';
import { Video } from '../data/videos';
import VideoPlayer from './VideoPlayer';
import XIcon from './icons/XIcon';

interface VideoModalProps {
  video: Video;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ video, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
    
        return () => {
          window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`video-title-${video.id}`}
    >
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes zoom-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in { animation: zoom-in 0.3s ease-out forwards; }
      `}</style>
      <div 
        className="relative w-full max-w-4xl bg-gray-900 rounded-lg shadow-2xl animate-zoom-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
             <h3 id={`video-title-${video.id}`} className="text-white text-lg font-bold mb-2 truncate">{video.title}</h3>
             <VideoPlayer src={video.videoUrl} title={video.title} />
             <div className="mt-4 text-gray-300">
                <h4 className="font-bold text-white mb-1">Description</h4>
                <p className="text-sm leading-relaxed">{video.description}</p>
             </div>
        </div>
        <button
          onClick={onClose}
          className="sticky top-3 right-3 float-right mr-3 text-gray-400 hover:text-white transition-colors z-10 p-1 bg-black/30 rounded-full"
          aria-label="Close video player"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default VideoModal;
