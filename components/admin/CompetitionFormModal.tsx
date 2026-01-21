
import React, { useState, useEffect } from 'react';
import { Competition } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface CompetitionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Omit<Competition, 'teams' | 'fixtures' | 'results'>>, id: string) => void;
    competition: { id: string, name: string, logoUrl?: string, externalApiId?: string };
}

const CompetitionFormModal: React.FC<CompetitionFormModalProps> = ({ isOpen, onClose, onSave, competition }) => {
    const [formData, setFormData] = useState({ name: '', logoUrl: '', externalApiId: '' });

    useEffect(() => {
        if (competition) {
            setFormData({
                name: competition.name,
                logoUrl: competition.logoUrl || '',
                externalApiId: competition.externalApiId || '',
            });
        }
    }, [competition, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, competition.id);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">Edit Competition</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Competition Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">Logo URL or Upload</label>
                            <div className="flex items-center gap-2">
                                <input type="text" id="logoUrl" name="logoUrl" value={formData.logoUrl} onChange={handleChange} className={inputClass} placeholder="Paste URL..." />
                                <label htmlFor="logoUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                    Upload
                                    <input type="file" id="logoUpload" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                </label>
                            </div>
                            {formData.logoUrl && <img src={formData.logoUrl} alt="Logo preview" className="mt-4 h-20 object-contain mx-auto" />}
                        </div>
                        <div>
                            <label htmlFor="externalApiId" className="block text-sm font-medium text-gray-700 mb-1">External API ID (Optional)</label>
                            <input type="text" id="externalApiId" name="externalApiId" value={formData.externalApiId} onChange={handleChange} className={inputClass} placeholder="e.g., 2021 (football-data) or 4328 (thesportsdb)" />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter the league ID from <strong>football-data.org</strong> or <strong>thesportsdb.com</strong> to enable automatic imports.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CompetitionFormModal;
