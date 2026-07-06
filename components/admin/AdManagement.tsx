
import React, { useState, useEffect } from 'react';
import { fetchAllAds, updateAd, Ad, handleFirestoreError, OperationType } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PencilIcon from '../icons/PencilIcon';
import AdFormModal from './AdFormModal';
import { AD_PLACEMENT_SPECS } from '../AdBanner';

interface AdPlacement {
    id: string;
    name: string;
    dimensions: string;
    type: 'banner' | 'sidebar';
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
            const adPlacements = Object.entries(AD_PLACEMENT_SPECS).map(([id, spec]) => ({
                id,
                name: spec.name,
                dimensions: spec.dimensions,
                type: spec.type,
                data: adsData[id] || { imageUrl: '', link: '', altText: '' }
            }));
            setPlacements(adPlacements);
        } catch (err) {
            handleFirestoreError(err, OperationType.GET, 'ads');
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
            handleFirestoreError(error, OperationType.UPDATE, `ads/${id}`);
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {placements.map(placement => {
                                const isSidebar = placement.type === 'sidebar';
                                return (
                                    <div key={placement.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-base">{placement.name}</h4>
                                                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{placement.id}</p>
                                                    <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                                        Standard Size: {placement.dimensions}
                                                    </span>
                                                </div>
                                                <Button onClick={() => handleEdit(placement)} className="bg-slate-50 text-slate-700 hover:bg-slate-100 h-9 w-9 p-0 flex items-center justify-center rounded-xl border border-slate-200 shadow-sm transition-all" aria-label={`Edit ${placement.name}`}>
                                                    <PencilIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            
                                            <div className="my-4 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/60 p-4">
                                                <div className={`relative overflow-hidden border border-slate-200 rounded shadow-sm bg-white flex items-center justify-center ${
                                                    isSidebar ? 'w-[150px] h-[125px] aspect-[300/250]' : 'w-full max-w-[290px] h-[36px] aspect-[728/90]'
                                                }`}>
                                                    {placement.data.imageUrl ? (
                                                        <img 
                                                            src={placement.data.imageUrl} 
                                                            alt={placement.data.altText || 'Ad preview'} 
                                                            className="w-full h-full object-contain" 
                                                        />
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 italic font-medium">No asset uploaded</span>
                                                    )}
                                                    <span className="absolute top-1 right-1 bg-black/60 text-white text-[6px] font-bold px-1 rounded pointer-events-none uppercase">
                                                        AD
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-gray-400 uppercase text-[9px]">Target Link:</span>
                                                <span className="text-blue-600 truncate max-w-[200px] font-medium">{placement.data.link || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-gray-400 uppercase text-[9px]">Alt Text:</span>
                                                <span className="text-gray-600 truncate max-w-[200px]">{placement.data.altText || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
