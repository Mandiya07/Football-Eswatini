
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import PhotoIcon from '../icons/PhotoIcon';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../../services/api';
import { compressImage } from '../../services/utils';

const ClubGalleryManagement: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        coverUrl: '',
        imageUrls: '' // string input for comma separated
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [imageProcessing, setImageProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageProcessing(true);
            try {
                const compressed = await compressImage(file, 800, 0.7);
                setFormData(prev => ({ ...prev, coverUrl: compressed }));
            } catch (e) { 
                console.error(e);
                alert("Failed to process cover image.");
            } finally {
                setImageProcessing(false);
            }
        }
    };

    const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageProcessing(true);
             try {
                const compressed = await compressImage(file, 800, 0.7);
                setFormData(prev => ({ 
                    ...prev, 
                    imageUrls: prev.imageUrls ? `${prev.imageUrls},${compressed}` : compressed 
                }));
            } catch (e) { 
                console.error(e);
                alert("Failed to process gallery image.");
            } finally {
                setImageProcessing(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        const images = formData.imageUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);
        if (images.length === 0) {
            alert("Please add at least one image URL.");
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, 'photoGalleries'), {
                title: formData.title,
                date: new Date(formData.date).toDateString(),
                coverUrl: formData.coverUrl || images[0],
                imageUrls: images,
                clubName: clubName,
                createdAt: serverTimestamp()
            });
            setSuccessMessage("Gallery created successfully!");
            setFormData({ title: '', date: new Date().toISOString().split('T')[0], coverUrl: '', imageUrls: '' });
        } catch (error) {
            handleFirestoreError(error, 'create gallery');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <PhotoIcon className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl font-bold font-display">Photo Galleries</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Share matchday photos, training sessions, or event highlights with your fans.</p>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md flex items-center gap-3 animate-fade-in">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputClass} placeholder="e.g. Training Camp Day 1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL or Upload</label>
                        <div className="flex items-center gap-2">
                            <input type="url" name="coverUrl" value={formData.coverUrl} onChange={handleChange} className={inputClass} placeholder="https://..." />
                            <label className={`cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap ${imageProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {imageProcessing ? 'Processing...' : 'Upload Cover'}
                                <input type="file" onChange={handleCoverFileChange} accept="image/*" className="sr-only" disabled={imageProcessing} />
                            </label>
                        </div>
                        {formData.coverUrl && <img src={formData.coverUrl} alt="Cover Preview" className="mt-2 h-20 object-cover rounded border p-1" />}
                        <p className="text-xs text-gray-500 mt-1">Optional. Defaults to the first image in the list.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Images</label>
                        <div className="flex items-center gap-2 mb-2">
                            <input type="text" name="imageUrls" value={formData.imageUrls} onChange={handleChange} required className={inputClass} placeholder="Paste comma separated URLs..." />
                            <label className={`cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap ${imageProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {imageProcessing ? 'Processing...' : 'Add Image'}
                                <input type="file" onChange={handleGalleryImageUpload} accept="image/*" className="sr-only" disabled={imageProcessing} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">Add images by uploading or pasting URLs separated by commas.</p>
                        {formData.imageUrls && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                {formData.imageUrls.split(',').slice(0, 5).map((url, i) => (
                                    url.trim() && <img key={i} src={url.trim()} className="h-16 w-16 object-cover rounded border" alt="" />
                                ))}
                                {formData.imageUrls.split(',').length > 5 && <span className="self-center text-xs text-gray-500">+{formData.imageUrls.split(',').length - 5} more</span>}
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting || imageProcessing} className="bg-blue-600 text-white hover:bg-blue-700">
                            {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : 'Create Gallery'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ClubGalleryManagement;
