import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { OnThisDayEvent, archiveData, ArchiveItem, ArchiveClip, ArchiveMatch, ArchivePhoto } from '../data/memoryLane';
import { Video } from '../data/videos';
import VideoCard from './VideoCard';
import VideoModal from './VideoModal';
import HistoryIcon from './icons/HistoryIcon';
import TrophyIcon from './icons/TrophyIcon';
import PhotoIcon from './icons/PhotoIcon';
import FilmIcon from './icons/FilmIcon';
import { fetchOnThisDayData, fetchArchiveData } from '../services/api';
import SectionLoader from './SectionLoader';

const OnThisDay: React.FC<{ events: OnThisDayEvent[] }> = ({ events }) => {
    const today = new Date();
    const event = events.find(e => e.month === today.getMonth() + 1 && e.day === today.getDate());

    if (!event) {
        return (
            <Card className="shadow-lg">
                <CardContent className="p-6 text-center text-gray-600">
                    No major events recorded on this day in history. Check back tomorrow!
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-xl overflow-hidden bg-gray-800 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2">
                <img src={event.imageUrl} alt={event.title} loading="lazy" className="w-full h-64 md:h-full object-cover" />
                <div className="p-8 flex flex-col justify-center">
                    <p className="font-bold text-yellow-400">{event.day}/{event.month}/{event.year}</p>
                    <h3 className="text-3xl font-display font-bold mt-2 mb-3">{event.title}</h3>
                    <p className="text-gray-300 mb-4">{event.description}</p>
                </div>
            </div>
        </Card>
    );
};

const ArchiveCard: React.FC<{ item: ArchiveItem, onPlayVideo: (video: Video) => void }> = ({ item, onPlayVideo }) => {
    const renderDetails = () => {
        switch (item.type) {
            case 'match':
                const match = item.details as ArchiveMatch;
                return (
                    <div className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                        <p><strong>Competition:</strong> {match.competition}</p>
                        <p><strong>Result:</strong> {match.teams} <span className="font-bold">{match.score}</span></p>
                    </div>
                );
            case 'photo':
                const photo = item.details as ArchivePhoto;
                return <img src={photo.imageUrl} alt={item.title} loading="lazy" className="w-full h-40 object-cover mt-2 rounded-md" />;
            case 'clip':
                const clip = item.details as ArchiveClip;
                return <VideoCard video={clip.video} onPlay={onPlayVideo} />;
        }
    };

    return (
        <Card className="flex flex-col h-full transition-shadow duration-300 hover:shadow-lg">
            <CardContent className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                    <p className="text-xs text-gray-500 font-semibold">{item.year} &bull; <span className="capitalize">{item.type}</span></p>
                    <h4 className="font-bold font-display text-lg mt-1">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                </div>
                <div className="mt-4">{renderDetails()}</div>
            </CardContent>
        </Card>
    );
};

type ArchiveFilter = 'all' | 'match' | 'photo' | 'clip';

const MemoryLanePage: React.FC = () => {
    const [filter, setFilter] = useState<ArchiveFilter>('all');
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [onThisDayData, setOnThisDayData] = useState<OnThisDayEvent[]>([]);
    const [archiveData, setArchiveData] = useState<ArchiveItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [onThisDay, archive] = await Promise.all([fetchOnThisDayData(), fetchArchiveData()]);
            setOnThisDayData(onThisDay);
            setArchiveData(archive);
            setLoading(false);
        };
        loadData();
    }, []);

    const filteredArchive = useMemo(() => {
        if (filter === 'all') return archiveData;
        return archiveData.filter(item => item.type === filter);
    }, [filter, archiveData]);
    
    const TabButton: React.FC<{tabName: ArchiveFilter, label:string, Icon: React.FC<any>}> = ({tabName, label, Icon}) => (
        <button
            onClick={() => setFilter(tabName)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${filter === tabName ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <HistoryIcon className="w-12 h-12 mx-auto text-primary mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Memory Lane
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Relive the iconic moments, legendary players, and historic matches from Eswatini football history.
                    </p>
                </div>

                {loading ? <SectionLoader /> : (
                    <>
                        <section className="mb-16">
                            <h2 className="text-2xl font-display font-bold mb-4">On This Day in History</h2>
                            <OnThisDay events={onThisDayData} />
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-display font-bold mb-4">The Archive</h2>
                            <div className="flex flex-wrap gap-2 mb-8">
                                <TabButton tabName="all" label="All" Icon={HistoryIcon} />
                                <TabButton tabName="match" label="Matches" Icon={TrophyIcon} />
                                <TabButton tabName="photo" label="Photos" Icon={PhotoIcon} />
                                <TabButton tabName="clip" label="Clips" Icon={FilmIcon} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredArchive.map(item => (
                                    <ArchiveCard key={item.id} item={item} onPlayVideo={setSelectedVideo} />
                                ))}
                            </div>
                            {filteredArchive.length === 0 && (
                                <p className="text-center text-gray-500 py-8">No items found in this category.</p>
                            )}
                        </section>
                    </>
                )}
            </div>
            {selectedVideo && <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
        </div>
    );
};

export default MemoryLanePage;