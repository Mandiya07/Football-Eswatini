
import React, { useState, useEffect, useRef } from 'react';
import { Referee } from '../../data/referees';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface RefereeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Referee>, id?: string) => void;
    referee: Referee | null;
}

const RefereeFormModal: React.FC<RefereeFormModalProps> = ({ isOpen, onClose, onSave, referee }) => {
    const [formData, setFormData] = useState<Partial<Referee>>({
        name: '',
        level: 'Regional',
        bio: '',
        photoUrl: '',
        stats: { matches: 0, yellowCards: 0, redCards: 0 },
        isSpotlight: false,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (referee) {
            setFormData({ ...referee });
        } else {
            setFormData({
                name: '',
                level: 'Regional',
                bio: '',
                photoUrl: '',
                stats: { matches: 0, yellowCards: 0, redCards: 0 },
                isSpotlight: false,
            });
        }
    }, [referee, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
             // Handle stats fields nested in formData
             if (name === 'matches' || name === 'yellowCards' || name === 'redCards') {
                 setFormData(prev => ({ 
                     ...prev, 
                     stats: { ...prev.stats!, [name]: parseInt(value, 10) || 0 } 
                 }));
             } else {
                 setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
             }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, referee?.id);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{referee ? 'Edit Referee' : 'Add Referee'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={inputClass} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                <select name="level" value={formData.level || 'Regional'} onChange={handleChange} className={inputClass}>
                                    <option value="FIFA">FIFA</option>
                                    <option value="National Elite">National Elite</option>
                                    <option value="Regional">Regional</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="isSpotlight" checked={formData.isSpotlight || false} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-medium text-gray-700">Set as Spotlight Referee</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} className={inputClass} placeholder="Short biography..."></textarea>
                        </div>

                        <div className="pt-2 border-t">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Career Statistics</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Matches</label>
                                    <input type="number" name="matches" value={formData.stats?.matches || 0} onChange={handleChange} className={inputClass} min="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Yellow Cards</label>
                                    <input type="number" name="yellowCards" value={formData.stats?.yellowCards || 0} onChange={handleChange} className={inputClass} min="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Red Cards</label>
                                    <input type="number" name="redCards" value={formData.stats?.redCards || 0} onChange={handleChange} className={inputClass} min="0" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (Optional)</label>
                            <div className="flex items-center gap-2">
                                <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                {formData.photoUrl && <img src={formData.photoUrl} alt="Preview" className="h-9 w-9 rounded-full object-cover border bg-gray-100"/>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Referee</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default RefereeFormModal;
