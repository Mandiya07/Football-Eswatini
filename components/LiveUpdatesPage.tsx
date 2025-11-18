
import React, { useState, useEffect, useMemo } from 'react';
import { listenToLiveUpdates, LiveUpdate } from '../services/api';
import { Card, CardContent } from './ui/Card';
import Spinner from './ui/Spinner';
import GoalIcon from './icons/GoalIcon';
import CardIcon from './icons/CardIcon';
import SubstitutionIcon from './icons/SubstitutionIcon';
import ClockIcon from './icons/ClockIcon';
import RadioIcon from './icons/RadioIcon';

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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = listenToLiveUpdates((newUpdates) => {
            setUpdates(newUpdates);
            setLoading(false);
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
                                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                                        {match.events.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map((event) => (
                                            <div key={event.id} className="flex items-start gap-3 text-sm p-2 rounded-md bg-white hover:bg-gray-50 animate-fade-in">
                                                <span className="font-bold text-gray-600 w-10 text-right">{event.minute}'</span>
                                                <EventIcon type={event.type} />
                                                <span className="flex-1 text-gray-800">
                                                    {event.description}
                                                    {event.player && <span className="font-semibold"> ({event.player})</span>}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                 ) : (
                    <p className="text-center text-gray-500 py-12">No live matches currently in progress. Please check back later.</p>
                 )
                }
            </div>
        </div>
    );
};

export default LiveUpdatesPage;
