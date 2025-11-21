
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { TeamYamVideo, addTeamYamVideo, fetchTeamYamVideos } from '../services/api';
import Button from './ui/Button';
import ShirtIcon from './icons/ShirtIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import Spinner from './ui/Spinner';
import VideoModal from './VideoModal';
import { Video } from '../data/videos';
import PlayIcon from './icons/PlayIcon';
import XIcon from './icons/XIcon';
import { useAuth } from '../contexts/AuthContext';

const TeamYamPage: React.FC = () => {
    const [videos, setVideos] = useState<TeamYamVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const { isLoggedIn, user, openAuthModal } = useAuth();

    // Upload Form State
    const [uploadForm, setUploadForm] = useState({
        title: '', description: '', teamName: '', videoUrl: ''
    });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        setLoading(true);
        const data = await fetchTeamYamVideos();
        setVideos(data);
        setLoading(false);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsUploading(true);
        try {
            // In a real app, you'd handle actual file upload here.
            // For now, we just save the metadata with a placeholder thumbnail.
            await addTeamYamVideo({
                ...uploadForm,
                thumbnailUrl: `https://via.placeholder.com/600x400/002B7F/FFFFFF?text=${uploadForm.teamName}`,
                uploadedBy: user.name,
                date: new Date().toISOString().split('T')[0],
                likes: 0
            });
            setIsUploadModalOpen(false);
            setUploadForm({ title: '', description: '', teamName: '', videoUrl: '' });
            loadVideos();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload video.");
        } finally {
            setIsUploading(false);
        }
    };

    const handlePlayVideo = (teamVideo: TeamYamVideo) => {
        const video: Video = {
            id: teamVideo.id,
            title: teamVideo.title,
            description: teamVideo.description,
            thumbnailUrl: teamVideo.thumbnailUrl,
            videoUrl: teamVideo.videoUrl,
            duration: '0:00', // Placeholder
            category: 'fan'
        };
        setSelectedVideo(video);
    };

    const handleOpenUpload = () => {
        if (!isLoggedIn) {
            openAuthModal();
        } else {
            setIsUploadModalOpen(true);
        }
    };

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <ShirtIcon className="w-12 h-12 mx-auto text-green-600 mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-green-800 mb-2">
                        Team Yam
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        For the fans, by the fans. Share training clips, matchday vibes, and interviews from your favorite team.
                    </p>
                    <div className="mt-6">
                        <Button onClick={handleOpenUpload} className="bg-green-600 text-white hover:bg-green-700 inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Upload Your Video
                        </Button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center"><Spinner /></div> : 
                videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {videos.map(video => (
                            <Card 
                                key={video.id} 
                                className="group cursor-pointer hover:shadow-xl transition-all duration-300"
                                onClick={() => handlePlayVideo(video)}
                            >
                                <div className="relative h-48 overflow-hidden bg-gray-200">
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                        <PlayIcon className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{video.teamName}</span>
                                </div>
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{video.title}</h3>
                                    <p className="text-xs text-gray-500 mb-2">Uploaded by {video.uploadedBy} &bull; {video.date}</p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{video.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                        <p className="text-gray-500">No videos uploaded yet. Be the first to show your team pride!</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg relative">
                        <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><XIcon className="w-6 h-6"/></button>
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold font-display mb-6">Upload Team Video</h2>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
                                    <input type="text" required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="e.g. Training Drill Highlights" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                    <input type="text" required value={uploadForm.teamName} onChange={e => setUploadForm({...uploadForm, teamName: e.target.value})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="e.g. Mbabane Swallows" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (YouTube/Direct Link)</label>
                                    <input type="url" required value={uploadForm.videoUrl} onChange={e => setUploadForm({...uploadForm, videoUrl: e.target.value})} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea required value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} rows={3} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Tell us about this clip..." />
                                </div>
                                <div className="text-right">
                                    <Button type="submit" disabled={isUploading} className="bg-green-600 text-white hover:bg-green-700 w-full">
                                        {isUploading ? <Spinner className="w-5 h-5 border-2" /> : 'Share Video'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default TeamYamPage;
