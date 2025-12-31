
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { addLiveUpdate, fetchAllCompetitions, handleFirestoreError, LiveUpdate } from '../../services/api';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { GoogleGenAI, Type } from '@google/genai';
import SparklesIcon from '../icons/SparklesIcon';
import { CompetitionFixture, Competition } from '../../data/teams';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, calculateStandings } from '../../services/utils';
import PlayIcon from '../icons/PlayIcon';
import ClockIcon from '../icons/ClockIcon';
import RadioIcon from '../icons/RadioIcon';

const LiveUpdatesEntry: React.FC = () => {
    const [formData, setFormData] = useState<{
        fixture_id: string;
        competition: string;
        competitionId: string;
        home_team: string;
        away_team: string;
        minute: string;
        type: LiveUpdate['type'];
        player: string;
        description: string;
        score_home: string;
        score_away: string;
    }>({
        fixture_id: '',
        competition: '',
        competitionId: '', 
        home_team: '',
        away_team: '',
        minute: '',
        type: 'goal',
        player: '',
        description: '',
        score_home: '',
        score_away: '',
    });
    const [pastedText, setPastedText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    
    const [todaysMatches, setTodaysMatches] = useState<{ fixture: CompetitionFixture, compName: string, compId: string }[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    const loadMatches = useCallback(async () => {
        setLoadingMatches(true);
        try {
            const allComps = await fetchAllCompetitions();
            const matches: { fixture: CompetitionFixture, compName: string, compId: string }[] = [];
            const today = new Date();

            Object.entries(allComps).forEach(([compId, comp]) => {
                if (comp.fixtures) {
                    comp.fixtures.forEach(f => {
                        const matchDate = new Date(f.fullDate + 'T' + (f.time || '00:00'));
                        const diffHours = (today.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                        
                        // Show if live, suspended or within 3 days window
                        if (f.status === 'live' || f.status === 'suspended' || (diffHours < 72 && diffHours > -72)) {
                            matches.push({ fixture: f, compName: comp.name, compId: compId });
                        }
                    });
                }
            });
            
            matches.sort((a, b) => {
                if (a.fixture.status === 'live' && b.fixture.status !== 'live') return -1;
                if (b.fixture.status === 'live' && a.fixture.status !== 'live') return 1;
                return new Date(a.fixture.fullDate || '').getTime() - new Date(b.fixture.fullDate || '').getTime();
            });

            setTodaysMatches(matches);
        } catch (err) {
            console.error("Error loading matches", err);
        } finally {
            setLoadingMatches(false);
        }
    }, []);

    useEffect(() => {
        loadMatches();
    }, [loadMatches]);

    const handleSelectMatch = (match: { fixture: CompetitionFixture, compName: string, compId: string }) => {
        setFormData(prev => ({
            ...prev,
            fixture_id: String(match.fixture.id),
            competition: match.compName,
            competitionId: match.compId,
            home_team: match.fixture.teamA,
            away_team: match.fixture.teamB,
            score_home: String(match.fixture.scoreA || 0),
            score_away: String(match.fixture.scoreB || 0),
            minute: String(match.fixture.liveMinute || ''),
            description: ''
        }));
        setSuccessMessage('');
        setError('');
    };

    const handleParse = async () => {
        if (!pastedText.trim()) return setError('Please paste some text to analyze.');
        if (!process.env.API_KEY) return setError('API_KEY is not configured.');
        
        setIsParsing(true);
        setError('');
        
        const prompt = `Analyze this match update text: "${pastedText}"
        
        Map the update to these categories: 'goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'match_postponed', 'match_abandoned', 'match_suspended'.
        
        Return a JSON object with:
        - type (string)
        - minute (string)
        - score_home (number or null)
        - score_away (number or null)
        - player (string, name only)
        - description (string, concise summary)
        
        Default to 'goal' if a score is mentioned. If it's a general update, use 'info'.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                score_home: { type: Type.NUMBER },
                score_away: { type: Type.NUMBER },
                minute: { type: Type.STRING },
                type: { type: Type.STRING }, 
                player: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt, 
                config: { 
                    responseMimeType: 'application/json', 
                    responseSchema 
                } 
            });
            
            const parsedData = JSON.parse(response.text || '{}');
            
            // Map type to strictly allowed enums
            const allowedTypes = ['goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'match_postponed', 'match_abandoned', 'match_suspended'];
            let mappedType: LiveUpdate['type'] = 'goal';
            if (allowedTypes.includes(parsedData.type)) mappedType = parsedData.type;

            setFormData(prev => ({ 
                ...prev, 
                ...parsedData,
                type: mappedType,
                score_home: parsedData.score_home != null ? String(parsedData.score_home) : prev.score_home,
                score_away: parsedData.score_away != null ? String(parsedData.score_away) : prev.score_away,
            }));

        } catch (err: any) {
            console.error("AI Parsing Error:", err);
            setError(`Parsing failed: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = async (matchData: typeof todaysMatches[0], newStatus: string) => {
        if (!newStatus || newStatus === matchData.fixture.status) return;
        if (!window.confirm(`Change match status to ${newStatus.toUpperCase()}?`)) return;
        
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        try {
            const docRef = doc(db, 'competitions', matchData.compId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const competition = docSnap.data() as Competition;
                const fixtures = competition.fixtures || [];
                const results = competition.results || [];
                
                const fixtureIndex = fixtures.findIndex(f => String(f.id) === String(matchData.fixture.id));
                if (fixtureIndex === -1) throw new Error("Fixture not found in active list.");

                const fixture = fixtures[fixtureIndex];
                const updatedFixture = { 
                    ...fixture, 
                    status: newStatus as any,
                    liveMinute: newStatus === 'live' ? (fixture.liveMinute || 1) : fixture.liveMinute
                };
                
                const updatedFixtures = [...fixtures];
                
                if (newStatus === 'finished') {
                    updatedFixtures.splice(fixtureIndex, 1);
                    const updatedResults = [...results, updatedFixture];
                    const updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);
                    
                    transaction.update(docRef, removeUndefinedProps({
                        fixtures: updatedFixtures,
                        results: updatedResults,
                        teams: updatedTeams
                    }));
                } else {
                    updatedFixtures[fixtureIndex] = updatedFixture;
                    transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
                }
            });
            
            setSuccessMessage(`Status set to ${newStatus.toUpperCase()}`);
            loadMatches();
        } catch (err: any) {
            handleFirestoreError(err, 'update match status');
            setError('Update failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fixture_id) {
            setError("Select a match first.");
            return;
        }

        setIsSubmitting(true);
        setSuccessMessage('');
        setError('');
        
        try {
            const minuteInt = parseInt(formData.minute, 10) || 0;
            const scoreHomeInt = parseInt(formData.score_home, 10);
            const scoreAwayInt = parseInt(formData.score_away, 10);

            const updateData: Omit<LiveUpdate, 'id' | 'timestamp'> = {
                fixture_id: formData.fixture_id,
                competition: formData.competition,
                home_team: formData.home_team,
                away_team: formData.away_team,
                minute: minuteInt,
                type: formData.type,
                player: formData.player,
                description: formData.description,
                score_home: isNaN(scoreHomeInt) ? 0 : scoreHomeInt,
                score_away: isNaN(scoreAwayInt) ? 0 : scoreAwayInt,
            };

            await addLiveUpdate(updateData);
            
            const docRef = doc(db, 'competitions', formData.competitionId);
            await runTransaction(db, async (transaction) => {
                 const docSnap = await transaction.get(docRef);
                 if (!docSnap.exists()) return;
                 const comp = docSnap.data() as Competition;
                 const fixtures = comp.fixtures || [];
                 const fIndex = fixtures.findIndex(f => String(f.id) === formData.fixture_id);
                 
                 if (fIndex !== -1) {
                     const f = fixtures[fIndex];
                     const newEvent = {
                         minute: minuteInt,
                         type: formData.type === 'yellow_card' ? 'yellow-card' : formData.type === 'red_card' ? 'red-card' : formData.type as any,
                         description: formData.description,
                         playerName: formData.player
                     };
                     
                     const updatedFixtures = [...fixtures];
                     updatedFixtures[fIndex] = {
                         ...f,
                         scoreA: updateData.score_home,
                         scoreB: updateData.score_away,
                         liveMinute: minuteInt,
                         events: [...(f.events || []), newEvent]
                     };
                     
                     transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
                 }
            });

            setSuccessMessage("Update published.");
            setFormData(prev => ({ ...prev, player: '', description: '' }));
            loadMatches();
        } catch (err: any) {
            handleFirestoreError(err, 'publish update');
            setError('Publish failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
                <Card className="shadow-lg h-full border-0 bg-white">
                    <CardContent className="p-4">
                        <h3 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-gray-400"/> Active Matches
                        </h3>
                        {loadingMatches ? <Spinner /> : (
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                {todaysMatches.length > 0 ? todaysMatches.map((m) => (
                                    <div 
                                        key={m.fixture.id} 
                                        onClick={() => handleSelectMatch(m)}
                                        className={`p-3 border rounded-xl cursor-pointer transition-all ${formData.fixture_id === String(m.fixture.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{m.compName}</span>
                                            {m.fixture.status === 'live' && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black animate-pulse">LIVE</span>}
                                        </div>
                                        <div className="font-bold text-sm text-gray-900">{m.fixture.teamA} vs {m.fixture.teamB}</div>
                                        <div className="flex justify-between items-center text-xs text-gray-500 font-semibold mt-1">
                                            <span>{m.fixture.scoreA ?? 0} - {m.fixture.scoreB ?? 0}</span>
                                            <span className="font-mono">{m.fixture.status === 'live' ? (m.fixture.liveMinute || '?') + "'" : m.fixture.time}</span>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-gray-50 flex gap-2 justify-end">
                                             {m.fixture.status === 'scheduled' && (
                                                 <button onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'live'); }} className="text-[10px] bg-green-600 text-white px-3 py-1 rounded-full font-bold hover:bg-green-700">Start</button>
                                             )}
                                             {m.fixture.status === 'live' && (
                                                 <button onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'finished'); }} className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-bold hover:bg-red-700">FT</button>
                                             )}
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500 text-center py-8">No scheduled matches for today.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card className="shadow-lg animate-fade-in border-0 bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <RadioIcon className="w-8 h-8 text-secondary animate-pulse" />
                            <h3 className="text-2xl font-bold font-display text-gray-900">Live Commentary Console</h3>
                        </div>

                        {successMessage && <div className="p-4 bg-green-50 text-green-800 rounded-xl mb-6 flex items-center gap-2 border border-green-100"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        {error && <div className="p-4 bg-red-50 text-red-800 rounded-xl mb-6 border border-red-100">{error}</div>}

                        <div className="mb-8 p-5 bg-purple-50 rounded-2xl border border-purple-100 shadow-inner">
                             <label className="block text-xs font-black text-purple-800 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                <SparklesIcon className="w-4 h-4"/> AI Assist: Voice-to-Text / Raw Input
                             </label>
                             <div className="flex gap-2">
                                 <textarea 
                                    value={pastedText}
                                    onChange={e => setPastedText(e.target.value)}
                                    placeholder="Paste raw update text or match report clip here..."
                                    className="flex-grow text-sm p-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                                    rows={2}
                                 />
                                 <Button onClick={handleParse} disabled={isParsing} className="bg-purple-600 text-white px-4 h-auto shadow-md">
                                     {isParsing ? <Spinner className="w-4 h-4 border-white" /> : 'Analyze'}
                                 </Button>
                             </div>
                             <p className="text-[10px] text-purple-600 mt-2 font-semibold">Instantly fill score, minute, and description from raw text.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Home</label>
                                    <input type="text" value={formData.home_team} className="w-full bg-transparent font-bold text-gray-800 outline-none" readOnly />
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Away</label>
                                    <input type="text" value={formData.away_team} className="w-full bg-transparent font-bold text-gray-800 outline-none" readOnly />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Update Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                        <option value="goal">⚽ Goal</option>
                                        <option value="yellow_card">🟨 Yellow Card</option>
                                        <option value="red_card">🟥 Red Card</option>
                                        <option value="substitution">🔄 Substitution</option>
                                        <option value="half_time">⏱️ Half Time</option>
                                        <option value="full_time">🏁 Full Time</option>
                                        <option value="match_suspended">⚠️ Suspended</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Minute</label>
                                    <input type="text" name="minute" value={formData.minute} onChange={handleChange} className={inputClass} placeholder="e.g. 45" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Player</label>
                                    <input type="text" name="player" value={formData.player} onChange={handleChange} className={inputClass} placeholder="Name" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Commentary Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass} rows={2} required placeholder="Detailed event description..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-gray-900 p-4 rounded-xl shadow-xl">
                                <div>
                                    <label className="block text-[10px] font-black text-white/50 mb-1 uppercase tracking-widest">Home Score</label>
                                    <input type="number" name="score_home" value={formData.score_home} onChange={handleChange} className="w-full bg-transparent text-white font-bold text-2xl outline-none border-b border-white/20 pb-1" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/50 mb-1 uppercase tracking-widest">Away Score</label>
                                    <input type="number" name="score_away" value={formData.score_away} onChange={handleChange} className="w-full bg-transparent text-white font-bold text-2xl outline-none border-b border-white/20 pb-1" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button type="submit" disabled={isSubmitting || !formData.fixture_id} className="bg-red-600 text-white hover:bg-red-700 w-full h-12 flex items-center justify-center gap-3 shadow-xl rounded-xl text-lg font-bold">
                                    {isSubmitting ? <Spinner className="w-5 h-5 border-white border-2" /> : <><PlayIcon className="w-5 h-5" /> Post Real-Time Update</>}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LiveUpdatesEntry;
