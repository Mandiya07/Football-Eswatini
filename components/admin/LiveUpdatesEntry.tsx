
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
        }));
        setSuccessMessage('');
        setError('');
        setTimeout(() => {
            document.getElementById('update-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleParse = async () => {
        if (!pastedText.trim()) return setError('Please paste some text to analyze.');
        if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
            return setError('API_KEY is not configured. Please add it to your environment variables.');
        }
        
        setIsParsing(true);
        setError('');
        
        const prompt = `Analyze this football match update: "${pastedText}"
        
        Extract the following fields into a JSON object:
        - type: The event type. Must be roughly one of: 'goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'match_postponed', 'match_abandoned', 'match_suspended'. Default to 'goal' if it looks like a score change.
        - minute: The minute of the event as a string (e.g. "45").
        - score_home: Home team score (if present/implied).
        - score_away: Away team score (if present/implied).
        - player: Name of player involved.
        - description: A clean, short description of the event.
        
        If a field is missing, use an empty string.`;

        // Removing strict enum to prevent validation errors if model is slightly off. We map it manually below.
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                score_home: { type: Type.STRING },
                score_away: { type: Type.STRING },
                minute: { type: Type.STRING },
                type: { type: Type.STRING }, 
                player: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt, 
                config: { 
                    responseMimeType: 'application/json', 
                    responseSchema 
                } 
            });
            
            const text = response.text;
            if (!text) throw new Error("No response text received from AI.");

            const parsedData = JSON.parse(text);
            
            // Normalize the 'type' field to match our dropdown
            let mappedType: LiveUpdate['type'] = 'goal';
            const rawType = (parsedData.type || '').toLowerCase();
            if (rawType.includes('yellow')) mappedType = 'yellow_card';
            else if (rawType.includes('red')) mappedType = 'red_card';
            else if (rawType.includes('sub')) mappedType = 'substitution';
            else if (rawType.includes('half')) mappedType = 'half_time';
            else if (rawType.includes('full')) mappedType = 'full_time';
            else if (rawType.includes('postpone')) mappedType = 'match_postponed';
            else if (rawType.includes('abandon')) mappedType = 'match_abandoned';
            else if (rawType.includes('suspend')) mappedType = 'match_suspended';
            else mappedType = 'goal';

            setFormData(prev => ({ 
                ...prev, 
                ...parsedData,
                type: mappedType 
            }));

        } catch (err: any) {
            console.error("AI Parsing Error:", err);
            let msg = err.message || "Unknown error";
            if (msg.includes('400')) msg = "AI Request Failed (400). Ensure text is clear.";
            if (msg.includes('403') || msg.includes('API key')) msg = "Invalid API Key or Permissions.";
            setError(`Parsing failed: ${msg}`);
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
        if (!window.confirm(`Change status to ${newStatus.toUpperCase()}?`)) return;
        
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
            
            setSuccessMessage(`Match status updated to ${newStatus.toUpperCase()}.`);
            loadMatches();
        } catch (err: any) {
            handleFirestoreError(err, 'update match status');
            setError('Failed to update status.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fixture_id || !formData.competitionId) {
            setError("Please select a match from the list above first.");
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
            
            // Also update the competition document with score/minute/events
            const docRef = doc(db, 'competitions', formData.competitionId);
            await runTransaction(db, async (transaction) => {
                 const docSnap = await transaction.get(docRef);
                 if (!docSnap.exists()) throw new Error("Competition not found");
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
                     
                     const updatedFixture = {
                         ...f,
                         scoreA: updateData.score_home,
                         scoreB: updateData.score_away,
                         liveMinute: minuteInt,
                         events: [...(f.events || []), newEvent]
                     };
                     
                     const updatedFixtures = [...fixtures];
                     updatedFixtures[fIndex] = updatedFixture;
                     
                     transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
                 }
            });

            setSuccessMessage("Update sent successfully!");
            setFormData(prev => ({ ...prev, minute: '', player: '', description: '' }));
            loadMatches();
        } catch (err: any) {
            handleFirestoreError(err, 'submit live update');
            setError('Failed to submit update.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Matches List */}
            <div className="lg:col-span-1 space-y-4">
                <Card className="shadow-lg h-full">
                    <CardContent className="p-4">
                        <h3 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-gray-500"/> Active & Upcoming Matches
                        </h3>
                        {loadingMatches ? <Spinner /> : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                {todaysMatches.length > 0 ? todaysMatches.map((m) => (
                                    <div 
                                        key={m.fixture.id} 
                                        onClick={() => handleSelectMatch(m)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.fixture_id === String(m.fixture.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-gray-500 uppercase">{m.compName}</span>
                                            {m.fixture.status === 'live' && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded animate-pulse">LIVE</span>}
                                        </div>
                                        <div className="font-bold text-sm mb-1">{m.fixture.teamA} vs {m.fixture.teamB}</div>
                                        <div className="flex justify-between items-center text-xs text-gray-600">
                                            <span>{m.fixture.scoreA ?? 0} - {m.fixture.scoreB ?? 0}</span>
                                            <span className="font-mono">{m.fixture.status === 'live' ? (m.fixture.liveMinute || '?') + "'" : m.fixture.time}</span>
                                        </div>
                                        <div className="mt-2 pt-2 border-t flex gap-2 justify-end">
                                             {m.fixture.status === 'scheduled' && (
                                                 <button onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'live'); }} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Start</button>
                                             )}
                                             {m.fixture.status === 'live' && (
                                                 <>
                                                     <button onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'suspended'); }} className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200">Suspend</button>
                                                     <button onClick={(e) => { e.stopPropagation(); handleStatusChange(m, 'finished'); }} className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Finish</button>
                                                 </>
                                             )}
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-gray-500 text-center py-4">No active matches found.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Entry Form */}
            <div className="lg:col-span-2">
                <Card className="shadow-lg animate-fade-in" id="update-form">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <RadioIcon className="w-6 h-6 text-red-600 animate-pulse" />
                            <h3 className="text-2xl font-bold font-display">Live Commentary Entry</h3>
                        </div>

                        {successMessage && <div className="p-3 bg-green-100 text-green-800 rounded-md mb-4 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/>{successMessage}</div>}
                        {error && <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">{error}</div>}

                        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
                             <label className="block text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4"/> AI Assist (Quick Parse)
                             </label>
                             <div className="flex gap-2">
                                 <textarea 
                                    value={pastedText}
                                    onChange={e => setPastedText(e.target.value)}
                                    placeholder="Paste raw update text here (e.g., 'Goal! 34th minute, Sabelo scores for Swallows, score is now 1-0')"
                                    className="flex-grow text-sm p-2 border border-purple-200 rounded focus:outline-none focus:ring-purple-400"
                                    rows={2}
                                 />
                                 <Button onClick={handleParse} disabled={isParsing} className="bg-purple-600 text-white text-xs px-3 h-auto">
                                     {isParsing ? <Spinner className="w-3 h-3 border-white" /> : 'Parse'}
                                 </Button>
                             </div>
                             <p className="text-xs text-purple-600 mt-1">Accepts match events, scores, and updates. Paste any text to auto-fill the form below.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Home Team</label>
                                    <input type="text" name="home_team" value={formData.home_team} onChange={handleChange} className={inputClass} readOnly />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Away Team</label>
                                    <input type="text" name="away_team" value={formData.away_team} onChange={handleChange} className={inputClass} readOnly />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
                                    <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                        <option value="goal">Goal</option>
                                        <option value="yellow_card">Yellow Card</option>
                                        <option value="red_card">Red Card</option>
                                        <option value="substitution">Substitution</option>
                                        <option value="half_time">Half Time</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="match_suspended">Suspended</option>
                                        <option value="match_postponed">Postponed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Minute</label>
                                    <input type="text" name="minute" value={formData.minute} onChange={handleChange} className={inputClass} placeholder="e.g. 45" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Player Name</label>
                                    <input type="text" name="player" value={formData.player} onChange={handleChange} className={inputClass} placeholder="Player involved" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className={inputClass} rows={2} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Home Score</label>
                                    <input type="number" name="score_home" value={formData.score_home} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Away Score</label>
                                    <input type="number" name="score_away" value={formData.score_away} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>

                            <div className="text-right">
                                <Button type="submit" disabled={isSubmitting} className="bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto px-8 h-10 flex items-center justify-center gap-2">
                                    {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : <><PlayIcon className="w-4 h-4" /> Send Update</>}
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
