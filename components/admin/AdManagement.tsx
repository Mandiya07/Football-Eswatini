
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
                { id: 'homepage-banner', name: 'Homepage Banner (Top)' },
                { id: 'homepage-sidebar', name: 'Homepage Sidebar Ad' },
                { id: 'fixtures-banner', name: 'Fixtures & Results Banner' },
                { id: 'live-scoreboard-banner', name: 'Live Match Center Banner' },
                { id: 'news-listing-top-banner', name: 'News Listing Header' },
                { id: 'news-article-top-banner', name: 'News Article Content Ad' },
                { id: 'community-hub-banner', name: 'Community Hub Section Header' },
                { id: 'directory-banner', name: 'Directory Listings Banner' },
                { id: 'interactive-zone-banner', name: 'Interactive Zone Header' },
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
                    <p className="text-sm text-gray-600 mb-6">Update the advertisement banners and sidebar units displayed across the site.</p>
                    
                    {error && <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}

                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {placements.map(placement => (
                                <div key={placement.id} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{placement.name}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{placement.id}</p>
                                        </div>
                                        <Button onClick={() => handleEdit(placement)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 h-8 w-8 p-0 flex items-center justify-center rounded-lg border border-blue-100" aria-label={`Edit ${placement.name}`}>
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="bg-gray-100 rounded-lg h-24 overflow-hidden flex items-center justify-center border border-gray-200">
                                        {placement.data.imageUrl ? (
                                            <img src={placement.data.imageUrl} alt={placement.data.altText || 'Ad preview'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No asset uploaded</span>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Target Link:</p>
                                        <p className="text-xs text-blue-600 truncate font-medium">{placement.data.link || 'N/A'}</p>
                                    </div>
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
