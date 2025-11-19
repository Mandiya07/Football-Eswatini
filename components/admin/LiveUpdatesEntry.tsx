
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { addLiveUpdate, fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { GoogleGenAI, Type } from '@google/genai';
import SparklesIcon from '../icons/SparklesIcon';
import { CompetitionFixture, Competition } from '../../data/teams';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, calculateStandings } from '../../services/utils';

const LiveUpdatesEntry: React.FC = () => {
    const [formData, setFormData] = useState({
        fixture_id: '',
        competition: '',
        competitionId: '', // Hidden field to store the doc ID
        home_team: '',
        away_team: '',
        minute: '',
        type: 'goal' as const,
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

    useEffect(() => {
        const loadMatches = async () => {
            setLoadingMatches(true);
            try {
                const allComps = await fetchAllCompetitions();
                const matches: { fixture: CompetitionFixture, compName: string, compId: string }[] = [];
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];

                Object.entries(allComps).forEach(([compId, comp]) => {
                    if (comp.fixtures) {
                        comp.fixtures.forEach(f => {
                            // Filter for matches that are scheduled for today, or are already live/suspended
                            // We also include matches from "yesterday" just in case of timezone overlaps or late games
                            const matchDate = new Date(f.fullDate + 'T' + (f.time || '00:00'));
                            const diffHours = (today.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                            
                            // Show matches from today, or matches that started within last 24 hours (if not finished)
                            if (f.fullDate === todayStr || f.status === 'live' || f.status === 'suspended' || (diffHours < 24 && diffHours > -24)) {
                                matches.push({ fixture: f, compName: comp.name, compId: compId });
                            }
                        });
                    }
                });
                setTodaysMatches(matches);
            } catch (err) {
                console.error("Error loading matches", err);
            } finally {
                setLoadingMatches(false);
            }
        };
        loadMatches();
    }, []);

    const handleMatchSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fixtureId = e.target.value;
        if (!fixtureId) return;

        const selected = todaysMatches.find(m => String(m.fixture.id) === fixtureId);
        if (selected) {
            setFormData(prev => ({
                ...prev,
                fixture_id: String(selected.fixture.id),
                competition: selected.compName,
                competitionId: selected.compId,
                home_team: selected.fixture.teamA,
                away_team: selected.fixture.teamB,
                score_home: String(selected.fixture.scoreA || 0),
                score_away: String(selected.fixture.scoreB || 0),
            }));
        }
    };

     const handleParse = async () => {
        if (!pastedText.trim()) return setError('Please paste some text to analyze.');
        
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fixture_id || !formData.competitionId) {
            setError("Please select a match from the dropdown first.");
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
            
            // Refresh match list if it was finished, as it will be moved out of fixtures
            if (formData.type === 'full_time') {
                setTodaysMatches(prev => prev.filter(m => String(m.fixture.id) !== formData.fixture_id));
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

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-4">Live Updates Entry</h3>
                
                {/* AI Parser Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Quick Parse from Social Media</h4>
                    <textarea 
                        rows={3} 
                        value={pastedText} 
                        onChange={e => setPastedText(e.target.value)} 
                        placeholder="Paste tweet here (e.g., 'GOAL! 25 min. Highlanders score! 1-0 vs Swallows. Scorer: Moloto')"
                        className="block w-full text-sm p-2 border border-blue-200 rounded-md mb-2"
                    ></textarea>
                    <Button onClick={handleParse} disabled={isParsing} className="bg-blue-600 text-white text-xs h-8 px-4">
                        {isParsing ? <Spinner className="w-4 h-4 border-2" /> : 'Parse with AI'}
                    </Button>
                </div>

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{successMessage}</span>
                    </div>
                )}
                {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Match Selection - Replaces Manual ID Entry */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Live/Today's Match</label>
                        {loadingMatches ? <div className="text-sm text-gray-500">Loading active matches...</div> : (
                            <select 
                                className={inputClass} 
                                onChange={handleMatchSelect}
                                value={formData.fixture_id}
                            >
                                <option value="" disabled>-- Select Match --</option>
                                {todaysMatches.length === 0 && <option disabled>No matches found for today.</option>}
                                {todaysMatches.map(m => (
                                    <option key={m.fixture.id} value={m.fixture.id}>
                                        {m.fixture.teamA} vs {m.fixture.teamB} ({m.compName}) - {m.fixture.status === 'live' ? 'LIVE' : m.fixture.time}
                                    </option>
                                ))}
                            </select>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Selecting a match will auto-fill IDs and current scores.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Competition</label>
                            <input type="text" name="competition" value={formData.competition} readOnly className={`${inputClass} bg-gray-100`} />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Fixture ID</label>
                            <input type="text" name="fixture_id" value={formData.fixture_id} readOnly className={`${inputClass} bg-gray-100`} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Home Team</label>
                            <input type="text" name="home_team" value={formData.home_team} readOnly className={`${inputClass} bg-gray-100`} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Away Team</label>
                            <input type="text" name="away_team" value={formData.away_team} readOnly className={`${inputClass} bg-gray-100`} />
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
                        <Button type="submit" disabled={isSubmitting} className="bg-green-600 text-white hover:bg-green-700 w-full md:w-auto h-11 px-8">
                            {isSubmitting ? <Spinner className="w-5 h-5 border-2"/> : 'Submit Update'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default LiveUpdatesEntry;
