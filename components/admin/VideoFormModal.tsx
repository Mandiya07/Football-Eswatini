import React, { useState, useEffect } from 'react';
import { Video } from '../../data/videos';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface VideoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Video, 'id'>, id?: string) => void;
    video: Video | null;
}

const VideoFormModal: React.FC<VideoFormModalProps> = ({ isOpen, onClose, onSave, video }) => {
    const [formData, setFormData] = useState({
        title: '', description: '', thumbnailUrl: '', videoUrl: '',
        // FIX: Cast initial value to the broader Video['category'] type to prevent type errors on update.
        duration: '', category: 'highlight' as Video['category']
    });

    useEffect(() => {
        if (video) {
            // FIX: The `video` object now correctly assigns to the state because the state's type is compatible.
            setFormData(video);
        } else {
             setFormData({
                title: '', description: '', thumbnailUrl: '', videoUrl: '',
                duration: '', category: 'highlight'
            });
        }
    }, [video, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const fieldName = name === 'thumbnailUpload' ? 'thumbnailUrl' : 'videoUrl';
                    setFormData(prev => ({ ...prev, [fieldName]: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, video?.id);
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{video ? 'Edit Video' : 'Add New Video'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="Video Title" required className={inputClass} />
                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required rows={3} className={inputClass}></textarea>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL or Upload</label>
                                <input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder="Thumbnail URL" required className={inputClass} />
                                <input name="thumbnailUpload" type="file" onChange={handleFileChange} accept="image/*" className={`${inputClass} mt-2 p-1.5`} />
                                {formData.thumbnailUrl && <img src={formData.thumbnailUrl} alt="Thumbnail preview" className="mt-2 h-24 object-contain border rounded" />}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL or Upload</label>
                                <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="Video URL" required className={inputClass} />
                                <input name="videoUpload" type="file" onChange={handleFileChange} accept="video/*" className={`${inputClass} mt-2 p-1.5`} />
                                {formData.videoUrl && <video src={formData.videoUrl} controls className="mt-2 h-24 rounded w-full object-contain border bg-gray-100"></video>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input name="duration" value={formData.duration} onChange={handleChange} placeholder="Duration (e.g., 03:45)" required className={inputClass} />
                            <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                                <option value="highlight">Highlight</option>
                                <option value="recap">Recap</option>
                                <option value="fan">Fan Zone</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Video</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VideoFormModal;
