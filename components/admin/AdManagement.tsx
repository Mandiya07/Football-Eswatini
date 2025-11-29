
import React, { useState, useEffect } from 'react';
import { fetchAllAds, updateAd, Ad } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PencilIcon from '../icons/PencilIcon';
import AdFormModal from './AdFormModal';

interface AdPlacement {
    id: string;
    name: string;
    data: Ad;
}

const AdManagement: React.FC = () => {
    const [placements, setPlacements] = useState<AdPlacement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null);
    const [error, setError] = useState('');

    const loadAds = async () => {
        setLoading(true);
        setError('');
        try {
            const adsData = await fetchAllAds();
            const placementDetails = [
                { id: 'homepage-banner', name: 'Homepage Banner' },
                { id: 'fixtures-banner', name: 'Fixtures & Results Banner' },
                { id: 'live-scoreboard-banner', name: 'Live Scoreboard Banner' },
                { id: 'news-listing-top-banner', name: 'News Listing Banner' },
                { id: 'news-article-top-banner', name: 'News Article Banner' },
                { id: 'community-hub-banner', name: 'Community Football Hub Banner' },
                { id: 'directory-banner', name: 'Directory Listings Banner' },
                { id: 'interactive-zone-banner', name: 'Interactive Zone Banner' },
            ];
            const adPlacements = placementDetails.map(p => ({
                ...p,
                data: adsData[p.id] || { imageUrl: '', link: '', altText: '' }
            }));
            setPlacements(adPlacements);
        } catch (err) {
            setError('Failed to load advertisement data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAds();
    }, []);

    const handleEdit = (placement: AdPlacement) => {
        setEditingPlacement(placement);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Ad, id?: string) => {
        if (!id) return;
        try {
            await updateAd(id, data);
            setIsModalOpen(false);
            loadAds(); // Refresh list
        } catch (error) {
            console.error("Error saving ad:", error);
            alert("Failed to save ad.");
        }
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-1">Ad Management</h3>
                    <p className="text-sm text-gray-600 mb-6">Update the advertisement banners displayed across the site.</p>
                    
                    {error && <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}

                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-4">
                            {placements.map(placement => (
                                <div key={placement.id} className="p-4 bg-white border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold">{placement.name}</h4>
                                            <a href={placement.data.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block max-w-xs">{placement.data.link}</a>
                                        </div>
                                        <Button onClick={() => handleEdit(placement)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center" aria-label={`Edit ${placement.name}`}>
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <img src={placement.data.imageUrl} alt={placement.data.altText || 'Ad preview'} className="mt-2 h-24 w-auto rounded-md object-contain border p-1 bg-gray-50" />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && editingPlacement && (
                <AdFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    placement={editingPlacement}
                />
            )}
        </>
    );
};

export default AdManagement;
