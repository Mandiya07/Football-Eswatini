
import React, { useState, useEffect, useMemo } from 'react';
import { listenToLiveUpdates, LiveUpdate, listenToAllCompetitions, fetchDirectoryEntries } from '../services/api';
import { CompetitionFixture } from '../data/teams';
import { Card, CardContent } from './ui/Card';
import Spinner from './ui/Spinner';
import GoalIcon from './icons/GoalIcon';
import CardIcon from './icons/CardIcon';
import SubstitutionIcon from './icons/SubstitutionIcon';
import ClockIcon from './icons/ClockIcon';
import RadioIcon from './icons/RadioIcon';
import CalendarIcon from './icons/CalendarIcon';
import { FixtureItem } from './Fixtures';
import AlertTriangleIcon from './icons/AlertTriangleIcon';
import XCircleIcon from './icons/XCircleIcon';
import WhistleIcon from './icons/WhistleIcon';
import { DirectoryEntity } from '../data/directory';
import AdBanner from './AdBanner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Button from './ui/Button';

const EventIcon: React.FC<{ type: LiveUpdate['type'] }> = ({ type }) => {
    switch (type) {
        case 'goal': return <GoalIcon className="w-5 h-5 text-green-600 flex-shrink-0" />;
        case 'yellow_card': return <CardIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
        case 'red_card': return <CardIcon className="w-5 h-5 text-red-600 flex-shrink-0" />;
        case 'substitution': return <SubstitutionIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
        case 'match_postponed': return <ClockIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />;
        case 'match_abandoned': return <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />;
        case 'match_suspended': return <AlertTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0" />;
        case 'half_time': return <WhistleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />;
        case 'full_time': return <WhistleIcon className="w-5 h-5 text-gray-800 flex-shrink-0" />;
        default: return <ClockIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />;
    }
};

const getMatchTimestamp = (fixture: CompetitionFixture): number => {
    if (!fixture.fullDate) return 0;
    const time = fixture.time || '15:00';
    try {
        return new Date(`${fixture.fullDate}T${time}`).getTime();
    } catch (e) {
        return new Date(fixture.fullDate).getTime();
    }
};

const LiveUpdatesPage: React.FC = () => {
    const [activeFixtures, setActiveFixtures] = useState<{ fixture: CompetitionFixture, competitionName: string, competitionId: string }[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<{ fixture: CompetitionFixture, competitionId: string, competitionName: string }[]>([]);
    const [recentResults, setRecentResults] = useState<{ fixture: CompetitionFixture, competitionId: string, competitionName: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'live' | 'upcoming' | 'results'>('live');
    const [expandedFixtureId, setExpandedFixtureId] = useState<string | number | null>(null);
    const [directoryMap, setDirectoryMap] = useState<Map<string, DirectoryEntity>>(new Map());

    useEffect(() => {
        setLoading(true);
        const startListening = async () => {
            const dirEntries = await fetchDirectoryEntries();
            const map = new Map<string, DirectoryEntity>();
            dirEntries.forEach(entry => map.set(entry.name.trim().toLowerCase(), entry));
            setDirectoryMap(map);

            const unsubscribeComps = listenToAllCompetitions((allCompetitions) => {
                const active: { fixture: CompetitionFixture, competitionName: string, competitionId: string }[] = [];
                const upcoming: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[] = [];
                const results: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[] = [];
                
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                const twoWeeksAhead = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
                
                Object.entries(allCompetitions).forEach(([compId, comp]) => {
                    const compName = comp.displayName || comp.name;
                    
                    if (comp.fixtures) {
                        comp.fixtures.forEach(f => {
                            const ts = getMatchTimestamp(f);
                            const isCurrentlyActive = f.status === 'live' || f.status === 'suspended' || f.status === 'abandoned' || 
                                                     (ts > 0 && Math.abs(now.getTime() - ts) < 4 * 60 * 60 * 1000);

                            if (isCurrentlyActive) {
                                active.push({ fixture: f, competitionName: compName, competitionId: compId });
                            } else if (ts > now.getTime() && ts <= twoWeeksAhead.getTime()) {
                                upcoming.push({ fixture: f, competitionId: compId, competitionName: compName });
                            }
                        });
                    }

                    if (comp.results) {
                        comp.results.forEach(r => {
                            const ts = getMatchTimestamp(r);
                            if (ts >= oneWeekAgo.getTime() && ts < now.getTime()) {
                                results.push({ fixture: r, competitionId: compId, competitionName: compName });
                            }
                        });
                    }
                });

                setUpcomingMatches(upcoming.sort((a, b) => getMatchTimestamp(a.fixture) - getMatchTimestamp(b.fixture)));
                setRecentResults(results.sort((a, b) => getMatchTimestamp(b.fixture) - getMatchTimestamp(a.fixture)));
                setActiveFixtures(active);
                setLoading(false);
            });

            return unsubscribeComps;
        };

        const unsubscribe = startListening();
        return () => {
            unsubscribe.then(u => u());
        };
    }, []);

    const renderMatchList = (items: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[], emptyMsg: string) => (
        <div className="space-y-4">
            {items.length > 0 ? items.map(({ fixture, competitionId, competitionName }) => (
                <div key={`${competitionId}-${fixture.id}`} className="group bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden relative">
                    <div className="absolute top-0 right-4 z-10 bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-b uppercase tracking-widest">{competitionName}</div>
                    <FixtureItem 
                        fixture={fixture} 
                        isExpanded={expandedFixtureId === fixture.id} 
                        onToggleDetails={() => setExpandedFixtureId(expandedFixtureId === fixture.id ? null : fixture.id)} 
                        teams={[]} 
                        onDeleteFixture={() => {}} 
                        isDeleting={false} 
                        directoryMap={directoryMap} 
                        competitionId={competitionId} 
                    />
                </div>
            )) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">{emptyMsg}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-gray-50 py-12 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-10">
                     <RadioIcon className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h1 className="text-4xl font-display font-black text-slate-900 mb-2">Live Match Center</h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">Real-time updates, scores, and technical data from across the Kingdom.</p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="bg-white p-1 rounded-lg shadow border border-slate-200 inline-flex overflow-x-auto max-w-full scrollbar-hide">
                        <button onClick={() => setFilter('live')} className={`px-6 py-2 rounded text-sm font-bold transition-all whitespace-nowrap ${filter === 'live' ? 'bg-red-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                            LIVE NOW ({activeFixtures.length})
                        </button>
                        <button onClick={() => setFilter('upcoming')} className={`px-6 py-2 rounded text-sm font-bold transition-all whitespace-nowrap ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                            UPCOMING
                        </button>
                        <button onClick={() => setFilter('results')} className={`px-6 py-2 rounded text-sm font-bold transition-all whitespace-nowrap ${filter === 'results' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                            RECENT RESULTS
                        </button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
                    <div className="max-w-4xl mx-auto">
                        {filter === 'live' && renderMatchList(activeFixtures, "No matches currently in progress.")}
                        {filter === 'upcoming' && renderMatchList(upcomingMatches, "No matches scheduled for the coming week.")}
                        {filter === 'results' && renderMatchList(recentResults, "No results found for the past 7 days.")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveUpdatesPage;
