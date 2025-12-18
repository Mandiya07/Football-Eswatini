import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchHybridTournaments } from '../services/api';
import { HybridTournament } from '../data/international';
import TournamentView from './TournamentView';
import GlobeIcon from './icons/GlobeIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Card, CardContent } from './ui/Card';
import ArrowRightIcon from './icons/ArrowRightIcon';
import Spinner from './ui/Spinner';

const InternationalPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [tournaments, setTournaments] = useState<HybridTournament[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Use URL params for state to support direct linking
    const selectedTournamentId = searchParams.get('id');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await fetchHybridTournaments();
                setTournaments(data);
            } catch (error) {
                console.error("Failed to load international tournaments", error);
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

    if (selectedTournament) {
        return (
            <div className="bg-gray-50 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <button 
                        onClick={handleBack} 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors mb-6"
                    >
                        <ArrowLeftIcon className="w-4 h-4" /> Back to International Hub
                    </button>
                    <TournamentView tournament={selectedTournament} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-12 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <div className="inline-block p-4 bg-blue-900 rounded-full mb-4 shadow-lg">
                        <GlobeIcon className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-900 mb-2">
                        International Hub
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Your comprehensive source for international football fixtures, live results, and updated standings from across Africa and the world.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
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
                                    <div className="text-blue-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all border-t w-full pt-4 justify-center">
                                        Explore Tournament <ArrowRightIcon className="w-5 h-5"/>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InternationalPage;