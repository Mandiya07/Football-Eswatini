
import React, { useState } from 'react';
import RefreshIcon from './icons/RefreshIcon';
import MaximizeIcon from './icons/MaximizeIcon';
import SmartphoneIcon from './icons/SmartphoneIcon';
import XIcon from './icons/XIcon';
import Tooltip from './ui/Tooltip';

interface SystemToolbarProps {
  isPreviewActive: boolean;
  onTogglePreview: () => void;
}

const SystemToolbar: React.FC<SystemToolbarProps> = ({ isPreviewActive, onTogglePreview }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReload = () => {
    if ((window as any).purgeCache) {
      (window as any).purgeCache();
    } else {
      window.location.reload();
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] no-print">
      <div className={`flex flex-col gap-3 items-center transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        
        {/* Fullscreen Toggle */}
        <button 
          onClick={handleFullscreen}
          className="w-12 h-12 bg-white text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-200"
          title="Toggle Fullscreen"
        >
          <MaximizeIcon className="w-5 h-5" />
        </button>

        {/* Hard Reload */}
        <button 
          onClick={handleReload}
          className="w-12 h-12 bg-white text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-slate-200"
          title="Reload App"
        >
          <RefreshIcon className="w-5 h-5" />
        </button>

        {/* Device Preview Toggle */}
        <button 
          onClick={onTogglePreview}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border ${
            isPreviewActive ? 'bg-primary text-white border-primary' : 'bg-white text-slate-900 border-slate-200'
          }`}
          title="Select Device Preview"
        >
          <SmartphoneIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Main FAB Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`mt-3 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:rotate-90 ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-primary text-white scale-110'
        }`}
      >
        {isOpen ? <XIcon className="w-6 h-6" /> : (
            <div className="flex flex-col gap-1 items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
        )}
      </button>
    </div>
  );
};

export default SystemToolbar;
