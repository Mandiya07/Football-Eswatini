
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { addLiveUpdate, handleFirestoreError } from '../../services/api';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { GoogleGenAI, Type } from '@google/genai';
import SparklesIcon from '../icons/SparklesIcon';

const LiveUpdatesEntry: React.FC = () => {
    const [formData, setFormData] = useState({
        fixture_id: '',
        competition: 'MTN Premier League',
        home_team: '',
        away_team: '',
        minute: '',
        type: 'goal' as const,
        player: '',
        assist: '',
        description: '',
        score_home: '',
        score_away: '',
    });
    const [pastedText, setPastedText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

     const handleParse = async () => {
        if (!pastedText.trim()) return setError('Please paste some text to analyze.');
        
        setIsParsing(true);
        setError('');
        
        const prompt = `Analyze the following football match update. Extract the event details and populate the form fields. The 'type' must be one of: 'goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time', 'match_postponed', 'match_abandoned', 'match_suspended'. If you cannot determine a field, leave it as an empty string. Provide a concise 'description' summarizing the event.
        
        Text: "${pastedText}"`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                home_team: { type: Type.STRING },
                away_team: { type: Type.STRING },
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
            setError('AI parsing failed. Please check the format of your text or try again. ' + (err as Error).message);
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
        setIsSubmitting(true);
        setSuccessMessage('');
        setError('');
        
        const dataToSubmit = {
            ...formData,
            minute: parseInt(formData.minute, 10),
            score_home: parseInt(formData.score_home, 10),
            score_away: parseInt(formData.score_away, 10),
        };

        try {
            await addLiveUpdate(dataToSubmit);
            setSuccessMessage(`Update for ${formData.home_team} vs ${formData.away_team} submitted successfully!`);
            // Reset only event-specific fields
            setFormData(prev => ({...prev, player: '', assist: '', description: '', type: 'goal' }));
            setPastedText('');
            setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
            // Error is handled by the API layer, which shows an alert
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-700";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-1">Live Updates Entry Form</h3>
                <p className="text-sm text-gray-600 mb-6">Submit a real-time event for a live match. Use the AI to parse text from social media automatically.</p>
                
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 animate-fade-in">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{successMessage}</span>
                    </div>
                )}
                 {error && <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-md">{error}</div>}

                <div className="space-y-4 mb-6">
                    <label htmlFor="paste-area" className={`${labelClass} font-semibold`}>Paste Social Media Post</label>
                    <textarea id="paste-area" rows={3} value={pastedText} onChange={e => setPastedText(e.target.value)} className={inputClass} placeholder="e.g., GOAL!!! What a strike from Sabelo Ndzinisa! Swallows 1-0 Highlanders in the 78th minute."/>
                    <Button onClick={handleParse} disabled={isParsing} className="bg-purple-600 text-white hover:bg-purple-700 h-10 px-6 flex justify-center items-center gap-2">
                        <SparklesIcon className="w-5 h-5" /> {isParsing ? <Spinner className="w-5 h-5 border-2"/> : 'Analyze with AI'}
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t">
                    <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
                        <h4 className="font-bold text-gray-800">Match Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="home_team" className={labelClass}>Home Team</label><input id="home_team" name="home_team" value={formData.home_team} onChange={handleChange} required className={inputClass} /></div>
                            <div><label htmlFor="away_team" className={labelClass}>Away Team</label><input id="away_team" name="away_team" value={formData.away_team} onChange={handleChange} required className={inputClass} /></div>
                            <div><label htmlFor="score_home" className={labelClass}>Home Score</label><input id="score_home" name="score_home" type="number" value={formData.score_home} onChange={handleChange} required className={inputClass} /></div>
                            <div><label htmlFor="score_away" className={labelClass}>Away Score</label><input id="score_away" name="score_away" type="number" value={formData.score_away} onChange={handleChange} required className={inputClass} /></div>
                            <div><label htmlFor="fixture_id" className={labelClass}>Fixture ID</label><input id="fixture_id" name="fixture_id" value={formData.fixture_id} onChange={handleChange} required className={inputClass} placeholder="Unique ID for this match" /></div>
                            <div><label htmlFor="competition" className={labelClass}>Competition</label><input id="competition" name="competition" value={formData.competition} onChange={handleChange} required className={inputClass} /></div>
                        </div>
                    </div>
                     <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
                        <h4 className="font-bold text-gray-800">Event Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div><label htmlFor="minute" className={labelClass}>Minute</label><input id="minute" name="minute" type="number" value={formData.minute} onChange={handleChange} required className={inputClass} /></div>
                            <div><label htmlFor="type" className={labelClass}>Event Type</label>
                                <select id="type" name="type" value={formData.type} onChange={handleChange} required className={inputClass}>
                                    <option value="goal">Goal</option>
                                    <option value="yellow_card">Yellow Card</option>
                                    <option value="red_card">Red Card</option>
                                    <option value="substitution">Substitution</option>
                                    <option value="half_time">Half Time</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="match_postponed">Match Postponed</option>
                                    <option value="match_abandoned">Match Abandoned</option>
                                    <option value="match_suspended">Match Suspended</option>
                                </select>
                            </div>
                            <div><label htmlFor="player" className={labelClass}>Player Involved</label><input id="player" name="player" value={formData.player} onChange={handleChange} className={inputClass} /></div>
                        </div>
                         <div><label htmlFor="description" className={labelClass}>Description</label><textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={2} className={inputClass}></textarea></div>
                    </div>
                    <div className="text-right">
                        <Button type="submit" className="bg-primary text-white hover:bg-primary-dark w-full sm:w-auto h-11 px-8 flex justify-center items-center" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : 'Submit Update'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default LiveUpdatesEntry;
