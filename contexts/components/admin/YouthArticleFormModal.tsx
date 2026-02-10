
import React, { useState, useEffect } from 'react';
import { YouthArticle } from '../../data/youth';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import { compressImage } from '../../services/utils';

interface YouthArticleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: YouthArticle) => void;
    article: YouthArticle | null;
}

const YouthArticleFormModal: React.FC<YouthArticleFormModalProps> = ({ isOpen, onClose, onSave, article }) => {
    const [formData, setFormData] = useState<YouthArticle>({
        id: '',
        title: '',
        summary: '',
        content: '',
        imageUrl: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [imageProcessing, setImageProcessing] = useState(false);

    useEffect(() => {
        if (article) {
            setFormData(article);
        } else {
            setFormData({
                id: '',
                title: '',
                summary: '',
                content: '',
                imageUrl: '',
                date: new Date().toISOString().split('T')[0],
            });
        }
    }, [article, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageProcessing(true);
            try {
                const compressed = await compressImage(file, 800, 0.7);
                setFormData(prev => ({ ...prev, imageUrl: compressed }));
            } catch (error) {
                console.error("Image processing error", error);
                alert("Failed to process image.");
            } finally {
                setImageProcessing(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            id: formData.id || Date.now().toString()
        };
        onSave(dataToSave);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{article ? 'Edit Article' : 'Create New Article'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input name="title" value={formData.title} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                            <textarea name="summary" value={formData.summary} onChange={handleChange} required rows={3} className={inputClass}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea name="content" value={formData.content} onChange={handleChange} required rows={6} className={inputClass}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
                            <div className="flex items-center gap-2">
                                <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Image URL" className={inputClass} />
                                <label className={`cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap ${imageProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {imageProcessing ? 'Processing...' : 'Upload'}
                                    <input type="file" onChange={handleFileChange} accept="image/*" className="sr-only" disabled={imageProcessing} />
                                </label>
                            </div>
                            {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-2 h-32 object-cover rounded border" />}
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white" disabled={imageProcessing}>Save Article</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default YouthArticleFormModal;
