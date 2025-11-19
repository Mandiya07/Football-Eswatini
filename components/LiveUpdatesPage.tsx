
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

const EventIcon: React.FC<{ type: LiveUpdate['type'] }> = ({ type }) => {
    switch (type) {
        case 'goal': return <GoalIcon className="w-5 h-5 text-green-600 flex-shrink-0" />;
        case 'yellow_card': return <CardIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
        case 'red_card': return <CardIcon className="w-5 h-5 text-red-600 flex-shrink-0" />;
        case 'substitution': return <SubstitutionIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
        default: return <ClockIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />;
    }
};

const LiveUpdatesPage: React.FC = () => {
    const [updates, setUpdates] = useState<LiveUpdate[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<{ fixture: CompetitionFixture, competitionId: string }[]>([]);
    const [loading, setLoading] = useState(true);
    // Fake empty directory map for FixtureItem since we don't need full linking functionality here
    const emptyMap = useMemo(() => new Map(), []);

    useEffect(() => {
        const unsubscribe = listenToLiveUpdates((newUpdates) => {
            setUpdates(newUpdates);
            
            // If no live updates, fetch upcoming matches
            if (newUpdates.length === 0) {
                const loadUpcoming = async () => {
                    try {
                        const allCompetitions = await fetchAllCompetitions();
                        const allFixtures: { fixture: CompetitionFixture, competitionId: string }[] = [];
                        const now = new Date();

                        Object.entries(allCompetitions).forEach(([compId, comp]) => {
                            if (comp.fixtures) {
                                comp.fixtures.forEach(f => {
                                    if (f.status === 'scheduled' && f.fullDate) {
                                        const matchDate = new Date(f.fullDate + 'T' + (f.time || '00:00'));
                                        if (matchDate > now) {
                                            allFixtures.push({ fixture: f, competitionId: compId });
                                        }
                                    }
                                });
                            }
                        });

                        // Sort by date ascending and take top 5
                        allFixtures.sort((a, b) => 
                            new Date(a.fixture.fullDate + 'T' + a.fixture.time).getTime() - 
                            new Date(b.fixture.fullDate + 'T' + b.fixture.time).getTime()
                        );
                        
                        setUpcomingMatches(allFixtures.slice(0, 5));
                    } catch (err) {
                        console.error("Error fetching upcoming matches for live page fallback", err);
                    } finally {
                        setLoading(false);
                    }
                };
                loadUpcoming();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const groupedByMatch = useMemo(() => {
        // Since updates are pre-sorted by timestamp descending from the API,
        // the first one we see for a fixture ID has the latest header data (score, minute).
        return updates.reduce((acc, update) => {
            const fixtureId = update.fixture_id || `${update.home_team}-${update.away_team}`;
            if (!acc[fixtureId]) {
                acc[fixtureId] = {
                    ...update, // This has the latest header info
                    events: []
                };
            }
            acc[fixtureId].events.push(update);
            return acc;
        }, {} as Record<string, LiveUpdate & { events: LiveUpdate[] }>);
    }, [updates]);

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                     <RadioIcon className="w-12 h-12 mx-auto text-primary mb-2" />
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Live Match Center
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Real-time updates from matches as they happen across the leagues.
                    </p>
                </div>

                {loading ? <div className="flex justify-center py-8"><Spinner /></div> : 
                 Object.keys(groupedByMatch).length > 0 ? (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {Object.values(groupedByMatch).map((match: LiveUpdate & { events: LiveUpdate[] }) => (
                            <Card key={match.fixture_id || match.id} className="shadow-lg">
                                <CardContent className="p-0">
                                    <header className="p-4 bg-gray-100 border-b rounded-t-2xl">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-600">{match.competition}</p>
                                            <div className="flex items-center space-x-1.5 text-secondary font-bold text-sm">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                <span>LIVE</span>
                                                <span className="font-mono">{match.minute}'</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto_1fr] items-center text-center gap-2 mt-2">
                                            <p className="font-bold text-xl truncate text-right">{match.home_team}</p>
                                            <p className="font-bold text-3xl tracking-wider px-2">{match.score_home} - {match.score_away}</p>
                                            <p className="font-bold text-xl truncate text-left">{match.away_team}</p>
                                        </div>
                                    </header>
                                    <div className="p-4">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Match Events</h4>
                                        <ul className="space-y-3">
                                            {match.events.map(event => (
                                                <li key={event.id} className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3">
                                                    <span className="font-mono font-bold text-gray-500 w-8">{event.minute}'</span>
                                                    <EventIcon type={event.type} />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{event.description}</p>
                                                        {event.player && <p className="text-xs text-gray-500">{event.player}</p>}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <Card className="mb-8 text-center p-8 bg-blue-50 border border-blue-100">
                            <ClockIcon className="w-12 h-12 mx-auto text-blue-300 mb-4" />
                            <h3 className="text-xl font-bold text-blue-800">No Live Matches Currently</h3>
                            <p className="text-blue-600 mt-2">There are no games being played right now. Check out the upcoming schedule below.</p>
                        </Card>
                        
                        <h3 className="text-2xl font-bold font-display mb-6 flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-gray-600" /> Upcoming Matches
                        </h3>
                        
                        <div className="space-y-4">
                            {upcomingMatches.length > 0 ? upcomingMatches.map(({ fixture, competitionId }) => (
                                <Card key={fixture.id} className="overflow-hidden">
                                     <FixtureItem
                                        fixture={fixture}
                                        isExpanded={false}
                                        onToggleDetails={() => {}} // No-op for simple list
                                        teams={[]} // Teams not needed for simple display
                                        onDeleteFixture={() => {}} // No-op
                                        isDeleting={false}
                                        directoryMap={emptyMap}
                                        competitionId={competitionId}
                                    />
                                </Card>
                            )) : (
                                <p className="text-center text-gray-500">No upcoming matches found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveUpdatesPage;
