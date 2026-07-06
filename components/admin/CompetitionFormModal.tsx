
import React, { useState, useEffect } from 'react';
import { Competition, fetchCategories, Category as DBCategory } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface CompetitionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Omit<Competition, 'teams' | 'fixtures' | 'results'>>, id: string) => void;
    competition: { id: string, name: string, logoUrl?: string, externalApiId?: string, type?: 'league' | 'tournament', categoryId?: string };
}

const CompetitionFormModal: React.FC<CompetitionFormModalProps> = ({ isOpen, onClose, onSave, competition }) => {
    const [formData, setFormData] = useState({ 
        name: '', 
        logoUrl: '', 
        externalApiId: '',
        type: 'league' as 'league' | 'tournament',
        categoryId: ''
    });
    const [categories, setCategories] = useState<DBCategory[]>([]);

    useEffect(() => {
        fetchCategories().then(setCategories).catch(console.error);
    }, []);

    useEffect(() => {
        if (competition) {
            setFormData({
                name: competition.name || '',
                logoUrl: competition.logoUrl || '',
                externalApiId: competition.externalApiId || '',
                type: competition.type || 'league',
                categoryId: competition.categoryId || ''
            });
        }
    }, [competition, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        // Generate an ID if it's a new competition
        const idToSave = competition.id || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        onSave(formData, idToSave);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{competition.id ? 'Edit Competition' : 'New Competition'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Competition Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Competition Type</label>
                            <select id="type" name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                <option value="league">League</option>
                                <option value="tournament">Tournament Bracket</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} className={inputClass}>
                                <option value="">-- No Category --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                                {/* Add custom options for youth pages if they don't exist in DB */}
                                {!categories.find(c => c.id === 'u19-national-football') && <option value="u19-national-football">U-19 National Football</option>}
                                {!categories.find(c => c.id === 'u17-national-football') && <option value="u17-national-football">U-17 National Football</option>}
                                {!categories.find(c => c.id === 'u15-national-football') && <option value="u15-national-football">U-15 National Football</option>}
                                {!categories.find(c => c.id === 'u13-grassroots-national-football') && <option value="u13-grassroots-national-football">U-13 Grassroots</option>}
                                {!categories.find(c => c.id === 'schools') && <option value="schools">Schools Football</option>}
                            </select>
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
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CompetitionFormModal;
