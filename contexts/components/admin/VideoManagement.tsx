
import React, { useState, useEffect } from 'react';
import { addVideo, deleteVideo, fetchVideos, updateVideo } from '../../services/api';
import { Video } from '../../data/videos';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import VideoFormModal from './VideoFormModal';
import RecapGeneratorModal from './RecapGeneratorModal';
import SparklesIcon from '../icons/SparklesIcon';

const VideoManagement: React.FC = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);

    const loadVideos = async () => {
        setLoading(true);
        const data = await fetchVideos();
        setVideos(data);
        setLoading(false);
    };

    useEffect(() => {
        loadVideos();
    }, []);

    const handleAddNew = () => {
        setEditingVideo(null);
        setIsModalOpen(true);
    };

    const handleEdit = (video: Video) => {
        setEditingVideo(video);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this video?")) {
            await deleteVideo(id);
            loadVideos();
        }
    };

    const handleSave = async (data: Omit<Video, 'id'>, id?: string) => {
        if (id) {
            await updateVideo(id, data);
        } else {
            await addVideo(data);
        }
        setIsModalOpen(false);
        loadVideos();
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <h3 className="text-2xl font-bold font-display">Video Management</h3>
                        <div className="flex gap-3">
                            <Button onClick={() => setIsRecapModalOpen(true)} className="bg-purple-600 text-white hover:bg-purple-700 inline-flex items-center gap-2 shadow-sm">
                                <SparklesIcon className="w-5 h-5" /> AI Recap Studio
                            </Button>
                            <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                                <PlusCircleIcon className="w-5 h-5" /> Add Video
                            </Button>
                        </div>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {videos.map(video => (
                                <div key={video.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <img src={video.thumbnailUrl} alt={video.title} className="w-20 h-12 object-cover rounded-md" />
                                        <div>
                                            <p className="font-semibold">{video.title}</p>
                                            <p className="text-xs text-gray-500">{video.category} &bull; {video.duration}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Button onClick={() => handleEdit(video)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4" /></Button>
                                        <Button onClick={() => handleDelete(video.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <VideoFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} video={editingVideo} />}
            {isRecapModalOpen && <RecapGeneratorModal isOpen={isRecapModalOpen} onClose={() => setIsRecapModalOpen(false)} />}
        </>
    );
};

export default VideoManagement;
