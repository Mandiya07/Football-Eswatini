
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchHybridTournaments, fetchNews } from '../services/api';
import { HybridTournament } from '../data/international';
import { NewsItem } from '../data/news';
import { NewsCard } from './News';
import TournamentView from './TournamentView';
import GlobeIcon from './icons/GlobeIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Card, CardContent } from './ui/Card';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import Spinner from './ui/Spinner';
import Button from './ui/Button';

const PAGE_SIZE = 6;

const InternationalPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tournaments, setTournaments] = useState<HybridTournament[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const selectedTournamentId = searchParams.get('id');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [tournData, newsData] = await Promise.all([
                    fetchHybridTournaments(),
                    fetchNews()
                ]);
                setTournaments(tournData);
                
                const filteredNews = newsData.filter(item => {
                    const cats = Array.isArray(item.category) ? item.category : [item.category];
                    return cats.includes('International');
                });
                setNews(filteredNews);
            } catch (error) {
                console.error("Failed to load international data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

    const handleSelectTournament = (id: string) => {
        setSearchParams({ id });
    };

    const handleBack = () => {
        setSearchParams({});
    };

    const totalPages = Math.ceil(news.length / PAGE_SIZE);
    const paginatedNews = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return news.slice(start, start + PAGE_SIZE);
    }, [news, currentPage]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            document.getElementById('news-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (selectedTournament) {
        return (
            <div className="bg-gray-50 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <button 
                        onClick={handleBack} 
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6"
                    >
                        <ArrowLeftIcon className="w-4 h-4" /> Back to International Hub
                    </button>
                    <TournamentView tournament={selectedTournament} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto max-w-6xl animate-fade-in">
                <div className="text-center mb-12">
                    <div className="inline-block p-4 bg-blue-900 rounded-full mb-4 shadow-lg">
                        <GlobeIcon className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-blue-900 mb-2">
                        International Hub
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Global fixtures, live results, and updated standings from across Africa and the world.
                    </p>
                </div>

                <div className="space-y-16">
                    <div id="news-section">
                        <h2 className="text-2xl font-display font-bold mb-8 text-gray-800 uppercase tracking-tight">Latest International News</h2>
                        {loading ? (
                            <div className="flex justify-center"><Spinner /></div>
                        ) : news.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {paginatedNews.map(item => (
                                        <NewsCard key={item.id} item={item} />
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-4">
                                        <Button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} variant="outline" className="flex items-center gap-2"><ChevronLeftIcon className="w-4 h-4" /> Previous</Button>
                                        <span className="text-sm font-bold text-gray-500">Page {currentPage} of {totalPages}</span>
                                        <Button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} variant="outline" className="flex items-center gap-2">Next <ChevronRightIcon className="w-4 h-4" /></Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-center text-gray-500 italic py-10">No international news articles found.</p>
                        )}
                    </div>

                    <div>
                        <h2 className="text-2xl font-display font-bold text-center mb-8 text-gray-800 uppercase tracking-tight">Elite International Tournaments</h2>
                        {loading ? (
                            <div className="flex justify-center py-20"><Spinner /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                {tournaments.map(tourn => (
                                    <Card 
                                        key={tourn.id} 
                                        className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                        onClick={() => handleSelectTournament(tourn.id)}
                                    >
                                        <CardContent className="p-8 flex flex-col h-full items-center text-center">
                                            <div className="h-24 w-24 mb-6 flex items-center justify-center">
                                                {tourn.logoUrl ? (
                                                    <img src={tourn.logoUrl} alt={tourn.name} className="max-h-full max-w-full object-contain drop-shadow-md" />
                                                ) : (
                                                    <GlobeIcon className="w-16 h-16 text-gray-300" />
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-bold font-display text-gray-900 mb-3">{tourn.name}</h2>
                                            <p className="text-gray-600 mb-6 flex-grow line-clamp-2">{tourn.description}</p>
                                            <div className="text-blue-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all border-t w-full pt-4 justify-center uppercase text-xs tracking-widest">
                                                Explore Hub <ArrowRightIcon className="w-5 h-5"/>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternationalPage;
