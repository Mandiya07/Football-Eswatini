
import React, { useState, useEffect } from 'react';
import { ScoutedPlayer, PlayerPosition } from '../../data/scouting';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import { Region } from '../../data/directory';

interface ScoutingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ScoutedPlayer, 'id'>, id?: string) => void;
    player: ScoutedPlayer | null;
}

const ScoutingFormModal: React.FC<ScoutingFormModalProps> = ({ isOpen, onClose, onSave, player }) => {
    const [formData, setFormData] = useState({
        name: '', age: 0, 
        position: 'Forward' as PlayerPosition, 
        region: 'Hhohho' as Region, 
        photoUrl: '', videoUrl: '',
        strengths: '', bio: '', stats: '', contactEmail: ''
    });

    useEffect(() => {
        if (player) {
            const plainStats = player.stats.map(stat => ({ label: stat.label, value: stat.value }));

            setFormData({
                name: player.name,
                age: player.age,
                position: player.position,
                region: player.region,
                photoUrl: player.photoUrl,
                videoUrl: player.videoUrl || '',
                strengths: player.strengths.join(', '),
                bio: player.bio,
                stats: JSON.stringify(plainStats, null, 2),
                contactEmail: player.contactEmail
            });
        } else {
            setFormData({
                name: '', age: 16, position: 'Forward', region: 'Hhohho', photoUrl: '', videoUrl: '',
                strengths: '', bio: '', stats: '[\n  {\n    "label": "Goals",\n    "value": 0\n  }\n]', contactEmail: ''
            });
        }
    }, [player, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            const numValue = parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const fieldName = name === 'photoUpload' ? 'photoUrl' : 'videoUrl';
                    setFormData(prev => ({ ...prev, [fieldName]: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave: any = {
                ...formData,
                strengths: formData.strengths.split(',').map(s => s.trim()),
                stats: JSON.parse(formData.stats)
            };
            // Handle optional video URL
            if (!dataToSave.videoUrl) delete dataToSave.videoUrl;

            onSave(dataToSave, player?.id);
        } catch (error) {
            alert("Error parsing stats JSON. Please ensure it's a valid JSON array.");
        }
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-3xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{player ? 'Edit Scouted Player' : 'Add Scouted Player'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="name" value={formData.name} onChange={handleChange} placeholder="Player Name" required className={inputClass} />
                            <input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Age" required className={inputClass} />
                            <select name="position" value={formData.position} onChange={handleChange} className={inputClass}><option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option></select>
                            <select name="region" value={formData.region} onChange={handleChange} className={inputClass}><option>Hhohho</option><option>Manzini</option><option>Lubombo</option><option>Shiselweni</option></select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL or Upload</label>
                                <input name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="Photo URL" required className={inputClass} />
                                <input name="photoUpload" type="file" onChange={handleFileChange} accept="image/*" className={`${inputClass} mt-2 p-1.5`} />
                                {formData.photoUrl && <img src={formData.photoUrl} alt="Photo preview" className="mt-2 h-24 object-contain border rounded" />}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL or Upload (Optional)</label>
                                <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="Video URL" className={inputClass} />
                                <input name="videoUpload" type="file" onChange={handleFileChange} accept="video/*" className={`${inputClass} mt-2 p-1.5`} />
                                {formData.videoUrl && <video src={formData.videoUrl} controls className="mt-2 h-24 rounded w-full object-contain border bg-gray-100"></video>}
                            </div>
                        </div>
                        <input name="strengths" value={formData.strengths} onChange={handleChange} placeholder="Strengths (comma-separated)" required className={inputClass} />
                        <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Scouting Report / Bio" required rows={4} className={inputClass}></textarea>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stats (JSON format)</label>
                            <textarea name="stats" value={formData.stats} onChange={handleChange} placeholder='e.g., [{"label": "Goals", "value": 10}]' required rows={4} className={`${inputClass} font-mono text-xs`}></textarea>
                        </div>
                        <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} placeholder="Agent/Club Contact Email" required className={inputClass} />
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Player</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ScoutingFormModal;
