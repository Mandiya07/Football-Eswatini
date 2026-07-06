import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

const PWAInstallBanner: React.FC = () => {
  const [isInstallable, setIsInstallable] = useState((window as any).isPWAInstallable?.() || false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const runningStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(runningStandalone);

    // If already in standalone or previously dismissed, don't show the banner
    const isDismissed = localStorage.getItem('pwa-install-banner-dismissed') === 'true';
    
    if (runningStandalone || isDismissed) {
      return;
    }

    // Delay visibility slightly to not overwhelm the user immediately on mount
    const timer = setTimeout(() => {
      if ((window as any).isPWAInstallable?.() || isInstallable) {
        setIsVisible(true);
      }
    }, 4000);

    const handlePromptAvailable = () => {
      setIsInstallable(true);
      if (!runningStandalone && localStorage.getItem('pwa-install-banner-dismissed') !== 'true') {
        setIsVisible(true);
      }
    };

    const handlePromptUsed = () => {
      setIsInstallable(false);
      setIsVisible(false);
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-prompt-used', handlePromptUsed);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-prompt-used', handlePromptUsed);
    };
  }, [isInstallable]);

  const handleInstall = async () => {
    setIsVisible(false);
    const success = await (window as any).installPWA?.();
    if (success) {
      setIsStandalone(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this device/session
    localStorage.setItem('pwa-install-banner-dismissed', 'true');
  };

  // Only display if the PWA is installable, the banner is active, and we are not already standalone
  if (!isVisible || isStandalone || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-[9999] animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-start gap-3">
        {/* App Icon Mockup */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center shadow-md shrink-0 border border-blue-100 overflow-hidden">
          <img src="/icon-192.png" alt="App Icon" className="w-full h-full object-cover" />
        </div>
        
        {/* Content */}
        <div className="flex-grow min-w-0 pr-2">
          <div className="flex justify-between items-start">
            <h4 className="font-extrabold text-sm text-gray-900 truncate">Football Eswatini App</h4>
            <button 
              onClick={handleDismiss} 
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
            Install on your home screen for real-time live match updates, native push notifications, and offline access!
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3.5">
            <button
              onClick={handleInstall}
              className="flex-grow h-9 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 h-9 text-gray-400 hover:text-gray-600 font-bold text-xs hover:bg-gray-50 rounded-xl transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;
