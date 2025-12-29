
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllCompetitions, handleFirestoreError, addLiveUpdate } from '../../services/api';
import { CompetitionFixture, Competition, Player, MatchEvent } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import { useAuth } from '../../contexts/AuthContext';
import ClockIcon from '../icons/ClockIcon';
import GoalIcon from '../icons/GoalIcon';
import CardIcon from '../icons/CardIcon';
import SubstitutionIcon from '../icons/SubstitutionIcon';
import WhistleIcon from '../icons/WhistleIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import PlayIcon from '../icons/PlayIcon';
import ShareIcon from '../icons/ShareIcon';

const UpdateScores: React.FC<{ clubName?: string; leagueIds?: string[] }> = ({ clubName, leagueIds }) => {
    const [matches, setMatches] = useState<{ fixture: CompetitionFixture, compId: string, compName: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { user } = useAuth();

    const [activeMatchId, setActiveMatchId] = useState<number | string | null>(null);
    const [eventType, setEventType] = useState<'goal' | 'yellow-card' | 'red-card' | 'substitution'>('goal');
    const [eventMinute, setEventMinute] = useState('');
    const [playerName, setPlayerName] = useState('');

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const allComps = await fetchAllCompetitions();
            const relevantMatches: typeof matches = [];

            Object.entries(allComps).forEach(([id, comp]) => {
                const isManaged = leagueIds?.includes(id) || user?.role === 'super_admin';
                const hasClub = clubName && comp.fixtures?.some(f => f.teamA === clubName || f.teamB === clubName);
                
                if (isManaged || hasClub) {
                    comp.fixtures?.forEach(f => {
                        if (f.status !== 'finished') {
                            if (isManaged || f.teamA === clubName || f.teamB === clubName) {
                                relevantMatches.push({ fixture: f, compId: id, compName: comp.name });
                            }
                        }
                    });
                }
            });

            setMatches(relevantMatches);
            setLoading(false);
        };
        loadData();
    }, [clubName, leagueIds, user]);

    const handleStatusChange = async (m: typeof matches[0], newStatus: any) => {
        setSubmitting(m.fixture.id);
        try {
            const docRef = doc(db, 'competitions', m.compId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                const competition = docSnap.data() as Competition;
                const updatedFixtures = [...competition.fixtures];
                const updatedResults = [...(competition.results || [])];
                const fIndex = updatedFixtures.findIndex(f => f.id === m.fixture.id);

                if (fIndex !== -1) {
                    const fixture = { ...updatedFixtures[fIndex], status: newStatus };
                    if (newStatus === 'finished') {
                        updatedFixtures.splice(fIndex, 1);
                        updatedResults.push(fixture);
                    } else {
                        updatedFixtures[fIndex] = fixture;
                    }
                    const updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);
                    transaction.update(docRef, removeUndefinedProps({ fixtures: updatedFixtures, results: updatedResults, teams: updatedTeams }));
                }
            });
            setSuccessMessage("Status updated!");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(null);
        }
    };

    const handleLogEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const active = matches.find(m => m.fixture.id === activeMatchId);
        if (!active) return;

        setSubmitting(active.fixture.id);
        const newEvent: MatchEvent = {
            minute: parseInt(eventMinute),
            type: eventType,
            description: `${eventType.toUpperCase()} - ${playerName}`,
            playerName
        };

        try {
            const docRef = doc(db, 'competitions', active.compId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                const competition = docSnap.data() as Competition;
                const updatedFixtures = competition.fixtures.map(f => {
                    if (f.id === activeMatchId) {
                        const events = [...(f.events || []), newEvent];
                        let sA = f.scoreA || 0;
                        let sB = f.scoreB || 0;
                        // Score logic based on team name would go here
                        return { ...f, events, scoreA: sA, scoreB: sB, liveMinute: newEvent.minute, status: 'live' };
                    }
                    return f;
                });
                transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
            });
            setSuccessMessage("Event logged!");
            setEventMinute('');
            setPlayerName('');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (e) {} finally { setSubmitting(null); }
    };

    if (loading) return <Spinner />;

    return (
        <Card className="shadow-lg">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-6">Match Control Console</h3>
                
                {matches.length === 0 ? (
                    <p className="text-center py-10 text-gray-500 italic">No active matches found for your account.</p>
                ) : (
                    <div className="space-y-6">
                        {matches.map(m => (
                            <div key={m.fixture.id} className="p-4 border rounded-xl bg-gray-50">
                                <div className="flex justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{m.compName}</span>
                                    <span className="text-xs font-bold text-gray-400">{m.fixture.date} {m.fixture.time}</span>
                                </div>
                                <div className="text-center font-bold text-lg mb-6">
                                    {m.fixture.teamA} <span className="text-primary px-3">{m.fixture.scoreA ?? 0} - {m.fixture.scoreB ?? 0}</span> {m.fixture.teamB}
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <Button onClick={() => handleStatusChange(m, 'live')} className="bg-green-600 text-white text-xs">Start Match</Button>
                                    <Button onClick={() => handleStatusChange(m, 'finished')} className="bg-red-600 text-white text-xs">Full Time</Button>
                                    <Button onClick={() => setActiveMatchId(activeMatchId === m.fixture.id ? null : m.fixture.id)} className="bg-primary text-white text-xs">Log Event</Button>
                                </div>
                                
                                {activeMatchId === m.fixture.id && (
                                    <form onSubmit={handleLogEvent} className="mt-4 p-4 bg-white border rounded-lg animate-fade-in grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400">Player</label>
                                            <input value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full border p-1.5 rounded text-sm" placeholder="Name" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-gray-400">Min</label>
                                            <input value={eventMinute} onChange={e => setEventMinute(e.target.value)} type="number" className="w-full border p-1.5 rounded text-sm" />
                                        </div>
                                        <div>
                                            <Button type="submit" className="w-full bg-blue-600 text-white h-9 text-xs">Post</Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UpdateScores;
