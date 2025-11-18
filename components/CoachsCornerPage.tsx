import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { CoachingContent, Coach } from '../data/coaching';
import { Video } from '../data/videos';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import Button from './ui/Button';
import WhistleIcon from './icons/WhistleIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import FilmIcon from './icons/FilmIcon';
import FileTextIcon from './icons/FileTextIcon';
import { fetchCoachingContent } from '../services/api';
import SectionLoader from './SectionLoader';

const ArticleCard: React.FC<{ content: CoachingContent }> = ({ content }) => {
    const authorName = typeof content.author === 'string' ? content.author : content.author.name;
    return (
        <Card className="group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
            <div className="relative overflow-hidden">
                <img src={content.imageUrl} alt={content.title} loading="lazy" className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{content.type}</span>
            </div>
            <CardContent className="flex flex-col flex-grow p-4">
                <div className="flex-grow">
                    <h3 className="text-md font-bold font-display mb-2 group-hover:text-blue-600">{content.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{content.summary}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
                    By {authorName}
                </div>
            </CardContent>
        </Card>
    );
};

const GuestColumnCard: React.FC<{ content: CoachingContent }> = ({ content }) => {
    const author = content.author as Coach;
    return (
        <Card className="shadow-lg">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="flex-shrink-0 text-center">
                        <img src={author.photoUrl} alt={author.name} className="w-24 h-24 rounded-full border-4 border-white shadow-md mx-auto" />
                        <h4 className="font-bold mt-2">{author.name}</h4>
                        <p className="text-xs text-gray-500">{author.credentials}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Guest Column</span>
                        <h3 className="text-xl font-bold font-display mt-1 mb-2">{content.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{content.summary}</p>
                        <Button className="mt-4 bg-primary-light text-white text-sm">Read Full Column</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const CoachsCornerPage: React.FC = () => {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [coachingContent, setCoachingContent] = useState<CoachingContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchCoachingContent();
            setCoachingContent(data);
            setLoading(false);
        };
        loadData();
    }, []);
    
    const featuredContent = useMemo(() => coachingContent.find(c => c.isFeatured), [coachingContent]);
    const articles = useMemo(() => coachingContent.filter(c => (c.type === 'Tactic' || c.type === 'Drill') && !c.isFeatured), [coachingContent]);
    const videoLessons = useMemo(() => coachingContent.filter(c => c.type === 'Video'), [coachingContent]);
    const guestColumns = useMemo(() => coachingContent.filter(c => c.type === 'Column'), [coachingContent]);
    
    const handlePlayVideo = (video: Video) => {
        setSelectedVideo(video);
    };

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <WhistleIcon className="w-12 h-12 mx-auto text-primary mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Coach's Corner
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Tactical analysis, training drills, video lessons, and expert insights to elevate your game.
                    </p>
                </div>

                {loading ? <SectionLoader /> : (
                    <div className="space-y-16">
                        {/* Featured Section */}
                        {featuredContent && (
                            <section>
                                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2"><ClipboardIcon className="w-6 h-6 text-primary" /> Featured Analysis</h2>
                                <Card className="shadow-xl overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <img src={featuredContent.imageUrl} alt={featuredContent.title} className="w-full h-64 md:h-full object-cover" />
                                        <div className="p-8 flex flex-col justify-center">
                                            <span className="text-sm font-bold uppercase tracking-wider text-primary">{featuredContent.type}</span>
                                            <h3 className="text-3xl font-display font-bold mt-2 mb-3">{featuredContent.title}</h3>
                                            <p className="text-gray-600 mb-4">{featuredContent.summary}</p>
                                            <p className="text-sm font-semibold text-gray-800">By {(featuredContent.author as Coach).name}</p>
                                            <p className="text-xs text-gray-500">{(featuredContent.author as Coach).credentials}</p>
                                        </div>
                                    </div>
                                </Card>
                            </section>
                        )}

                        {/* Tactical Breakdowns & Drills */}
                        {articles.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2"><ClipboardIcon className="w-6 h-6 text-primary" /> Tactical Breakdowns & Drills</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {articles.map(content => (
                                        <ArticleCard key={content.id} content={content} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Video Lessons */}
                        {videoLessons.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2"><FilmIcon className="w-6 h-6 text-primary" /> Video Lessons</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {videoLessons.map(content => {
                                        const video: Video = {
                                            id: content.id,
                                            title: content.title,
                                            description: content.summary,
                                            thumbnailUrl: content.thumbnailUrl!,
                                            videoUrl: content.videoUrl!,
                                            duration: content.duration!,
                                            category: 'fan', // placeholder
                                        };
                                        return <VideoCard key={content.id} video={video} onPlay={handlePlayVideo} />
                                    })}
                                </div>
                            </section>
                        )}
                        
                        {/* Guest Columns */}
                        {guestColumns.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2"><FileTextIcon className="w-6 h-6 text-primary" /> From The Experts: Guest Columns</h2>
                                <div className="space-y-8">
                                    {guestColumns.map(content => (
                                        <GuestColumnCard key={content.id} content={content} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default CoachsCornerPage;