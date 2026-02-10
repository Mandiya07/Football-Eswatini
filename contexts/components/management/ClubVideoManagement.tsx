
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import FilmIcon from '../icons/FilmIcon';
import TrashIcon from '../icons/TrashIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { fetchCompetition, handleFirestoreError } from '../../services/api';
import { removeUndefinedProps } from '../../services/utils';
import { Competition, TeamVideo } from '../../data/teams';
import VideoPlayer from '../VideoPlayer';

const ClubVideoManagement: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [videos, setVideos] = useState<TeamVideo[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        url: ''
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const COMPETITION_ID = 'mtn-premier-league';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const comp = await fetchCompetition(COMPETITION_ID);
                const team = comp?.teams?.find(t => t.name === clubName);
                if (team) {
                    setVideos(team.videos || []);
                }
            } catch (error) {
                console.error("Error loading videos", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [clubName]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // FIX: Use Blob URL for local video file handling to prevent crash
            const objectUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, url: objectUrl }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.url.trim() || !formData.title.trim()) return;

        setIsSubmitting(true);
        setSuccessMessage('');

        const newVideo: TeamVideo = {
            id: Date.now().toString(),
            title: formData.title,
            url: formData.url,
            date: new Date().toISOString().split('T')[0]
        };

        const updatedVideos = [newVideo, ...videos];

        try {
            const docRef = doc(db, 'competitions', COMPETITION_ID);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const comp = docSnap.data() as Competition;
                
                const updatedTeams = comp.teams.map(t => {
                    if (t.name === clubName) {
                        return { ...t, videos: updatedVideos };
                    }
                    return t;
                });

                transaction.update(docRef, { teams: removeUndefinedProps(updatedTeams) });
            });
            
            setVideos(updatedVideos);
            setSuccessMessage("Video added successfully!");
            setFormData({ title: '', url: '' });
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            handleFirestoreError(error, 'add video');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (videoId: string) => {
        if (!window.confirm("Are you sure you want to remove this video?")) return;
        setIsSubmitting(true);

        const updatedVideos = videos.filter(v => v.id !== videoId);

        try {
            const docRef = doc(db, 'competitions', COMPETITION_ID);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const comp = docSnap.data() as Competition;
                
                const updatedTeams = comp.teams.map(t => {
                    if (t.name === clubName) {
                        return { ...t, videos: updatedVideos };
                    }
                    return t;
                });

                transaction.update(docRef, { teams: removeUndefinedProps(updatedTeams) });
            });
            setVideos(updatedVideos);
        } catch (error) {
            handleFirestoreError(error, 'delete video');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <FilmIcon className="w-8 h-8 text-red-600" />
                    <h3 className="text-2xl font-bold font-display">Video Hub Integration</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm">
                    Paste a link from YouTube/Facebook OR upload a video file directly (e.g. AI Recap).
                </p>

                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-md flex items-center gap-3 animate-fade-in">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span className="font-semibold">{successMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleChange} 
                            required 
                            className={inputClass} 
                            placeholder="e.g. Weekly Match Recap" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video Link OR Upload File</label>
                        <div className="flex gap-2">
                             <input 
                                type="url" 
                                name="url" 
                                value={formData.url} 
                                onChange={handleChange} 
                                className={inputClass} 
                                placeholder="https://..." 
                            />
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Button type="button" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                                    Upload File
                                </Button>
                            </div>
                        </div>
                         {formData.url.startsWith('blob:') && <p className="text-xs text-green-600 mt-1">File selected (Local upload)</p>}
                    </div>
                    <div className="text-right">
                        <Button type="submit" disabled={isSubmitting} className="bg-red-600 text-white hover:bg-red-700">
                            {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : 'Add Video'}
                        </Button>
                    </div>
                </form>

                <h4 className="font-bold text-gray-800 mb-4">Your Videos ({videos.length})</h4>
                
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {videos.map(video => (
                            <div key={video.id} className="bg-white border rounded-lg overflow-hidden shadow-sm group">
                                <div className="relative">
                                    <VideoPlayer src={video.url} title={video.title} />
                                </div>
                                <div className="p-3 flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 line-clamp-2">{video.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{video.date}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(video.id)}
                                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Video"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8 italic">No videos added yet.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default ClubVideoManagement;
