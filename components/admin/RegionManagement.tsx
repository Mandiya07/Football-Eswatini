
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { fetchRegionConfigs, updateRegionConfig, RegionConfig, handleFirestoreError } from '../../services/api';
import GlobeIcon from '../icons/GlobeIcon';
import ImageUploader from '../ui/ImageUploader';
import CheckCircleIcon from '../icons/CheckCircleIcon';

const RegionManagement: React.FC = () => {
    const [regions, setRegions] = useState<RegionConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [successId, setSuccessId] = useState<string | null>(null);

    const defaultRegions = [
        { id: 'hhohho', name: 'Hhohho', color: 'from-blue-600 to-blue-800', description: 'Home to the capital city clubs and elite regional development programs.' },
        { id: 'manzini', name: 'Manzini', color: 'from-yellow-500 to-yellow-700', description: 'The hub of football activity in Eswatini with intense regional rivalries.' },
        { id: 'lubombo', name: 'Lubombo', color: 'from-green-600 to-green-800', description: 'Nurturing talent in the eastern lowveld with a focus on community tournaments.' },
        { id: 'shiselweni', name: 'Shiselweni', color: 'from-red-600 to-red-800', description: 'Developing the future of football in the southern regions of the Kingdom.' },
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchRegionConfigs();
            if (data.length === 0) {
                // Initialize defaults if missing
                setRegions(defaultRegions as RegionConfig[]);
            } else {
                setRegions(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdate = async (id: string, field: keyof RegionConfig, value: string) => {
        const updated = regions.map(r => r.id === id ? { ...r, [field]: value } : r);
        setRegions(updated);
    };

    const handleSave = async (region: RegionConfig) => {
        setSavingId(region.id);
        try {
            await updateRegionConfig(region.id, region);
            setSuccessId(region.id);
            setTimeout(() => setSuccessId(null), 3000);
        } catch (error) {
            alert("Failed to save region configuration.");
        } finally {
            setSavingId(null);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <GlobeIcon className="w-8 h-8 text-primary" />
                    <div>
                        <h3 className="text-2xl font-bold font-display">Regional Hub Management</h3>
                        <p className="text-sm text-gray-500">Customize regional descriptions and upload official association logos.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {regions.map(region => (
                        <div key={region.id} className="p-5 border rounded-2xl bg-gray-50 flex flex-col gap-4 group">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-white border p-2 flex items-center justify-center shadow-sm">
                                        {region.logoUrl ? (
                                            <img src={region.logoUrl} className="max-h-full max-w-full object-contain" alt="" />
                                        ) : (
                                            <GlobeIcon className="w-8 h-8 text-gray-200" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{region.name}</h4>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">ID: {region.id}</p>
                                    </div>
                                </div>
                                {successId === region.id && <CheckCircleIcon className="w-6 h-6 text-green-500 animate-in zoom-in" />}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Official Logo</label>
                                <ImageUploader 
                                    onUpload={(base64) => handleUpdate(region.id, 'logoUrl', base64)}
                                    status={savingId === region.id ? 'saving' : undefined}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Description</label>
                                <textarea 
                                    value={region.description} 
                                    onChange={e => handleUpdate(region.id, 'description', e.target.value)}
                                    rows={3}
                                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="text-right">
                                <Button 
                                    onClick={() => handleSave(region)} 
                                    disabled={savingId === region.id}
                                    className="bg-primary text-white text-xs h-9 px-6 font-bold"
                                >
                                    {savingId === region.id ? <Spinner className="w-4 h-4 border-white" /> : 'Save Region'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default RegionManagement;
