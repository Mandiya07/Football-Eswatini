
import React, { useState, useEffect } from 'react';
import { NewsItem } from '../../data/news';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface NewsFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (articleData: Omit<NewsItem, 'id'>, id?: string) => void;
    article: NewsItem | null;
}

const NewsFormModal: React.FC<NewsFormModalProps> = ({ isOpen, onClose, onSave, article }) => {
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        image: '',
        category: 'National' as NewsItem['category'],
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        url: '',
    });

    useEffect(() => {
        if (article) {
            setFormData({
                title: article.title,
                summary: article.summary,
                content: article.content || '',
                image: article.image,
                category: article.category,
                date: new Date(article.date).toISOString().split('T')[0],
                url: article.url,
            });
        } else {
             setFormData({
                title: '',
                summary: '',
                content: '',
                image: '',
                category: 'National',
                date: new Date().toISOString().split('T')[0],
                url: '',
            });
        }
    }, [article, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'title' && !article) { // Auto-generate URL slug for new articles
            const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            setFormData(prev => ({ ...prev, url: `/news/${slug}` }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, image: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            date: new Date(formData.date).toDateString().slice(4) // e.g., "Oct 26 2023"
        };
        onSave(dataToSave, article?.id);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-form-title"
        >
            <Card
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors z-10"
                    aria-label="Close form"
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <CardContent className="p-8">
                    <h2 id="news-form-title" className="text-2xl font-bold font-display mb-6">
                        {article ? 'Edit Article' : 'Create New Article'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                            <textarea id="summary" name="summary" rows={3} value={formData.summary} onChange={handleChange} required className={inputClass}></textarea>
                        </div>
                         <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Full Article Content</label>
                            <textarea id="content" name="content" rows={8} value={formData.content} onChange={handleChange} required className={inputClass} placeholder="Write the full article content here. You can use newlines to create paragraphs."></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" id="image" name="image" value={formData.image} onChange={handleChange} required className={inputClass} placeholder="Paste URL..."/>
                                    <label htmlFor="image-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                        Upload
                                        <input type="file" id="image-upload" name="image-upload" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select id="category" name="category" value={formData.category} onChange={handleChange} required className={inputClass}>
                                    <option>National</option>
                                    <option>International</option>
                                    <option>Womens</option>
                                </select>
                            </div>
                        </div>
                         {formData.image && <img src={formData.image} alt="Preview" className="mt-2 h-32 w-auto rounded-md object-contain border p-1" />}

                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Article</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default NewsFormModal;
