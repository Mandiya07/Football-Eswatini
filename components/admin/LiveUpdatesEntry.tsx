
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
import Edit3Icon from '../icons/Edit3Icon';
import ClockIcon from '../icons/ClockIcon';

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
        competitionId: '', // Hidden field to store the doc ID
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
    
    // State for the match selector
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
                        // Filter for matches that are scheduled for today/soon, or are already live/suspended
                        const matchDate = new Date(f.fullDate + 'T' + (f.time || '00:00'));
                        const diffHours = (today.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                        
                        // WIDENED RANGE: Show matches +/- 72 hours (3 days) to capture yesterday's results or tomorrow's games
                        if (f.status === 'live' || f.status === 'suspended' || (diffHours < 72 && diffHours > -72)) {
                            matches.push({ fixture: f, compName: comp.name, compId: compId });
                        }
                    });
                }
            });
            
            // Sort matches: Live first, then by date
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
        // Clear previous messages when selecting a new match
        setSuccessMessage('');
        setError('');
        // Scroll to form
        setTimeout(() => {
            document.getElementById('update-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

     const handleParse = async () => {
        if (!pastedText.trim()) return setError('Please paste some text to analyze.');
        if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
            return setError('System Error: API_KEY is not configured. Please add the API_KEY environment variable in your Vercel project settings.');
        }
        
        setIsParsing(true);
        setError('');
        
        const prompt = `Analyze the following football match update. Extract the event details. 
        The 'type' must be one of: 'goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'match_postponed', 'match_abandoned', 'match_suspended'.
        If you cannot determine a field, leave it as an empty string.
        
        Text: "${pastedText}"`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                score_home: { type: Type.STRING },
                score_away: { type: Type.STRING },
                minute: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'match_postponed', 'match_abandoned', 'match_suspended'] },
                player: { type: Type.STRING },
                description: { type: Type.STRING },
            }
        };

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema } });
            const parsedData = JSON.parse(response.text);
            
            setFormData(prev => ({ ...prev, ...parsedData }));

        } catch (err) {
            console.error(err);
            setError('AI parsing failed. Please check API key or text format.');
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
        if (!window.confirm(`Change status of ${matchData.fixture.teamA} vs ${matchData.fixture.teamB} to ${newStatus.toUpperCase()}?`)) return;
        
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
                if (fixtureIndex === -1) throw new Error("Fixture not found in active list. It may have been moved to results.");

                const fixture = fixtures[fixtureIndex];
                const updatedFixture = { 
                    ...fixture, 
                    status: newStatus as any,
                    // Automatically set liveMinute based on status if needed
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
            loadMatches(); // Refresh the list
        } catch (err) {
            handleFirestoreError(err, 'update match status');
            setError('Failed to update status.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFormStatusChange = async (newStatus: string) => {
        const match = todaysMatches.find(m => String(m.fixture.id) === formData.fixture_id);
        if (match) {
            await handleStatusChange(match, newStatus);
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
        
        const minuteInt = parseInt(formData.minute, 10);
        const scoreHomeInt = parseInt(formData.score_home, 10);
        const scoreAwayInt = parseInt(formData.score_away, 10);

        const updateData = {
            ...formData,
            minute: isNaN(minuteInt) ? 0 : minuteInt,
            score_home: isNaN(scoreHomeInt) ? 0 : scoreHomeInt,
            score_away: isNaN(scoreAwayInt) ? 0 : scoreAwayInt,
        };

        try {
            // 1. Add the event to the live_updates feed
            await addLiveUpdate(updateData);

            // 2. Update the actual competition document (Score & Status)
            const docRef = doc(db, 'competitions', formData.competitionId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const competition = docSnap.data() as Competition;
                const fixtures = competition.fixtures || [];
                const results = competition.results || [];
                
                // Find the fixture to update
                const fixtureIndex = fixtures.findIndex(f => String(f.id) === formData.fixture_id);
                if (fixtureIndex === -1) throw new Error("Fixture not found in active fixtures list. It may have already been moved to results.");

                const fixture = fixtures[fixtureIndex];
                
                // Determine new status
                let newStatus = fixture.status;
                if (['full_time', 'match_abandoned', 'match_postponed', 'match_suspended'].includes(formData.type)) {
                     if (formData.type === 'full_time') newStatus = 'finished';
                     else if (formData.type === 'match_abandoned') newStatus = 'abandoned';
                     else if (formData.type === 'match_postponed') newStatus = 'postponed';
                     else if (formData.type === 'match_suspended') newStatus = 'suspended';
                } else {
                    // For goals, cards, etc., ensure it is marked as 'live'
                    newStatus = 'live';
                }

                // Update the fixture object
                const updatedFixture = {
                    ...fixture,
                    status: newStatus,
                    scoreA: updateData.score_home,
                    scoreB: updateData.score_away,
                    liveMinute: updateData.minute
                };

                const updatedFixtures = [...fixtures];

                // If the match is finished, move it to the results array and recalculate standings
                if (newStatus === 'finished') {
                    updatedFixtures.splice(fixtureIndex, 1); // Remove from fixtures
                    const updatedResults = [...results, updatedFixture];
                    
                    const updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);
                    
                    transaction.update(docRef, removeUndefinedProps({
                        fixtures: updatedFixtures,
                        results: updatedResults,
                        teams: updatedTeams
                    }));
                } else {
                    // Otherwise, just update it in place
                    updatedFixtures[fixtureIndex] = updatedFixture;
                    transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
                }
            });

            setSuccessMessage(`Update submitted! Match set to ${['full_time','match_abandoned'].includes(formData.type) ? 'Finished/Aban' : 'LIVE'}, scores updated.`);
            setFormData(prev => ({ ...prev, description: '', player: '', type: 'goal', minute: '' })); // Reset event fields only
            loadMatches(); // Refresh list to reflect new scores/status

            if (formData.type === 'full_time') {
                // Clear form if match finished
                setFormData(prev => ({ ...prev, fixture_id: '', home_team: '', away_team: '', score_home: '', score_away: '' }));
            }

        } catch (err) {
            console.error(err);
            setError('Failed to submit update: ' + (err as Error).message);
            handleFirestoreError(err, 'submit live update');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedMatch = todaysMatches.find(m => String(m.fixture.id) === formData.fixture_id);
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-6">Live Match Manager</h3>
                
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 animate-fade-in">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{successMessage}</span>
                    </div>
                )}
                {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}

                {/* Match List Dashboard */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-700">Active & Scheduled Matches</h4>
                        <Button onClick={() => loadMatches()} disabled={loadingMatches} className="text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 h-7 px-2">Refresh List</Button>
                    </div>
                    
                    {loadingMatches ? <div className="flex justify-center py-4"><Spinner /></div> : 
                     todaysMatches.length === 0 ? <p className="text-gray-500 text-sm text-center py-4 border rounded bg-gray-50">No active or scheduled matches found for today (±3 days).</p> :
                     todaysMatches.map(m => (
                        <div key={m.fixture.id} className={`border p-3 rounded-lg flex flex-col sm:flex-row items-center gap-4 transition-colors ${String(m.fixture.id) === formData.fixture_id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white hover:bg-gray-50'}`}>
                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-center sm:text-left items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{m.fixture.teamA} vs {m.fixture.teamB}</p>
                                    <p className="text-xs text-gray-500">{m.fixture.date} &bull; {m.fixture.time}</p>
                                </div>
                                <div className="text-center">
                                    <div className="inline-block px-3 py-1 bg-gray-100 rounded text-sm font-mono font-bold border">
                                        {m.fixture.scoreA || 0} - {m.fixture.scoreB || 0}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center sm:justify-end gap-2">
                                    <select 
                                        value={m.fixture.status} 
                                        onChange={(e) => handleStatusChange(m, e.target.value)}
                                        className="text-xs border-gray-300 rounded shadow-sm py-1 bg-white"
                                        disabled={isSubmitting}
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="live">Live</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="postponed">Postponed</option>
                                        <option value="finished">Finished</option>
                                        <option value="abandoned">Abandoned</option>
                                    </select>
                                </div>
                            </div>
                            <Button 
                                onClick={() => handleSelectMatch(m)} 
                                className={`text-xs h-8 px-3 whitespace-nowrap flex items-center gap-1 ${String(m.fixture.id) === formData.fixture_id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Edit3Icon className="w-3 h-3" /> {String(m.fixture.id) === formData.fixture_id ? 'Selected' : 'Log Events'}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* AI Parser Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2 text-sm"><SparklesIcon className="w-4 h-4"/> Quick Parse from Social Media</h4>
                    <textarea 
                        rows={2} 
                        value={pastedText} 
                        onChange={e => setPastedText(e.target.value)} 
                        placeholder="Paste tweet here (e.g., 'GOAL! 25 min. Highlanders score! 1-0 vs Swallows. Scorer: Moloto')"
                        className="block w-full text-sm p-2 border border-blue-200 rounded-md mb-2"
                    ></textarea>
                    <Button onClick={handleParse} disabled={isParsing} className="bg-blue-600 text-white text-xs h-8 px-4">
                        {isParsing ? <Spinner className="w-4 h-4 border-2" /> : 'Parse with AI'}
                    </Button>
                </div>

                {/* Manual Form */}
                <div id="update-form" className={`transition-opacity duration-300 ${!formData.fixture_id ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    
                    {selectedMatch && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div>
                                    <h5 className="font-bold text-yellow-900 flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4"/> Match Status: <span className="uppercase bg-yellow-200 px-2 py-0.5 rounded">{selectedMatch.fixture.status}</span>
                                    </h5>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        {selectedMatch.fixture.teamA} vs {selectedMatch.fixture.teamB}
                                    </p>
                                </div>
                                <div className="flex gap-2 items-center flex-wrap justify-end">
                                    {selectedMatch.fixture.status === 'scheduled' && (
                                        <Button onClick={() => handleFormStatusChange('live')} className="bg-green-600 text-white text-xs h-8" disabled={isSubmitting}>Start Match (Live)</Button>
                                    )}
                                    {selectedMatch.fixture.status === 'live' && (
                                        <>
                                            <Button onClick={() => handleFormStatusChange('suspended')} className="bg-orange-500 text-white text-xs h-8" disabled={isSubmitting}>Suspend</Button>
                                            <Button onClick={() => handleFormStatusChange('finished')} className="bg-gray-800 text-white text-xs h-8" disabled={isSubmitting}>Full Time</Button>
                                        </>
                                    )}
                                    
                                    <div className="border-l border-yellow-300 pl-2 ml-2">
                                        <span className="text-[10px] text-yellow-800 mr-1 font-bold">Force:</span>
                                        <select 
                                            value={selectedMatch.fixture.status} 
                                            onChange={(e) => handleFormStatusChange(e.target.value)}
                                            className="text-xs border-yellow-300 rounded shadow-sm py-1 bg-white w-28"
                                            disabled={isSubmitting}
                                        >
                                            <option value="scheduled">Scheduled</option>
                                            <option value="live">Live</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="postponed">Postponed</option>
                                            <option value="finished">Finished</option>
                                            <option value="abandoned">Abandoned</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">
                        {formData.fixture_id ? `Log Event Details` : 'Select a match above to log events'}
                    </h4>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Match ID</label>
                                <input type="text" name="fixture_id" value={formData.fixture_id} readOnly className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Competition</label>
                                <input type="text" name="competition" value={formData.competition} readOnly className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                    <option value="goal">Goal</option>
                                    <option value="yellow_card">Yellow Card</option>
                                    <option value="red_card">Red Card</option>
                                    <option value="substitution">Substitution</option>
                                    <option value="half_time">Half Time</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="match_postponed">Postponed</option>
                                    <option value="match_suspended">Suspended</option>
                                    <option value="match_abandoned">Abandoned</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Minute</label>
                                <input type="number" name="minute" value={formData.minute} onChange={handleChange} className={inputClass} placeholder="e.g. 45" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Home Score</label>
                                <input type="number" name="score_home" value={formData.score_home} onChange={handleChange} className={inputClass} min="0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Away Score</label>
                                <input type="number" name="score_away" value={formData.score_away} onChange={handleChange} className={inputClass} min="0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Player Name (Optional)</label>
                                <input type="text" name="player" value={formData.player} onChange={handleChange} className={inputClass} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input type="text" name="description" value={formData.description} onChange={handleChange} className={inputClass} required />
                            </div>
                        </div>

                        <div className="text-right">
                            <Button type="submit" disabled={isSubmitting || !formData.fixture_id} className="bg-green-600 text-white hover:bg-green-700 w-full md:w-auto h-11 px-8">
                                {isSubmitting ? <Spinner className="w-5 h-5 border-2"/> : 'Submit Event Log'}
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
};

export default LiveUpdatesEntry;
