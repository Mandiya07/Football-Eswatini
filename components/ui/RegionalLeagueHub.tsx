import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './Card';
import { Competition, fetchAllCompetitions } from '../../services/api';
import { superNormalize } from '../../services/utils';
import Spinner from './Spinner';
import MapPinIcon from '../icons/MapPinIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import TrophyIcon from '../icons/TrophyIcon';
import Button from './Button';
import SparklesIcon from '../icons/SparklesIcon';
import GlobeIcon from '../icons/GlobeIcon';

interface RegionalLeagueHubProps {
    categoryId: string; // The ID that matches the page (e.g., 'schools', 'u17-national-football')
    hubType: string;    // Display name (e.g., "Schools", "U-17 Juniors")
    description: string;
}

const REGIONS = [
    { id: 'hhohho', name: 'Hhohho', color: 'bg-blue-600', lightBg: 'bg-blue-50', textColor: 'text-blue-700' },
    { id: 'manzini', name: 'Manzini', color: 'bg-yellow-500', lightBg: 'bg-yellow-50', textColor: 'text-yellow-700' },
    { id: 'lubombo', name: 'Lubombo', color: 'bg-green-600', lightBg: 'bg-green-50', textColor: 'text-green-700' },
    { id: 'shiselweni', name: 'Shiselweni', color: 'bg-red-600', lightBg: 'bg-red-50', textColor: 'text-red-700' },
];

const RegionalLeagueHub: React.FC<RegionalLeagueHubProps> = ({ categoryId, hubType, description }) => {
    const [leagues, setLeagues] = useState<Competition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const all = await fetchAllCompetitions();
                // Filter competitions that match this specific page's category
                const filtered = Object.entries(all)
                    .filter(([_, comp]) => comp.categoryId === categoryId)
                    .map(([id, comp]) => ({ ...comp, id })) as any[];
                setLeagues(filtered);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [categoryId]);

    const filteredLeagues = useMemo(() => {
        if (!selectedRegion) return leagues;
        const normRegion = superNormalize(selectedRegion);
        return leagues.filter(l => 
            superNormalize(l.name).includes(normRegion) || 
            superNormalize(l.region || '').includes(normRegion)
        );
    }, [leagues, selectedRegion]);

    return (
        <div className="space-y-12 animate-fade-in">
            {/* 1. Regional Selection Cards */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <GlobeIcon className="w-6 h-6 text-gray-400" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Explore {hubType} by Region</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {REGIONS.map(reg => {
                        const regionHubs = leagues.filter(l => 
                            superNormalize(l.region || '').includes(reg.id) || 
                            superNormalize(l.name).includes(reg.id)
                        );
                        
                        return (
                            <Card 
                                key={reg.id} 
                                onClick={() => setSelectedRegion(selectedRegion === reg.name ? null : reg.name)}
                                className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden hover:-translate-y-1 ${selectedRegion === reg.name ? `border-primary shadow-xl ring-4 ring-primary/5` : 'border-white hover:border-gray-200'}`}
                            >
                                <CardContent className="p-0">
                                    <div className={`h-1.5 w-full ${reg.color}`}></div>
                                    <div className="p-5 text-center">
                                        <div className={`w-10 h-10 rounded-full ${reg.lightBg} ${reg.textColor} flex items-center justify-center mx-auto mb-3 shadow-inner`}>
                                            <MapPinIcon className="w-5 h-5" />
                                        </div>
                                        <p className="font-black text-gray-900 uppercase tracking-tight text-xs sm:text-sm">{reg.name}</p>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
                                            {regionHubs.length} Active Hubs
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* 2. Specialized Creation Feature */}
            <Card className="bg-slate-900 text-white rounded-[2.5rem] shadow-2xl overflow-hidden border-0 relative group">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 transform group-hover:rotate-12 transition-transform duration-1000">
                    <TrophyIcon className="w-64 h-64" />
                </div>
                <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-2xl text-center md:text-left">
                        <div className="bg-white/10 px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/10 mb-6">
                            <SparklesIcon className="w-4 h-4 text-accent" /> Manager Initiative
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-black leading-tight mb-4 tracking-tight">
                            Start a <span className="text-accent">{hubType} League</span>
                        </h2>
                        <p className="text-blue-100 text-lg opacity-80 leading-relaxed">
                            {description}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <Link to={`/league-registration?fixedCategory=${categoryId}&typeName=${encodeURIComponent(hubType)}`}>
                            <Button className="bg-accent text-primary-dark h-16 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all text-xs border-0">
                                Create {hubType} League
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Filtered Results Listing */}
            <section>
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                    <h3 className="text-xl font-black font-display text-gray-900 uppercase tracking-tight">
                        {selectedRegion ? `${selectedRegion} ${hubType} Hubs` : `All Active ${hubType} Hubs`}
                    </h3>
                    {selectedRegion && (
                        <button onClick={() => setSelectedRegion(null)} className="text-[10px] font-black uppercase text-blue-600 hover:underline">Clear Filter</button>
                    )}
                </div>

                {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLeagues.map((league: any) => (
                            <Link key={league.id} to={league.id.includes('cup') ? `/cups?id=${league.id}` : `/region-hub/${league.id}`} className="group">
                                <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white rounded-2xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 group-hover:border-primary transition-colors">
                                                {league.logoUrl ? (
                                                    <img src={league.logoUrl} className="max-h-full max-w-full object-contain" alt="" />
                                                ) : (
                                                    <TrophyIcon className="w-8 h-8 text-gray-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors truncate">{league.name}</h3>
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Real-Time Standings</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
                                            <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">View Match Center</span>
                                            <ArrowRightIcon className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                        {filteredLeagues.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2.5rem] bg-white">
                                <p className="text-gray-400 font-bold italic">No active hubs found for this selection.</p>
                                <p className="text-xs text-gray-400 mt-1">Be the first to create a league for this region!</p>
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RegionalLeagueHub;