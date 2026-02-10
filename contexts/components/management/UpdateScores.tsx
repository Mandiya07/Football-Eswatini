
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchAllCompetitions, handleFirestoreError, fetchCompetition } from '../../services/api';
import { CompetitionFixture, Competition, Player, MatchEvent } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps, superNormalize } from '../../services/utils';
import { useAuth } from '../../contexts/AuthContext';
import TrophyIcon from '../icons/TrophyIcon';
import CalendarIcon from '../icons/CalendarIcon';
import PencilIcon from '../icons/PencilIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import UserIcon from '../icons/UserIcon';
import SearchIcon from '../icons/SearchIcon';

const UpdateScores: React.FC<{ clubName?: string; leagueIds?: string[] }> = ({ clubName, leagueIds }) => {
    const [matches, setMatches] = useState<{ fixture: CompetitionFixture, compId: string, compName: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const { user } = useAuth();

    const [activeMatchId, setActiveMatchId] = useState<number | string | null>(null);
    const [eventType, setEventType] = useState<'goal' | 'yellow-card' | 'red-card' | 'substitution'>('goal');
    const [eventMinute, setEventMinute] = useState('');
    const [eventTeamSide, setEventTeamSide] = useState<'home' | 'away'>('home');
    const [playerName, setPlayerName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    
    // Roster for current competition
    const [currentCompTeams, setCurrentCompTeams] = useState<any[]>([]);
    const [showPlayerSuggestions, setShowPlayerSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const allComps = await fetchAllCompetitions();
                const relevantMatches: typeof matches = [];

                Object.entries(allComps).forEach(([id, comp]) => {
                    const processMatchList = (list: CompetitionFixture[] | undefined) => {
                        list?.forEach(f => {
                            const isHome = superNormalize(f.teamA) === superNormalize(clubName || '');
                            const isAway = superNormalize(f.teamB) === superNormalize(clubName || '');
                            if (isHome || isAway) {
                                relevantMatches.push({ fixture: f, compId: id, compName: comp.name });
                            }
                        });
                    };
                    processMatchList(comp.fixtures);
                    processMatchList(comp.results);
                });

                relevantMatches.sort((a, b) => {
                    if (a.fixture.status === 'live' && b.fixture.status !== 'live') return -1;
                    if (b.fixture.status === 'live' && a.fixture.status !== 'live') return 1;
                    return new Date(b.fixture.fullDate || 0).getTime() - new Date(a.fixture.fullDate || 0).getTime();
                });

                setMatches(relevantMatches);
            } catch (err) {
                console.error("Failed to load match control data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();

        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowPlayerSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [clubName, leagueIds, user]);

    // Load teams for active competition when a match is selected
    useEffect(() => {
        const active = matches.find(m => m.fixture.id === activeMatchId);
        if (active) {
            fetchCompetition(active.compId).then(data => {
                if (data?.teams) setCurrentCompTeams(data.teams);
            });
        }
    }, [activeMatchId, matches]);

    const activeRoster = useMemo(() => {
        const active = matches.find(m => m.fixture.id === activeMatchId);
        if (!active) return [];
        const targetName = eventTeamSide === 'home' ? active.fixture.teamA : active.fixture.teamB;
        const team = currentCompTeams.find(t => superNormalize(t.name) === superNormalize(targetName));
        return team?.players || [];
    }, [activeMatchId, eventTeamSide, currentCompTeams, matches]);

    const filteredSuggestions = useMemo(() => {
        if (!playerName || playerName.length < 1) return activeRoster.slice(0, 5);
        const term = playerName.toLowerCase();
        return activeRoster.filter(p => 
            p.name.toLowerCase().includes(term) || 
            String(p.number).includes(term)
        ).slice(0, 5);
    }, [activeRoster, playerName]);

    const handleStatusChange = async (m: typeof matches[0], newStatus: any) => {
        setSubmitting(m.fixture.id);
        try {
            const docRef = doc(db, 'competitions', m.compId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition missing");
                const competition = docSnap.data() as Competition;
                
                const currentFixtures = competition.fixtures || [];
                const currentResults = competition.results || [];
                const targetId = String(m.fixture.id).trim();
                
                let fixture: CompetitionFixture | undefined;
                let isFromFixtures = true;

                const fIdx = currentFixtures.findIndex(f => String(f.id).trim() === targetId);
                if (fIdx !== -1) {
                    fixture = { ...currentFixtures[fIdx] };
                } else {
                    const rIdx = currentResults.findIndex(r => String(r.id).trim() === targetId);
                    if (rIdx !== -1) {
                        fixture = { ...currentResults[rIdx] };
                        isFromFixtures = false;
                    }
                }

                if (!fixture) throw new Error("Match not found.");
                fixture.status = newStatus;

                let updatedFixtures = [...currentFixtures];
                let updatedResults = [...currentResults];

                if (newStatus === 'finished') {
                    if (isFromFixtures) {
                        updatedFixtures.splice(fIdx, 1);
                        updatedResults.push(fixture);
                    } else {
                        updatedResults[updatedResults.findIndex(r => String(r.id).trim() === targetId)] = fixture;
                    }
                } else {
                    if (!isFromFixtures) {
                        updatedResults = updatedResults.filter(r => String(r.id).trim() !== targetId);
                        updatedFixtures.push(fixture);
                    } else {
                        updatedFixtures[fIdx] = fixture;
                    }
                }

                const updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);
                transaction.update(docRef, removeUndefinedProps({ 
                    fixtures: updatedFixtures, 
                    results: updatedResults, 
                    teams: updatedTeams 
                }));
            });
            setSuccessMessage(`Update Success! Status: ${newStatus.toUpperCase()}`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (e) {
            console.error(e);
            alert("Update failed.");
        } finally {
            setSubmitting(null);
        }
    };

    const handleLogEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const active = matches.find(m => m.fixture.id === activeMatchId);
        if (!active) return;

        setSubmitting(active.fixture.id);
        const minVal = parseInt(eventMinute);
        const targetTeamName = eventTeamSide === 'home' ? active.fixture.teamA : active.fixture.teamB;
        
        const selectedPlayer = activeRoster.find(p => p.name === playerName);

        const newEvent: MatchEvent = {
            minute: isNaN(minVal) ? undefined : minVal,
            type: eventType,
            description: eventDescription || `${eventType.toUpperCase()} - ${playerName}`,
            playerName: playerName.trim(),
            playerID: selectedPlayer?.id,
            teamName: targetTeamName 
        };

        try {
            const docRef = doc(db, 'competitions', active.compId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) return;
                const competition = docSnap.data() as Competition;
                
                let sA = active.fixture.scoreA || 0;
                let sB = active.fixture.scoreB || 0;
                if (eventType === 'goal') {
                    if (eventTeamSide === 'home') sA++; else sB++;
                }

                const updatedFixtures = (competition.fixtures || []).map(f => {
                    if (String(f.id).trim() === String(activeMatchId).trim()) {
                        return { ...f, events: [...(f.events || []), newEvent], scoreA: sA, scoreB: sB, liveMinute: newEvent.minute, status: 'live' as const };
                    }
                    return f;
                });
                
                const updatedResults = competition.results || [];
                const updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);
                
                transaction.update(docRef, removeUndefinedProps({ fixtures: updatedFixtures, teams: updatedTeams }));
            });
            
            setSuccessMessage("Broadcasted & Stats Reconciled!");
            setEventMinute('');
            setPlayerName('');
            setEventDescription('');
            setShowPlayerSuggestions(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (e) {
            console.error(e);
            alert("Broadcast failed.");
        } finally { setSubmitting(null); }
    };

    if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

    return (
        <Card className="shadow-lg border-t-4 border-primary">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <TrophyIcon className="w-8 h-8 text-primary" />
                    <div>
                        <h3 className="text-2xl font-bold font-display text-gray-900">League Match Command</h3>
                        <p className="text-sm text-gray-500">Update scores and sync player records for {clubName}.</p>
                    </div>
                </div>
                
                {matches.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500 font-bold">No upcoming official matches detected.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {matches.map(m => (
                            <div key={m.fixture.id} className={`p-5 border-2 rounded-2xl transition-all ${activeMatchId === m.fixture.id ? 'border-primary bg-blue-50/20' : 'border-slate-100 bg-white shadow-sm'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{m.compName}</span>
                                        {m.fixture.status === 'live' && <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">{m.fixture.fullDate} • {m.fixture.time}</span>
                                </div>

                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center mb-6">
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${superNormalize(m.fixture.teamA) === superNormalize(clubName || '') ? 'text-primary' : 'text-gray-700'}`}>{m.fixture.teamA}</p>
                                    </div>
                                    <div className="bg-slate-900 text-white px-5 py-2 rounded-xl shadow-lg font-mono">
                                        <span className="text-3xl font-black tabular-nums text-accent">{m.fixture.scoreA ?? 0} : {m.fixture.scoreB ?? 0}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-black text-lg ${superNormalize(m.fixture.teamB) === superNormalize(clubName || '') ? 'text-primary' : 'text-gray-700'}`}>{m.fixture.teamB}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 justify-center pt-4 border-t border-slate-100">
                                    {m.fixture.status !== 'live' && m.fixture.status !== 'finished' && (
                                        <Button onClick={() => handleStatusChange(m, 'live')} className="bg-green-600 text-white text-xs h-9 px-4 font-bold">
                                            Kickoff
                                        </Button>
                                    )}
                                    {m.fixture.status === 'live' && (
                                        <Button onClick={() => handleStatusChange(m, 'finished')} className="bg-red-600 text-white text-xs h-9 px-4 font-bold">
                                            FT Whistle
                                        </Button>
                                    )}
                                    <Button 
                                        onClick={() => setActiveMatchId(activeMatchId === m.fixture.id ? null : m.fixture.id)} 
                                        className={`${activeMatchId === m.fixture.id ? 'bg-slate-800' : 'bg-primary'} text-white text-xs h-9 px-4 font-bold flex items-center gap-1.5`}
                                    >
                                        <PencilIcon className="w-4 h-4" /> Live Events
                                    </Button>
                                </div>
                                
                                {activeMatchId === m.fixture.id && (
                                    <form onSubmit={handleLogEvent} className="mt-6 p-5 bg-white border border-primary/20 rounded-2xl shadow-inner">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                            <div className="col-span-2 relative" ref={suggestionRef}>
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Player Identity</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={playerName}
                                                        onChange={e => {
                                                            setPlayerName(e.target.value);
                                                            setShowPlayerSuggestions(true);
                                                        }}
                                                        onFocus={() => setShowPlayerSuggestions(true)}
                                                        placeholder="Search roster..."
                                                        className="w-full border border-gray-200 p-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                        <SearchIcon className="h-4 w-4 text-gray-300" />
                                                    </div>
                                                </div>
                                                {showPlayerSuggestions && (
                                                    <div className="absolute z-50 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                        {filteredSuggestions.length > 0 ? (
                                                            filteredSuggestions.map(p => (
                                                                <button 
                                                                    key={p.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setPlayerName(p.name);
                                                                        setShowPlayerSuggestions(false);
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between border-b last:border-0 border-gray-50"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border text-[10px] font-black text-gray-400">
                                                                            {p.number || <UserIcon className="w-4 h-4"/>}
                                                                        </div>
                                                                        <span className="font-bold text-sm text-gray-800">{p.name}</span>
                                                                    </div>
                                                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{p.position}</span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center">
                                                                <p className="text-xs text-gray-500 font-medium italic">Name not found in roster. Using custom entry.</p>
                                                            </div>
                                                        )}
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowPlayerSuggestions(false)}
                                                            className="w-full py-2 bg-gray-50 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors border-t"
                                                        >
                                                            Continue with current name
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Minute</label>
                                                <input value={eventMinute} onChange={e => setEventMinute(e.target.value)} type="number" className="w-full border border-gray-200 p-2 rounded-xl text-sm" placeholder="Min" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Team</label>
                                                <select value={eventTeamSide} onChange={e => setEventTeamSide(e.target.value as any)} className="w-full border border-gray-200 p-2 rounded-xl text-sm">
                                                    <option value="home">{m.fixture.teamA}</option>
                                                    <option value="away">{m.fixture.teamB}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Event Type</label>
                                                <select value={eventType} onChange={e => setEventType(e.target.value as any)} className="w-full border border-gray-200 p-2 rounded-xl text-sm">
                                                    <option value="goal">⚽ Goal</option>
                                                    <option value="yellow-card">🟨 Yellow</option>
                                                    <option value="red-card">🟥 Red</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2 md:col-span-3">
                                                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Description</label>
                                                <input value={eventDescription} onChange={e => setEventDescription(e.target.value)} className="w-full border border-gray-200 p-2 rounded-xl text-sm" placeholder="e.g. Scored a powerful header" />
                                            </div>
                                            <div className="col-span-2 md:col-span-1">
                                                <Button type="submit" className="w-full bg-blue-600 text-white h-10 rounded-xl font-bold shadow-lg">Broadcast</Button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            {successMessage && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl z-[200] font-bold flex items-center gap-2 animate-in slide-in-from-bottom-10">
                    <CheckCircleIcon className="w-5 h-5" /> {successMessage}
                </div>
            )}
        </Card>
    );
};

export default UpdateScores;
