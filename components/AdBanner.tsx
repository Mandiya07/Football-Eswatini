import React, { useState, useEffect } from 'react';
import { fetchAd, Ad } from '../services/api';
import Skeleton from './ui/Skeleton';

interface AdBannerProps {
  placement: string;
  className?: string;
}

export const AD_PLACEMENT_SPECS: Record<string, {
    name: string;
    dimensions: string;
    type: 'banner' | 'sidebar';
    containerClass: string;
    skeletonClass: string;
}> = {
    'homepage-banner': {
        name: 'Homepage Banner (Top)',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'homepage-sidebar': {
        name: 'Homepage Sidebar Ad',
        dimensions: '300x250 (Medium Rectangle)',
        type: 'sidebar',
        containerClass: 'w-[300px] h-[250px] mx-auto',
        skeletonClass: 'w-[300px] h-[250px] mx-auto'
    },
    'fixtures-banner': {
        name: 'Fixtures & Results Banner',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'live-scoreboard-banner': {
        name: 'Live Match Center Banner',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'news-listing-top-banner': {
        name: 'News Listing Header',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'news-article-top-banner': {
        name: 'News Article Content Ad',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'news-article-bottom-banner': {
        name: 'News Article Footer Ad',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'community-hub-banner': {
        name: 'Community Hub Section Header',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'directory-banner': {
        name: 'Directory Listings Banner',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    },
    'interactive-zone-banner': {
        name: 'Interactive Zone Header',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner',
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    }
};

const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);

    const spec = AD_PLACEMENT_SPECS[placement] || {
        name: 'Standard Banner',
        dimensions: '728x90 (Desktop) / 320x50 (Mobile)',
        type: 'banner' as const,
        containerClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto',
        skeletonClass: 'w-[320px] h-[50px] md:w-[728px] md:h-[90px] mx-auto'
    };

    useEffect(() => {
        const loadAd = async () => {
            setLoading(true);
            const adData = await fetchAd(placement);
            setAd(adData);
            setLoading(false);
        };
        loadAd();
    }, [placement]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${spec.skeletonClass} ${className}`}>
                <Skeleton className="w-full h-full rounded-lg" />
            </div>
        );
    }

    if (!ad || !ad.imageUrl) {
        return null; // Don't render anything if the ad is not found or has no image URL
    }

    return (
        <div className={`relative group rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-slate-50 transition-all duration-300 hover:shadow-md ${spec.containerClass} ${className}`}>
            <a href={ad.link} target="_blank" rel="noopener sponsored" aria-label={ad.altText} className="block w-full h-full">
                <img 
                    src={ad.imageUrl} 
                    alt={ad.altText} 
                    className="w-full h-full object-contain md:object-cover hover:scale-[1.01] transition-transform duration-300" 
                />
            </a>
            <span className="absolute top-1.5 right-1.5 bg-black/75 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm pointer-events-none select-none">
                AD
            </span>
        </div>
    );
};

export default AdBanner;
