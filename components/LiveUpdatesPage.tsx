
import React, { useState, useEffect, useMemo } from 'react';
import { listenToLiveUpdates, LiveUpdate, fetchAllCompetitions } from '../services/api';
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

const LiveUpdatesPage: React.FC = () => {
    const [activeFixtures, setActiveFixtures] = useState<{ fixture: CompetitionFixture, competitionName: string, competitionId: string }[]>([]);
    const [updates, setUpdates] = useState<LiveUpdate[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<{ fixture: CompetitionFixture, competitionId: string, competitionName: string }[]>([]);
    const [recentResults, setRecentResults] = useState<{ fixture: CompetitionFixture, competitionId: string, competitionName: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'live' | 'upcoming' | 'results'>('live');
    
    // Fake empty directory map for FixtureItem since we don't need full linking functionality in the fallback view
    const emptyMap = useMemo(() => new Map<string, DirectoryEntity>(), []);

    // Fetch active fixtures from competitions (Source of Truth for Match Status)
    const fetchActiveFixtures = async () => {
        try {
            const allCompetitions = await fetchAllCompetitions();
            const active: { fixture: CompetitionFixture, competitionName: string, competitionId: string }[] = [];
            const upcoming: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[] = [];
            const results: { fixture: CompetitionFixture, competitionId: string, competitionName: string }[] = [];
            const now = new Date();
            
            Object.entries(allCompetitions).forEach(([compId, comp]) => {
                if (comp.fixtures) {
                    comp.fixtures.forEach(f => {
                        // 1. Explicitly Live or Suspended
                        if (f.status === 'live' || f.status === 'suspended') {
                            active.push({ fixture: f, competitionName: comp.name, competitionId: compId });
                        }
                        // 2. Scheduled but start time has passed (Auto-Live detection)
                        else if (f.status === 'scheduled' && f.fullDate) {
                            const matchDateTime = new Date(f.fullDate + 'T' + (f.time || '00:00'));
                            
                            // If match started within the last 3 hours but isn't marked finished yet, treat as live
                            const threeHoursFromStart = new Date(matchDateTime.getTime() + 3 * 60 * 60 * 1000);
                            
                            if (now >= matchDateTime && now < threeHoursFromStart) {
                                // Auto-promote to active list for display
                                active.push({ fixture: f, competitionName: comp.name, competitionId: compId });
                            } else if (matchDateTime > now) {
                                upcoming.push({ fixture: f, competitionId: compId, competitionName: comp.name });
                            }
                        } else if (f.status === 'scheduled') {
                            // Standard future scheduled
                             upcoming.push({ fixture: f, competitionId: compId, competitionName: comp.name });
                        }
                    });
                }
                if (comp.results) {
                    comp.results.forEach(r => {
                        results.push({ fixture: r, competitionId: compId, competitionName: comp.name });
                    });
                }
            });

            // Sort upcoming by date ascending
            upcoming.sort((a, b) => 
                new Date(a.fixture.fullDate + 'T' + (a.fixture.time || '00:00')).getTime() - 
                new Date(b.fixture.fullDate + 'T' + (b.fixture.time || '00:00')).getTime()
            );

            // Sort results by date descending
            results.sort((a, b) => 
                new Date(b.fixture.fullDate + 'T' + (b.fixture.time || '00:00')).getTime() - 
                new Date(a.fixture.fullDate + 'T' + (a.fixture.time || '00:00')).getTime()
            );
            
            setActiveFixtures(active);
            
            // Set limits high enough to show all relevant recent matches without pagination
            setUpcomingMatches(upcoming.slice(0, 200)); 
            setRecentResults(results.slice(0, 200));

        } catch (err) {
            console.error("Error fetching fixtures:", err);
        }
    };

    // Initial fetch and polling for fixture status updates
    useEffect(() => {
        fetchActiveFixtures();
        const interval = setInterval(fetchActiveFixtures, 30000); // Poll every 30s for score/status updates
        return () => clearInterval(interval);
    }, []);

    // Listen to real-time events
    useEffect(() => {
        const unsubscribe = listenToLiveUpdates((newUpdates) => {
            setUpdates(newUpdates);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Merge Fixtures and Events
    const liveMatches = useMemo(() => {
        const matchesMap = new Map<string, MergedLiveMatch>();

        // 1. Start with Active Fixtures from the database
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

        // 2. Attach Events from Live Updates
        updates.forEach(u => {
            // Try to find by ID first
            let matchKey = u.fixture_id ? String(u.fixture_id) : null;
            
            // If ID not found in active map, try fuzzy matching by teams
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
                // Match found, attach event
                matchesMap.get(matchKey)!.events.push(u);
                // Update scores from most recent event if needed
                if (u.score_home !== undefined && u.score_away !== undefined) {
                     const match = matchesMap.get(matchKey)!;
                     match.scoreA = u.score_home;
                     match.scoreB = u.score_away;
                     match.liveMinute = u.minute;
                }
            } else {
                // Orphaned event: Create a new entry for it so it displays, but mark it clearly
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
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Match Center
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Real-time updates, upcoming fixtures, and latest results from across all leagues.
                    </p>
                </div>

                <AdBanner placement="live-scoreboard-banner" className="mb-8" />
                
                {/* Filter Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex">
                        <button 
                            onClick={() => setFilter('live')} 
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filter === 'live' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${filter === 'live' ? 'bg-white' : 'bg-red-500 animate-pulse'}`}></div>
                            Live <span className="ml-1 text-[10px] bg-white/20 px-1.5 rounded-full">{liveMatches.length}</span>
                        </button>
                        <button 
                            onClick={() => setFilter('upcoming')} 
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Upcoming
                        </button>
                        <button 
                            onClick={() => setFilter('results')} 
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${filter === 'results' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                            Results
                        </button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                    <div className="max-w-4xl mx-auto min-h-[400px]">
                        
                        {/* LIVE MATCHES SECTION */}
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
                                                                {match.status !== 'suspended' && match.status !== 'postponed' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
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
                                                                {match.scoreA !== undefined ? match.scoreA : 0} - {match.scoreB !== undefined ? match.scoreB : 0}
                                                            </p>
                                                        </div>
                                                        <p className="font-bold text-xl truncate text-left">{match.teamB}</p>
                                                    </div>
                                                </header>
                                                
                                                {match.events.length > 0 ? (
                                                    <div className="p-4 bg-white">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Match Timeline</h4>
                                                        <ul className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                                                            {match.events.sort((a,b) => b.minute - a.minute).map((event) => (
                                                                <li key={event.id} className="flex items-start gap-3 text-sm relative pl-8 animate-fade-in">
                                                                    <div className="absolute left-0 top-1 bg-white border-2 border-gray-200 rounded-full w-2.5 h-2.5 z-10"></div>
                                                                    <span className="font-mono font-bold text-gray-500 min-w-[2rem]">{event.minute}'</span>
                                                                    <EventIcon type={event.type} />
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{event.description}</p>
                                                                        {event.player && <p className="text-xs text-gray-500 mt-0.5">{event.player}</p>}
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <div className="p-6 text-center text-gray-500 text-sm italic bg-white">
                                                        Waiting for match events...
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <Card className="mb-8 text-center p-8 bg-blue-50 border border-blue-100 shadow-md">
                                        <ClockIcon className="w-12 h-12 mx-auto text-blue-300 mb-4" />
                                        <h3 className="text-xl font-bold text-blue-800">No Live Matches</h3>
                                        <p className="text-blue-600 mt-2">There are no live games for the selected league right now.</p>
                                    </Card>
                                </div>
                            )
                        )}

                        {/* UPCOMING FIXTURES SECTION */}
                        {filter === 'upcoming' && (
                             <div className="space-y-4 animate-fade-in">
                                <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2 text-blue-800">
                                    Scheduled Matches
                                </h3>
                                {upcomingMatches.length > 0 ? upcomingMatches.map(({ fixture, competitionId, competitionName }) => (
                                    <div key={fixture.id} className="relative group">
                                         <div className="absolute top-0 left-4 z-10 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-b-md shadow-sm uppercase tracking-wide border border-blue-200 border-t-0">
                                            {competitionName}
                                         </div>
                                        <Card className="overflow-hidden hover:shadow-md transition-shadow pt-2">
                                            <FixtureItem
                                                fixture={fixture}
                                                isExpanded={false}
                                                onToggleDetails={() => {}} 
                                                teams={[]} 
                                                onDeleteFixture={() => {}} 
                                                isDeleting={false}
                                                directoryMap={emptyMap}
                                                competitionId={competitionId}
                                            />
                                        </Card>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm border">No upcoming matches found for the selected league.</p>
                                )}
                            </div>
                        )}

                        {/* RECENT RESULTS SECTION */}
                        {filter === 'results' && (
                             <div className="space-y-4 animate-fade-in">
                                <h3 className="text-xl font-bold font-display mb-4 flex items-center gap-2 text-green-800">
                                    Recent Results
                                </h3>
                                {recentResults.length > 0 ? recentResults.map(({ fixture, competitionId, competitionName }) => (
                                    <div key={fixture.id} className="relative group">
                                        <div className="absolute top-0 left-4 z-10 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-b-md shadow-sm uppercase tracking-wide border border-green-200 border-t-0">
                                            {competitionName}
                                        </div>
                                        <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-gray-400 pt-2">
                                            <FixtureItem
                                                fixture={fixture}
                                                isExpanded={false}
                                                onToggleDetails={() => {}} 
                                                teams={[]} 
                                                onDeleteFixture={() => {}} 
                                                isDeleting={false}
                                                directoryMap={emptyMap}
                                                competitionId={competitionId}
                                            />
                                        </Card>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm border">No recent results available for the selected league.</p>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveUpdatesPage;
