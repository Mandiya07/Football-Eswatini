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
        title: '', 
        description: '', 
        thumbnailUrl: '', 
        videoUrl: '',
        duration: '', 
        date: new Date().toISOString().split('T')[0],
        category: 'highlight' as Video['category']
    });

    useEffect(() => {
        if (video) {
            setFormData({
                ...video,
                date: video.date || new Date().toISOString().split('T')[0]
            });
        } else {
             setFormData({
                title: '', 
                description: '', 
                thumbnailUrl: '', 
                videoUrl: '',
                duration: '', 
                date: new Date().toISOString().split('T')[0],
                category: 'highlight'
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
            const file = e.target.files[0];

            if (name === 'videoUpload') {
                const objectUrl = URL.createObjectURL(file);
                setFormData(prev => ({ ...prev, videoUrl: objectUrl }));
            } else {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        setFormData(prev => ({ ...prev, thumbnailUrl: reader.result as string }));
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, video?.id);
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{video ? 'Edit Video' : 'Add New Video'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input name="title" value={formData.title} onChange={handleChange} placeholder="Video Title" required className={inputClass} />
                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required rows={3} className={inputClass}></textarea>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Thumbnail URL or Upload</label>
                                <div className="flex items-center gap-2">
                                    <input name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} placeholder="Thumbnail URL" className={inputClass} />
                                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                        Upload
                                        <input type="file" onChange={handleFileChange} accept="image/*" className="sr-only" />
                                    </label>
                                </div>
                                {formData.thumbnailUrl && <img src={formData.thumbnailUrl} alt="Thumbnail preview" className="mt-2 h-24 object-contain border rounded" />}
                            </div>
                             <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Video Source</label>
                                <div className="flex items-center gap-2">
                                    <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="Video URL" className={inputClass} />
                                    <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                        File
                                        <input type="file" name="videoUpload" onChange={handleFileChange} accept="video/*" className="sr-only" />
                                    </label>
                                </div>
                                {formData.videoUrl && (
                                    <div className="mt-2">
                                        <video src={formData.videoUrl} controls className="h-24 rounded w-full object-contain border bg-gray-100"></video>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Duration</label>
                                <input name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 03:45" required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Hub Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                                    <option value="highlight">Highlight</option>
                                    <option value="recap">Recap</option>
                                    <option value="fan">Fan Zone</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark shadow-lg px-8">Save Video</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default VideoFormModal;