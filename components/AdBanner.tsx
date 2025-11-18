import React, { useState, useEffect } from 'react';
import { fetchAd, Ad } from '../services/api';
import Skeleton from './ui/Skeleton';

interface AdBannerProps {
  placement: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ placement, className = '' }) => {
    const [ad, setAd] = useState<Ad | null>(null);
    const [loading, setLoading] = useState(true);

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
        return <Skeleton className={`w-full h-24 ${className}`} />;
    }

    if (!ad) {
        return null; // Don't render anything if the ad is not found
    }

    return (
        <div className={`relative group w-full rounded-lg overflow-hidden h-24 ${className}`}>
        <a href={ad.link} target="_blank" rel="noopener sponsored" aria-label={ad.altText}>
            <img src={ad.imageUrl} alt={ad.altText} className="w-full h-full object-cover" />
        </a>
        <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
            Advertisement
        </span>
        </div>
    );
};

export default AdBanner;