
import React, { useState, useEffect } from 'react';
import { listenToPodcasts, fetchPodcastAudio } from '../services/api';
import { Card, CardContent } from './ui/Card';
import SectionLoader from './SectionLoader';
import RadioIcon from './icons/RadioIcon';
import PlayIcon from './icons/PlayIcon';
import ShareIcon from './icons/ShareIcon';
import MicIcon from './icons/MicIcon';
import ClockIcon from './icons/ClockIcon';
import UsersIcon from './icons/UsersIcon';
import { motion, AnimatePresence } from 'motion/react';

const PodcastsPage: React.FC = () => {
    const [podcasts, setPodcasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPodcast, setSelectedPodcast] = useState<any | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const unsub = listenToPodcasts((data) => {
            setPodcasts(data);
            setLoading(false);
            if (data.length > 0 && !selectedPodcast) {
                setSelectedPodcast(data[0]);
            }
        });
        return () => unsub();
    }, [selectedPodcast]);

    useEffect(() => {
        const loadAudio = async () => {
            if (selectedPodcast) {
                setLoadingAudio(true);
                setAudioUrl(null);
                const fullAudio = await fetchPodcastAudio(selectedPodcast.id);
                setAudioUrl(fullAudio);
                setLoadingAudio(false);
            }
        };
        loadAudio();
    }, [selectedPodcast]);

    const handleShare = async (p: any) => {
        const shareData = {
            title: p.title,
            text: `Listen to the latest Football Eswatini Podcast: ${p.title}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) {}
        } else {
            try {
                await navigator.clipboard.writeText(shareData.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {}
        }
    };

    if (loading) return <SectionLoader />;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-emerald-500/20 opacity-50"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 mb-6">
                            <RadioIcon className="w-4 h-4 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Official Audio Hub</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display font-black mb-6 uppercase tracking-tighter leading-[0.9]">
                            Football <span className="text-accent">Eswatini</span> Podcasts
                        </h1>
                        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                            The Kingdom's most in-depth football analysis, delivered daily by our AI-powered experts Sipho and Thandi.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-12 relative z-20">
                {podcasts.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] shadow-xl text-center border border-dashed border-slate-200">
                        <RadioIcon className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-slate-400 uppercase tracking-widest">No Episodes Yet</h2>
                        <p className="text-slate-400 mt-2">Check back soon for our first broadcast!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Player */}
                        <div className="lg:col-span-8 space-y-8">
                            {selectedPodcast && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
                                >
                                    <div className="p-8 md:p-12">
                                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                            <div className="w-48 h-48 bg-slate-100 rounded-[2.5rem] overflow-hidden flex-shrink-0 shadow-xl border-4 border-white">
                                                {selectedPodcast.coverArtUrl ? (
                                                    <img src={selectedPodcast.coverArtUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                                                        <RadioIcon className="w-20 h-20 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {selectedPodcast.createdAt?.toDate().toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                                                        <UsersIcon className="w-3 h-3" />
                                                        By {selectedPodcast.author}
                                                    </div>
                                                </div>
                                                
                                                <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 uppercase tracking-tighter leading-none mb-6">
                                                    {selectedPodcast.title}
                                                </h2>
                                                
                                                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                                                    {selectedPodcast.topics?.map((t: string, i: number) => (
                                                        <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-4">
                                                    <button 
                                                        onClick={() => handleShare(selectedPodcast)}
                                                        className="flex-1 bg-primary text-white font-black py-4 px-8 rounded-2xl transition-all hover:bg-primary-dark hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase"
                                                    >
                                                        <ShareIcon className="w-4 h-4" />
                                                        {copied ? 'Link Copied!' : 'Broadcast Episode'}
                                                    </button>
                                                    <button 
                                                        onClick={() => setShowTranscript(!showTranscript)}
                                                        className="flex-1 bg-slate-100 text-slate-600 font-black py-4 px-8 rounded-2xl transition-all hover:bg-slate-200 hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-3 text-[10px] tracking-widest uppercase"
                                                    >
                                                        <MicIcon className="w-4 h-4" />
                                                        {showTranscript ? 'Hide Subtitles' : 'Show Subtitles'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            {loadingAudio ? (
                                                <div className="flex items-center justify-center h-12 gap-3 text-slate-400">
                                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
                                                    <span className="text-xs font-bold uppercase tracking-widest">Loading Audio...</span>
                                                </div>
                                            ) : audioUrl ? (
                                                <audio 
                                                    src={audioUrl} 
                                                    controls 
                                                    className="w-full h-12"
                                                />
                                            ) : (
                                                <div className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                    Audio not available
                                                </div>
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {showTranscript && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-8 p-8 bg-white border border-slate-100 rounded-[2rem] shadow-inner">
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                                            <MicIcon className="w-3 h-3" /> Episode Transcript
                                                        </h4>
                                                        <div className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                                            {selectedPodcast.transcript}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Sidebar List */}
                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="text-xl font-black font-display uppercase tracking-tight text-slate-900 px-4">Latest Broadcasts</h3>
                            <div className="space-y-4">
                                {podcasts.map((p) => (
                                    <motion.div 
                                        key={p.id}
                                        whileHover={{ x: 10 }}
                                        onClick={() => {
                                            setSelectedPodcast(p);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`p-4 rounded-3xl cursor-pointer transition-all border-2 ${selectedPodcast?.id === p.id ? 'bg-white border-primary shadow-xl' : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                                                {p.coverArtUrl ? (
                                                    <img src={p.coverArtUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center">
                                                        <RadioIcon className="w-6 h-6 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-bold text-sm truncate ${selectedPodcast?.id === p.id ? 'text-primary' : 'text-slate-900'}`}>{p.title}</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {p.createdAt?.toDate().toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${selectedPodcast?.id === p.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-300'}`}>
                                                <PlayIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PodcastsPage;
