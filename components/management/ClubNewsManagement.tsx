
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../../services/api';

const ClubNewsManagement: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        imageUrl: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');

        try {
            await addDoc(collection(db, 'news'), {
                ...formData,
                image: formData.imageUrl || 'https://via.placeholder.com/800x400/002B7F/FFFFFF?text=Club+Announcement',
                category: ['Club News', clubName], // Tag with club name for filtering
                date: new Date().toISOString(), // Use ISO string for date
                createdAt: serverTimestamp(),
                authorClub: clubName,
                url: `/news/club-${clubName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`
            });
            setSuccessMessage("Announcement published successfully!");
            setFormData({ title: '', summary: '', content: '', imageUrl: '' });
        } catch (error) {
            handleFirestoreError(error, 'publish club news');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-4">News & Announcements</h3>
                <p className="text-gray-600 mb-6 text-sm">Publish press releases, match previews, or club statements directly to the news feed.</p>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md flex items-center gap-3 animate-fade-in">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputClass} placeholder="e.g. Club Statement on Recent Fixtures" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Summary (Short Description)</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} required rows={2} className={inputClass} placeholder="A brief overview appearing on the news card..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Content</label>
                        <textarea name="content" value={formData.content} onChange={handleChange} required rows={6} className={inputClass} placeholder="Write your full announcement here..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
                        <div className="flex items-center gap-2">
                            <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={inputClass} placeholder="https://..." />
                            <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                Upload Photo
                                <input type="file" onChange={handleFileChange} accept="image/*" className="sr-only" />
                            </label>
                        </div>
                        {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-2 h-32 object-cover rounded border p-1" />}
                        <p className="text-xs text-gray-500 mt-1">Leave blank to use a default placeholder.</p>
                    </div>
                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2">
                            {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : <><PlusCircleIcon className="w-5 h-5" /> Publish Announcement</>}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ClubNewsManagement;
