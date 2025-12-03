
import React, { useState, useEffect, useMemo } from 'react';
import { fetchCompetition, handleFirestoreError, addPendingChange, addLiveUpdate } from '../../services/api';
import { CompetitionFixture, Competition, Player, MatchEvent } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import SaveIcon from '../icons/SaveIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
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

const UpdateScores: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [matches, setMatches] = useState<CompetitionFixture[]>([]);
    const [squad, setSquad] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [shareContent, setShareContent] = useState<string | null>(null);
    const { user } = useAuth();

    // Event Logging State
    const [activeMatchId, setActiveMatchId] = useState<number | null>(null);
    const [eventType, setEventType] = useState<'goal' | 'yellow-card' | 'red-card' | 'substitution'>('goal');
    const [eventMinute, setEventMinute] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [eventDescription, setEventDescription] = useState('');

    const COMPETITION_ID = 'mtn-premier-league';

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchCompetition(COMPETITION_ID);
            if (data) {
                // 1. Get Matches
                if (data.fixtures) {
                    const clubMatches = data.fixtures.filter(
                        f => (f.teamA === clubName || f.teamB === clubName) && f.status !== 'finished'
                    );
                    setMatches(clubMatches);
                }
                // 2. Get Squad for Dropdowns
                const myTeam = data.teams?.find(t => t.name === clubName);
                if (myTeam) {
                    setSquad(myTeam.players.sort((a,b) => a.number - b.number));
                }
            }
            setLoading(false);
        };
        loadData();
    }, [clubName]);

    const activeMatch = useMemo(() => matches.find(m => m.id === activeMatchId), [matches, activeMatchId]);

    const handleShare = async () => {
        if (!shareContent) return;
        if (navigator.share) {
            try { 
                await navigator.share({ 
                    title: 'Match Update', 
                    text: shareContent,
                    url: window.location.href // Explicitly provide URL to prevent Invalid URL error
                }); 
            } catch (e) { 
                console.error("Error sharing:", e); 
            }
        } else {
            navigator.clipboard.writeText(shareContent);
            alert('Update text copied to clipboard!');
        }
    };

    const handleStatusChange = async (match: CompetitionFixture, newStatus: 'live' | 'suspended' | 'finished' | 'scheduled', message: string) => {
        if (submitting) return;
        setSubmitting(match.id);
        setShareContent(null);

        try {
            // 1. Send Ticker Update
            await addLiveUpdate({
                fixture_id: String(match.id),
                competition: 'MTN Premier League',
                home_team: match.teamA,
                away_team: match.teamB,
                minute: 0, // System update
                type: newStatus === 'finished' ? 'full_time' : newStatus === 'suspended' ? 'match_suspended' : 'half_time',
                player: '',
                description: message,
                score_home: match.scoreA || 0,
                score_away: match.scoreB || 0,
            });

            // 2. Update Database
            const docRef = doc(db, 'competitions', COMPETITION_ID);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const competition = docSnap.data() as Competition;
                const fixtureIndex = competition.fixtures.findIndex(f => f.id === match.id);
                
                let updatedFixtures = [...competition.fixtures];
                let updatedResults = [...(competition.results || [])];
                let updatedTeams = competition.teams;

                if (newStatus === 'finished') {
                    if (fixtureIndex !== -1) {
                        const finishedFixture = { ...competition.fixtures[fixtureIndex], status: 'finished' as const };
                        updatedFixtures.splice(fixtureIndex, 1);
                        updatedResults.push(finishedFixture);
                        updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);
                    }
                } else {
                    if (fixtureIndex !== -1) {
                        updatedFixtures[fixtureIndex] = { 
                            ...updatedFixtures[fixtureIndex], 
                            status: newStatus 
                        };
                    }
                }

                transaction.update(docRef, removeUndefinedProps({ 
                    fixtures: updatedFixtures, 
                    results: updatedResults, 
                    teams: updatedTeams 
                }));
            });

            setSuccessMessage(`Match status updated: ${message}`);
            
            const statusShareText = `MATCH STATUS: ${match.teamA} vs ${match.teamB} is now ${newStatus.toUpperCase()}. #FootballEswatini #${clubName.replace(/\s/g,'')}`;
            setShareContent(statusShareText);
            
            // Local state update
            if (newStatus === 'finished') {
                setMatches(prev => prev.filter(m => m.id !== match.id));
                setActiveMatchId(null);
            } else {
                setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: newStatus } : m));
            }

            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (error) {
            handleFirestoreError(error, 'update match status');
        } finally {
            setSubmitting(null);
        }
    };

    const handleLogEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeMatch || !eventMinute) return;

        setSubmitting(activeMatch.id);
        setShareContent(null);
        
        const player = squad.find(p => p.id.toString() === selectedPlayerId);
        const playerName = player ? player.name : 'Unknown Player';
        
        let finalDescription = eventDescription;
        if (!finalDescription) {
            if (eventType === 'goal') finalDescription = `Goal! ${playerName} finds the net.`;
            else if (eventType === 'yellow-card') finalDescription = `Yellow Card shown to ${playerName}.`;
            else if (eventType === 'red-card') finalDescription = `Red Card! ${playerName} is sent off.`;
            else if (eventType === 'substitution') finalDescription = `Substitution: ${playerName} enters the field.`;
        }

        const newEvent: MatchEvent = {
            minute: parseInt(eventMinute),
            type: eventType,
            description: finalDescription
        };

        try {
            await addLiveUpdate({
                fixture_id: String(activeMatch.id),
                competition: 'MTN Premier League',
                home_team: activeMatch.teamA,
                away_team: activeMatch.teamB,
                minute: parseInt(eventMinute),
                type: eventType === 'yellow-card' ? 'yellow_card' : eventType === 'red-card' ? 'red_card' : 'goal',
                player: playerName,
                description: finalDescription,
                score_home: activeMatch.teamA === clubName && eventType === 'goal' ? (activeMatch.scoreA || 0) + 1 : (activeMatch.scoreA || 0),
                score_away: activeMatch.teamB === clubName && eventType === 'goal' ? (activeMatch.scoreB || 0) + 1 : (activeMatch.scoreB || 0),
            });

            const docRef = doc(db, 'competitions', COMPETITION_ID);
            
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const competition = docSnap.data() as Competition;
                const fixtureIndex = competition.fixtures.findIndex(f => f.id === activeMatch.id);
                if (fixtureIndex === -1) throw new Error("Match not found");

                const fixture = competition.fixtures[fixtureIndex];
                const updatedEvents = [...(fixture.events || []), newEvent];
                
                let newScoreA = fixture.scoreA ?? 0;
                let newScoreB = fixture.scoreB ?? 0;
                
                if (eventType === 'goal') {
                    if (fixture.teamA === clubName) newScoreA += 1;
                    if (fixture.teamB === clubName) newScoreB += 1;
                }

                const updatedFixture = {
                    ...fixture,
                    scoreA: newScoreA,
                    scoreB: newScoreB,
                    events: updatedEvents,
                    liveMinute: parseInt(eventMinute),
                    status: 'live' as const
                };

                const updatedFixtures = [...competition.fixtures];
                updatedFixtures[fixtureIndex] = updatedFixture;

                transaction.update(docRef, removeUndefinedProps({ fixtures: updatedFixtures }));
            });

            setSuccessMessage(`${eventType === 'goal' ? 'Goal' : 'Event'} logged successfully!`);
            
            const eventShareText = `MATCH UPDATE (${activeMatch.teamA} vs ${activeMatch.teamB}): ${finalDescription} ${eventMinute}' #FootballEswatini`;
            setShareContent(eventShareText);

            setEventMinute('');
            setEventDescription('');
            
            setMatches(prev => prev.map(m => {
                if (m.id === activeMatch.id) {
                    let sA = m.scoreA ?? 0;
                    let sB = m.scoreB ?? 0;
                    if (eventType === 'goal') {
                        if (m.teamA === clubName) sA++;
                        if (m.teamB === clubName) sB++;
                    }
                    return { ...m, scoreA: sA, scoreB: sB, events: [...(m.events || []), newEvent], status: 'live' };
                }
                return m;
            }));

            setTimeout(() => setSuccessMessage(null), 5000);

        } catch (error) {
            handleFirestoreError(error, 'log match event');
        } finally {
            setSubmitting(null);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-4">Live Match Console</h3>
                <p className="text-sm text-gray-600 mb-6">Manage match status (Kick-off, Half-time) and log events in real-time.</p>
                
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">{successMessage}</span>
                        </div>
                        {shareContent && (
                            <Button onClick={handleShare} className="bg-green-700 text-white hover:bg-green-800 h-7 px-2 text-xs flex items-center gap-1">
                                <ShareIcon className="w-3 h-3"/> Share
                            </Button>
                        )}
                    </div>
                )}
                
                {loading ? <Spinner /> : matches.length > 0 ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {matches.map(match => (
                                <div key={match.id} className={`border rounded-lg overflow-hidden transition-all ${activeMatchId === match.id ? 'ring-2 ring-primary border-transparent' : 'bg-white'}`}>
                                    <div className="bg-gray-100 p-3 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500">{match.date} {match.time} @ {match.venue}</span>
                                        {match.status === 'live' && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>}
                                        {match.status === 'suspended' && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">SUSPENDED</span>}
                                    </div>
                                    <div className="p-4 flex flex-col items-center">
                                        <div className="flex items-center justify-center gap-4 mb-4">
                                            <span className="font-bold text-lg text-right w-1/3">{match.teamA}</span>
                                            <div className="bg-gray-800 text-white px-4 py-2 rounded text-2xl font-mono font-bold">
                                                {match.scoreA ?? 0} - {match.scoreB ?? 0}
                                            </div>
                                            <span className="font-bold text-lg text-left w-1/3">{match.teamB}</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 justify-center mb-4">
                                            {match.status === 'scheduled' && (
                                                <Button 
                                                    onClick={() => handleStatusChange(match, 'live', 'Match Started')} 
                                                    disabled={!!submitting}
                                                    className="bg-green-600 text-white hover:bg-green-700 h-9 px-4 text-xs font-bold"
                                                >
                                                    <WhistleIcon className="w-4 h-4 mr-2"/> KICK OFF
                                                </Button>
                                            )}
                                            {match.status === 'live' && (
                                                <>
                                                    <Button 
                                                        onClick={() => handleStatusChange(match, 'live', 'Half Time')} 
                                                        disabled={!!submitting}
                                                        className="bg-blue-500 text-white hover:bg-blue-600 h-9 px-4 text-xs font-bold"
                                                    >
                                                        <ClockIcon className="w-4 h-4 mr-2"/> HALF TIME
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleStatusChange(match, 'suspended', 'Match Suspended')} 
                                                        disabled={!!submitting}
                                                        className="bg-orange-500 text-white hover:bg-orange-600 h-9 px-4 text-xs font-bold"
                                                    >
                                                        <AlertTriangleIcon className="w-4 h-4 mr-2"/> SUSPEND
                                                    </Button>
                                                </>
                                            )}
                                            {match.status === 'suspended' && (
                                                <Button 
                                                    onClick={() => handleStatusChange(match, 'live', 'Match Resumed')} 
                                                    disabled={!!submitting}
                                                    className="bg-green-600 text-white hover:bg-green-700 h-9 px-4 text-xs font-bold"
                                                >
                                                    <PlayIcon className="w-4 h-4 mr-2"/> RESUME
                                                </Button>
                                            )}
                                        </div>

                                        {activeMatchId !== match.id ? (
                                            <Button onClick={() => setActiveMatchId(match.id)} className="bg-primary text-white text-sm mt-2 w-full">
                                                Open Logging Console
                                            </Button>
                                        ) : (
                                            <Button onClick={() => setActiveMatchId(null)} className="bg-gray-200 text-gray-700 text-sm mt-2 hover:bg-gray-300 w-full">
                                                Close Console
                                            </Button>
                                        )}
                                    </div>

                                    {activeMatchId === match.id && (
                                        <div className="bg-blue-50 p-4 border-t border-blue-100 animate-slide-down">
                                            <form onSubmit={handleLogEvent} className="space-y-4">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button type="button" onClick={() => setEventType('goal')} className={`p-2 rounded border text-sm font-bold flex flex-col items-center gap-1 ${eventType === 'goal' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white border-gray-200'}`}>
                                                        <GoalIcon className="w-5 h-5"/> Goal
                                                    </button>
                                                    <button type="button" onClick={() => setEventType('yellow-card')} className={`p-2 rounded border text-sm font-bold flex flex-col items-center gap-1 ${eventType === 'yellow-card' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : 'bg-white border-gray-200'}`}>
                                                        <CardIcon className="w-5 h-5 text-yellow-500"/> Yellow Card
                                                    </button>
                                                    <button type="button" onClick={() => setEventType('red-card')} className={`p-2 rounded border text-sm font-bold flex flex-col items-center gap-1 ${eventType === 'red-card' ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white border-gray-200'}`}>
                                                        <CardIcon className="w-5 h-5 text-red-600"/> Red Card
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Player</label>
                                                        <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} className={inputClass} required>
                                                            <option value="">Select Player...</option>
                                                            {squad.map(p => (
                                                                <option key={p.id} value={p.id}>{p.number} - {p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-700 mb-1">Minute</label>
                                                        <div className="relative">
                                                            <ClockIcon className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                                                            <input type="number" value={eventMinute} onChange={e => setEventMinute(e.target.value)} placeholder="Min" className={`${inputClass} pl-9`} required min="1" max="130" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
                                                    <input type="text" value={eventDescription} onChange={e => setEventDescription(e.target.value)} placeholder="e.g. Beautiful header from corner" className={inputClass} />
                                                </div>

                                                <div className="flex justify-between pt-4 border-t border-blue-200">
                                                    <Button 
                                                        type="button" 
                                                        onClick={() => {
                                                            if (window.confirm("Are you sure the match is finished? This will move it to the results section.")) {
                                                                handleStatusChange(match, 'finished', 'Full Time');
                                                            }
                                                        }} 
                                                        className="text-red-600 hover:text-white hover:bg-red-600 text-xs font-bold border border-red-200"
                                                    >
                                                        End Match (FT)
                                                    </Button>
                                                    <Button type="submit" disabled={submitting === match.id} className="bg-green-600 text-white hover:bg-green-700">
                                                        {submitting === match.id ? <Spinner className="w-4 h-4 border-2"/> : 'Log Event & Update Score'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-3"/>
                        <p className="text-gray-500 font-medium">No active matches found for {clubName}.</p>
                        <p className="text-xs text-gray-400 mt-1">Check back on matchday.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UpdateScores;
