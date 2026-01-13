
import React, { useState, useEffect, useMemo } from 'react';
import { listenToLiveUpdates, LiveUpdate, listenToAllCompetitions } from '../services/api';
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

interface MergedLiveMatch {
    id: string | number;
    competitionName?: string;
    competitionId?: string;
    teamA: string;
    teamB: string;
    scoreA?: number;
    scoreB?: number;
    liveMinute?: number | string;
    status?: string;
    events: LiveUpdate[];
}

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
    const [updates, setUpdates] = useState<LiveUpdate[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<{ fixture: CompetitionFixture, competitionId: string, competitionName: string }[]>([]);
    const [recentResults, setRecentResults] = useState<{ fixture: CompetitionFixture, competitionId: string, competitionName: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'live' | 'upcoming' | 'results'>('live');
    const emptyMap = useMemo(() => new Map<string, DirectoryEntity>(), []);

    useEffect(() => {
        setLoading(true);
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

        const unsubscribeUpdates = listenToLiveUpdates(setUpdates);
        return () => {
            unsubscribeComps();
            unsubscribeUpdates();
        };
    }, []);

    const liveMatches = useMemo(() => {
        const matchesMap = new Map<string, MergedLiveMatch>();
        activeFixtures.forEach(({ fixture, competitionName, competitionId }) => {
            matchesMap.set(String(fixture.id), {
                id: fixture.id,
                competitionName,
                competitionId,
                teamA: fixture.teamA,
                teamB: fixture.teamB,
                scoreA: fixture.scoreA,
                scoreB: fixture.scoreB,
                liveMinute: fixture.liveMinute || (fixture.status === 'live' ? 'Live' : undefined),
                status: fixture.status,
                events: []
            });
        });

        updates.forEach(u => {
            let matchKey = u.fixture_id ? String(u.fixture_id) : null;
            if (matchKey && matchesMap.has(matchKey)) {
                matchesMap.get(matchKey)!.events.push(u);
            }
        });
        return Array.from(matchesMap.values());
    }, [activeFixtures, updates]);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-10">
                     <RadioIcon className="w-12 h-12 mx-auto text-primary mb-3" />
                    <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 mb-2">Match Hub</h1>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto">Track the Kingdom's elite competitions and international campaigns in real-time.</p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="bg-white p-1.5 rounded-2xl shadow-xl border border-slate-200 inline-flex">
                        <button onClick={() => setFilter('live')} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-3 ${filter === 'live' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <div className={`w-2 h-2 rounded-full ${filter === 'live' ? 'bg-white' : 'bg-red-600 animate-pulse'}`}></div>
                            LIVE NOW <span className="ml-1 opacity-60 font-medium">({liveMatches.length})</span>
                        </button>
                        <button onClick={() => setFilter('upcoming')} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-3 ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <CalendarIcon className="w-4 h-4" /> UPCOMING
                        </button>
                        <button onClick={() => setFilter('results')} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-3 ${filter === 'results' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <CheckCircleIcon className="w-4 h-4" /> RECENT RESULTS
                        </button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
                    <div className="max-w-5xl mx-auto min-h-[500px]">
                        {filter === 'live' && (
                            liveMatches.length > 0 ? (
                                <div className="space-y-6 animate-fade-in">
                                    {liveMatches.map((match) => (
                                        <Card key={match.id} className="shadow-lg overflow-hidden border-0 ring-1 ring-black/5 bg-white">
                                            <CardContent className="p-0">
                                                <header className="p-4 bg-slate-900 text-white">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">{match.competitionName}</span>
                                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-red-600 rounded">
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                                                            <span className="text-[9px] font-black">LIVE</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-lg md:text-xl font-display font-black truncate">{match.teamA}</p>
                                                        </div>
                                                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                                                            <p className="text-3xl md:text-4xl font-black tracking-tighter text-accent">
                                                                {match.scoreA ?? 0} : {match.scoreB ?? 0}
                                                            </p>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-lg md:text-xl font-display font-black truncate">{match.teamB}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-center mt-3">
                                                        <span className="font-mono text-sm font-bold opacity-60">{match.liveMinute}'</span>
                                                    </div>
                                                </header>
                                                <div className="p-4 bg-white">
                                                    {match.events.length > 0 ? (
                                                        <div className="space-y-4">
                                                            <ul className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                                                                {match.events.sort((a,b) => (b.minute || 0) - (a.minute || 0)).map((event) => (
                                                                    <li key={event.id} className="flex items-start gap-4 relative pl-8 animate-fade-in">
                                                                        <div className="absolute left-[-2px] top-1 bg-white border-2 border-slate-200 rounded-full w-2 h-2 z-10"></div>
                                                                        <span className="font-mono font-black text-slate-400 text-sm w-8">{event.minute}'</span>
                                                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-grow shadow-sm">
                                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                                <EventIcon type={event.type} />
                                                                                <p className="font-black text-slate-900 uppercase text-[10px] tracking-tight">{event.type.replace('_', ' ')}</p>
                                                                            </div>
                                                                            <p className="text-xs text-slate-700 font-medium">{event.description}</p>
                                                                            {event.player && <p className="text-[10px] text-primary font-bold mt-1">{event.player}</p>}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className="py-6 text-center text-slate-400">
                                                            <p className="italic text-xs">Awaiting match events...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="text-center p-16 bg-white border-0 shadow-xl rounded-[2.5rem]">
                                    <ClockIcon className="w-16 h-16 mx-auto text-slate-200 mb-6" />
                                    <h3 className="text-3xl font-display font-black text-slate-900 mb-4">No Matches Currently Live</h3>
                                    <p className="text-slate-500 max-w-md mx-auto text-lg">There are no matches currently in progress. Check the upcoming tab for this weekend's MTN Premier League action.</p>
                                    <Button onClick={() => setFilter('upcoming')} className="mt-8 bg-blue-600 text-white h-12 px-8 rounded-xl font-bold hover:scale-105 transition-transform">View Full Schedule</Button>
                                </Card>
                            )
                        )}
                        {filter === 'upcoming' && (
                             <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 border-b pb-4">Upcoming Fixtures (This Week)</h3>
                                {upcomingMatches.length > 0 ? upcomingMatches.map(({ fixture, competitionId, competitionName }) => (
                                    <div key={`${competitionId}-${fixture.id}`} className="group bg-white rounded-3xl p-2 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative">
                                        <div className="absolute top-0 right-8 z-10 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-b-xl shadow-lg uppercase tracking-widest">{competitionName}</div>
                                        <FixtureItem fixture={fixture} isExpanded={false} onToggleDetails={() => {}} teams={[]} onDeleteFixture={() => {}} isDeleting={false} directoryMap={emptyMap} competitionId={competitionId} />
                                    </div>
                                )) : <p className="text-center text-gray-500 py-12">No upcoming matches scheduled.</p>}
                            </div>
                        )}
                        {filter === 'results' && (
                             <div className="space-y-6 animate-fade-in">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 border-b pb-4">Recent Match Results</h3>
                                {recentResults.length > 0 ? recentResults.map(({ fixture, competitionId, competitionName }) => (
                                    <div key={`${competitionId}-${fixture.id}`} className="group bg-white rounded-3xl p-2 border border-slate-100 hover:shadow-2xl transition-all duration-500 relative">
                                        <div className="absolute top-0 right-8 z-10 bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-b-xl shadow-lg uppercase tracking-widest">{competitionName}</div>
                                        <FixtureItem fixture={fixture} isExpanded={false} onToggleDetails={() => {}} teams={[]} onDeleteFixture={() => {}} isDeleting={false} directoryMap={emptyMap} competitionId={competitionId} />
                                    </div>
                                )) : <p className="text-center text-gray-500 py-12">No recent results found.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="container mx-auto px-4 mt-20">
                <AdBanner placement="live-scoreboard-banner" className="h-40 rounded-[2rem] shadow-2xl" />
            </div>
        </div>
    );
};

export default LiveUpdatesPage;
