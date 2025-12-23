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
    let timestamp = 0;
    if (fixture.fullDate) {
        let time = fixture.time ? fixture.time.trim() : '00:00';
        if (time.length === 5) time += ':00'; 
        if (time.length === 4) time = '0' + time + ':00';
        try {
            const dateStr = `${fixture.fullDate}T${time}`;
            const ts = new Date(dateStr).getTime();
            if (!isNaN(ts)) timestamp = ts;
        } catch (e) {}
    }
    if (timestamp === 0 && fixture.fullDate) {
        const ts = new Date(fixture.fullDate).getTime();
        if (!isNaN(ts)) timestamp = ts;
    }
    if (timestamp === 0 && typeof fixture.id === 'number' && fixture.id > 1600000000000) {
         timestamp = fixture.id;
    }
    return timestamp;
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
        // Real-time listener for ALL competitions
        const unsubscribeComps = listenToAllCompetitions((allCompetitions) => {
            const active: { fixture: CompetitionFixture, competitionName: string, competitionId: string }[] = [];
            const upcoming: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[] = [];
            const results: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[] = [];
            const now = new Date();
            
            Object.entries(allCompetitions).forEach(([compId, comp]) => {
                const compName = comp.displayName || comp.name;
                if (comp.fixtures) {
                    comp.fixtures.forEach(f => {
                        if (f.status === 'live' || f.status === 'suspended') {
                            active.push({ fixture: f, competitionName: compName, competitionId: compId });
                        } else if (f.status === 'scheduled' && f.fullDate) {
                            const ts = getMatchTimestamp(f);
                            if (ts > 0) {
                                const matchDateTime = new Date(ts);
                                const threeHoursFromStart = new Date(matchDateTime.getTime() + 3 * 60 * 60 * 1000);
                                if (now >= matchDateTime && now < threeHoursFromStart) {
                                    active.push({ fixture: f, competitionName: compName, competitionId: compId });
                                } else if (matchDateTime > now) {
                                    upcoming.push({ fixture: f, competitionId: compId, competitionName: compName });
                                }
                            } else {
                                upcoming.push({ fixture: f, competitionId: compId, competitionName: compName });
                            }
                        } else if (f.status === 'scheduled') {
                             upcoming.push({ fixture: f, competitionId: compId, competitionName: compName });
                        }
                    });
                }
                if (comp.results) {
                    comp.results.forEach(r => {
                        results.push({ fixture: r, competitionId: compId, competitionName: compName });
                    });
                }
            });

            upcoming.sort((a, b) => getMatchTimestamp(a.fixture) - getMatchTimestamp(b.fixture));
            results.sort((a, b) => getMatchTimestamp(b.fixture) - getMatchTimestamp(a.fixture));
            
            setActiveFixtures(active);
            setUpcomingMatches(upcoming.slice(0, 100)); 
            setRecentResults(results.slice(0, 100));
            setLoading(false);
        });

        // Real-time listener for event commentary
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
            if ((!matchKey || !matchesMap.has(matchKey))) {
                for (const [key, match] of matchesMap.entries()) {
                    if ((match.teamA === u.home_team && match.teamB === u.away_team) || 
                        (match.teamA === u.away_team && match.teamB === u.home_team)) {
                        matchKey = key;
                        break;
                    }
                }
            }

            if (matchKey && matchesMap.has(matchKey)) {
                matchesMap.get(matchKey)!.events.push(u);
                if (u.score_home !== undefined && u.score_away !== undefined) {
                     const match = matchesMap.get(matchKey)!;
                     match.scoreA = u.score_home;
                     match.scoreB = u.score_away;
                     match.liveMinute = u.minute;
                }
            } else {
                const newKey = u.fixture_id || `${u.home_team}-${u.away_team}`;
                if (!matchesMap.has(newKey)) {
                    matchesMap.set(newKey, {
                        id: newKey,
                        competitionName: u.competition,
                        teamA: u.home_team,
                        teamB: u.away_team,
                        scoreA: u.score_home,
                        scoreB: u.score_away,
                        liveMinute: u.minute,
                        status: 'live', 
                        events: [u]
                    });
                } else {
                     matchesMap.get(newKey)!.events.push(u);
                }
            }
        });
        return Array.from(matchesMap.values());
    }, [activeFixtures, updates]);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-8">
                     <RadioIcon className="w-12 h-12 mx-auto text-primary mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">Match Center</h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">Real-time updates and results from across all leagues.</p>
                </div>

                <AdBanner placement="live-scoreboard-banner" className="mb-8" />
                
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex">
                        <button onClick={() => setFilter('live')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filter === 'live' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <div className={`w-2 h-2 rounded-full ${filter === 'live' ? 'bg-white' : 'bg-red-500 animate-pulse'}`}></div>
                            Live <span className="ml-1 text-[10px] bg-white/20 px-1.5 rounded-full">{liveMatches.length}</span>
                        </button>
                        <button onClick={() => setFilter('upcoming')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <CalendarIcon className="w-4 h-4" /> Upcoming
                        </button>
                        <button onClick={() => setFilter('results')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filter === 'results' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <CheckCircleIcon className="w-4 h-4" /> Results
                        </button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                    <div className="max-w-4xl mx-auto min-h-[400px]">
                        {filter === 'live' && (
                            liveMatches.length > 0 ? (
                                <div className="space-y-8 animate-fade-in">
                                    {liveMatches.map((match) => (
                                        <Card key={match.id} className="shadow-lg overflow-hidden border-t-4 border-secondary">
                                            <CardContent className="p-0">
                                                <header className="p-4 bg-gray-50 border-b">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm text-gray-600 font-semibold">{match.competitionName || 'Match Update'}</p>
                                                        <div className={`flex items-center space-x-1.5 ${match.status === 'suspended' ? 'text-orange-600' : 'text-secondary'} font-bold text-sm`}>
                                                            <span className={`relative flex h-2 w-2`}>
                                                                {match.status !== 'suspended' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                                                                <span className={`relative inline-flex rounded-full h-2 w-2 ${match.status === 'suspended' ? 'bg-orange-600' : 'bg-secondary'}`}></span>
                                                            </span>
                                                            <span className="uppercase">{match.status || 'LIVE'}</span>
                                                            {match.liveMinute && <span className="font-mono ml-1">{match.liveMinute !== 'Live' ? match.liveMinute + "'" : ''}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2 mt-4 mb-2">
                                                        <p className="font-bold text-xl truncate text-right">{match.teamA}</p>
                                                        <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
                                                            <p className="font-bold text-3xl tracking-wider text-primary">
                                                                {match.scoreA ?? 0} - {match.scoreB ?? 0}
                                                            </p>
                                                        </div>
                                                        <p className="font-bold text-xl truncate text-left">{match.teamB}</p>
                                                    </div>
                                                </header>
                                                <div className="p-4 bg-white">
                                                    {match.events.length > 0 ? (
                                                        <ul className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                                            {match.events.sort((a,b) => (b.minute || 0) - (a.minute || 0)).map((event) => (
                                                                <li key={event.id} className="flex items-start gap-3 text-sm relative pl-8 animate-fade-in">
                                                                    <div className="absolute left-0 top-1 bg-white border-2 border-gray-200 rounded-full w-2.5 h-2.5 z-10"></div>
                                                                    <span className="font-mono font-bold text-gray-500 min-w-[2rem]">{event.minute ? `${event.minute}'` : '-'}</span>
                                                                    <EventIcon type={event.type} />
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{event.description}</p>
                                                                        {event.player && <p className="text-xs text-gray-500 mt-0.5">{event.player}</p>}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : <p className="p-4 text-center text-gray-500 text-sm italic">Waiting for match events...</p>}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="text-center p-8 bg-blue-50 border border-blue-100 shadow-md">
                                    <ClockIcon className="w-12 h-12 mx-auto text-blue-300 mb-4" />
                                    <h3 className="text-xl font-bold text-blue-800">No Live Matches</h3>
                                    <p className="text-blue-600 mt-2">Check the Upcoming tab for scheduled fixtures.</p>
                                </Card>
                            )
                        )}
                        {filter === 'upcoming' && (
                             <div className="space-y-4 animate-fade-in">
                                {upcomingMatches.length > 0 ? upcomingMatches.map(({ fixture, competitionId, competitionName }) => (
                                    <Card key={`${competitionId}-${fixture.id}`} className="overflow-hidden hover:shadow-md transition-shadow relative pt-6">
                                        <div className="absolute top-0 left-4 z-10 bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-b shadow-sm uppercase tracking-wide border border-blue-200 border-t-0">{competitionName}</div>
                                        <FixtureItem fixture={fixture} isExpanded={false} onToggleDetails={() => {}} teams={[]} onDeleteFixture={() => {}} isDeleting={false} directoryMap={emptyMap} competitionId={competitionId} />
                                    </Card>
                                )) : <p className="text-center text-gray-500 py-12">No upcoming matches found.</p>}
                            </div>
                        )}
                        {filter === 'results' && (
                             <div className="space-y-4 animate-fade-in">
                                {recentResults.length > 0 ? recentResults.map(({ fixture, competitionId, competitionName }) => (
                                    <Card key={`${competitionId}-${fixture.id}`} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-gray-400 relative pt-6">
                                        <div className="absolute top-0 left-4 z-10 bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-b shadow-sm uppercase tracking-wide border border-gray-200 border-t-0">{competitionName}</div>
                                        <FixtureItem fixture={fixture} isExpanded={false} onToggleDetails={() => {}} teams={[]} onDeleteFixture={() => {}} isDeleting={false} directoryMap={emptyMap} competitionId={competitionId} />
                                    </Card>
                                )) : <p className="text-center text-gray-500 py-12">No recent results found.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveUpdatesPage;