
import React, { useState, useEffect } from 'react';
import { Ad } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface AdFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Ad, id?: string) => void;
    placement: { id: string; name: string; data: Ad };
}

const AdFormModal: React.FC<AdFormModalProps> = ({ isOpen, onClose, onSave, placement }) => {
    const [formData, setFormData] = useState<Ad>({ imageUrl: '', link: '', altText: '' });

    useEffect(() => {
        if (placement) {
            setFormData(placement.data);
        }
    }, [placement, isOpen]);

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
                    setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, placement.id);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">Edit Ad: {placement.name}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
                            <div className="flex items-center gap-2">
                                <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required className={inputClass} placeholder="Paste URL..." />
                                <label htmlFor="imageUpload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                    Upload
                                    <input type="file" id="imageUpload" name="imageUpload" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                </label>
                            </div>
                            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-4 h-32 w-auto rounded-md object-contain border p-1 mx-auto bg-gray-50" />}
                        </div>
                        <div>
                            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                            <input type="text" id="link" name="link" value={formData.link} onChange={handleChange} required className={inputClass} placeholder="https://..." />
                        </div>
                        <div>
                            <label htmlFor="altText" className="block text-sm font-medium text-gray-700 mb-1">Alt Text (for accessibility)</label>
                            <input type="text" id="altText" name="altText" value={formData.altText} onChange={handleChange} required className={inputClass} placeholder="Descriptive text for the ad" />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Ad</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdFormModal;
