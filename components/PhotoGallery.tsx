
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { PhotoAlbum } from '../data/media';
// FIX: Import 'fetchPhotoGalleries' which is now correctly exported from the API service.
import { fetchPhotoGalleries } from '../services/api';
import Skeleton from './ui/Skeleton';

interface PhotoGalleryProps {
    onAlbumClick: (album: PhotoAlbum) => void;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ onAlbumClick }) => {
    const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchPhotoGalleries();
            setAlbums(data);
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-48 w-full" />
                        <div className="p-4 bg-white">
                            <Skeleton className="h-4 w-1/3 mb-2" />
                            <Skeleton className="h-5 w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map(album => (
                <Card 
                    key={album.id}
                    className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
                    onClick={() => onAlbumClick(album)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAlbumClick(album)}}
                    tabIndex={0}
                    role="button"
                    aria-label={`View photo gallery: ${album.title}`}
                >
                    <div className="overflow-hidden">
                        <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">{album.date}</p>
                        <h3 className="text-md font-bold font-display group-hover:text-blue-600 transition-colors">
                           {album.title}
                        </h3>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default PhotoGallery;