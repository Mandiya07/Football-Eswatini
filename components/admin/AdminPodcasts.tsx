
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { fetchNews, listenToAllCompetitions, listenToCups, addPodcast, listenToPodcasts, deletePodcast } from '../../services/api';
import { calculateStandings, compressImage, pcmToWav } from '../../services/utils';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';
import MicIcon from '../icons/MicIcon';
import RadioIcon from '../icons/RadioIcon';
import PlayIcon from '../icons/PlayIcon';
import TrashIcon from '../icons/TrashIcon';
import RefreshIcon from '../icons/RefreshIcon';
import ImageIcon from '../icons/ImageIcon';
import CheckIcon from '../icons/CheckIcon';

const AdminPodcasts: React.FC = () => {
    const { user } = useAuth();
    const [isPublishing, setIsPublishing] = useState(false);
    const [podcasts, setPodcasts] = useState<any[]>([]);
    
    // Form State
    const [title, setTitle] = useState('');
    const [topics, setTopics] = useState<string[]>([]);
    const [newTopic, setNewTopic] = useState('');
    const [transcript, setTranscript] = useState('');
    const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
    const [coverArt, setCoverArt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = listenToPodcasts(setPodcasts);
        return () => unsub();
    }, []);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0], 400, 0.7);
                setCoverArt(base64);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

    const generateScript = async () => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            setError("Gemini API Key is not configured in the environment.");
            return;
        }

        setIsGeneratingScript(true);
        setError(null);

        try {
            // 1. Fetch Data for Context
            const [news, comps, cups] = await Promise.all([
                fetchNews(),
                new Promise<any>((resolve) => {
                    const unsub = listenToAllCompetitions((data) => {
                        unsub();
                        resolve(data);
                    });
                }),
                new Promise<any>((resolve) => {
                    const unsub = listenToCups((data) => {
                        unsub();
                        resolve(data);
                    });
                })
            ]);

            const premierLeague = comps['mtn-premier-league'];
            const standings = premierLeague ? calculateStandings(premierLeague.teams || [], premierLeague.results || [], premierLeague.fixtures || []) : [];
            
            const newsContext = news.slice(0, 5).map(n => n.title).join('. ');
            const topTeams = standings.slice(0, 3).map(t => `${t.name} with ${t.stats.pts} points`).join(', ');
            const recentResults = premierLeague?.results?.slice(0, 3).map(r => `${r.teamA} ${r.scoreA} - ${r.scoreB} ${r.teamB}`).join(', ');
            const upcomingMatches = premierLeague?.fixtures?.slice(0, 3).map(f => `${f.teamA} vs ${f.teamB}`).join(', ');
            const tournamentInfo = cups.slice(0, 3).map(c => c.name).join(', ');

            const ai = new GoogleGenAI({ apiKey });
            
            // 2. Generate Script First
            const scriptPrompt = `Generate a podcast script between Sipho (a male host) and Thandi (a female analyst) about Eswatini football.
            
            CONTEXT:
            - News: ${newsContext}
            - Standings: ${topTeams}
            - Recent Results: ${recentResults}
            - Upcoming: ${upcomingMatches}
            - Tournaments: ${tournamentInfo}
            - User Topics: ${topics.join(', ')}
            
            STYLE & TONE:
            - Warm, energetic Southern African podcast style.
            - Include common, simple SiSwati greetings or exclamations (e.g., "Sawubona", "Yebo", "Eish", "Ngiyabonga", "Sho").
            - IMPORTANT: To ensure the AI voice pronounces them correctly, stick to very simple SiSwati words, or spell them phonetically so an English TTS engine won't butcher them.
            
            FORMAT:
            Sipho: [Text]
            Thandi: [Text]
            
            Keep it under 200 words. Make it engaging.`;

            const generateScriptWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
                try {
                    return await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: scriptPrompt,
                    });
                } catch (error: any) {
                    if (retries > 0 && (error.message?.includes('503') || error.status === 503 || error.message?.includes('UNAVAILABLE'))) {
                        console.warn(`Script generation failed with 503. Retrying... (${retries} left)`);
                        await new Promise(res => setTimeout(res, delay));
                        return generateScriptWithRetry(retries - 1, delay * 2);
                    }
                    throw error;
                }
            };

            const scriptResponse = await generateScriptWithRetry();

            const generatedScript = scriptResponse.text || "";
            setTranscript(generatedScript);

        } catch (err) {
            console.error("Script generation failed:", err);
            setError(`Script generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const generateAudio = async () => {
        if (!transcript) {
            setError("Please provide a transcript first.");
            return;
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            setError("Gemini API Key is not configured in the environment.");
            return;
        }

        setIsGeneratingAudio(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey });

            // 3. Generate Audio from Script
            const ttsPrompt = `TTS the following conversation between Sipho (male) and Thandi (female). Please speak with a warm, energetic Southern African cadence and accent:
            
            ${transcript}`;

            const generateWithRetry = async (retries = 3, delay = 2000): Promise<any> => {
                try {
                    return await ai.models.generateContent({
                        model: "gemini-2.5-flash-preview-tts",
                        contents: [{ parts: [{ text: ttsPrompt }] }],
                        config: {
                            responseModalities: ["AUDIO" as any],
                            speechConfig: {
                                multiSpeakerVoiceConfig: {
                                    speakerVoiceConfigs: [
                                        { speaker: 'Sipho', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }, // Male voice
                                        { speaker: 'Thandi', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } // Female voice
                                    ]
                                }
                            }
                        }
                    });
                } catch (error: any) {
                    if (retries > 0 && (error.message?.includes('503') || error.status === 503 || error.message?.includes('UNAVAILABLE'))) {
                        console.warn(`Podcast generation failed with 503. Retrying... (${retries} left)`);
                        await new Promise(res => setTimeout(res, delay));
                        return generateWithRetry(retries - 1, delay * 2);
                    }
                    throw error;
                }
            };

            const ttsResponse = await generateWithRetry();

            const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (audioPart?.data) {
                const mimeType = audioPart.mimeType || '';
                let finalBase64 = audioPart.data;
                let finalMime = mimeType || 'audio/wav';

                // Gemini TTS often returns raw PCM data. We need to wrap it in a WAV header for the browser to play it.
                if (mimeType.includes('pcm') || mimeType === '') {
                    try {
                        finalBase64 = pcmToWav(audioPart.data, 24000);
                        finalMime = 'audio/wav';
                    } catch (e) {
                        console.error("PCM to WAV conversion failed", e);
                    }
                }
                
                setAudioDataUri(`data:${finalMime};base64,${finalBase64}`);
            } else {
                throw new Error("Failed to generate audio data.");
            }

        } catch (err) {
            console.error("Podcast generation failed:", err);
            setError(`Podcast generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handlePublish = async () => {
        if (!title || !audioDataUri || !transcript) {
            alert("Title, audio, and transcript are required.");
            return;
        }

        setIsPublishing(true);
        try {
            await addPodcast({
                title,
                topics,
                transcript,
                audioUrl: audioDataUri,
                coverArtUrl: coverArt,
                author: user?.name || 'Admin'
            });
            
            // Reset Form
            setTitle('');
            setTopics([]);
            setTranscript('');
            setAudioDataUri(null);
            setCoverArt(null);
            alert("Podcast published successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to publish podcast.");
        } finally {
            setIsPublishing(false);
        }
    };

    const addTopic = () => {
        if (newTopic.trim()) {
            setTopics([...topics, newTopic.trim()]);
            setNewTopic('');
        }
    };

    const removeTopic = (index: number) => {
        setTopics(topics.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black font-display uppercase tracking-tight">Podcast Manager</h2>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Super Admin Access
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Creator Section */}
                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <MicIcon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-sm">Create New Episode</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Episode Title</label>
                                <input 
                                    type="text" 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. MTN Premier League Week 12 Review"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Topics to Discuss</label>
                                <div className="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        value={newTopic} 
                                        onChange={e => setNewTopic(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && addTopic()}
                                        placeholder="Add a topic..."
                                        className="flex-1 p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                                    />
                                    <Button onClick={addTopic} className="bg-gray-900 text-white px-4 text-xs font-bold">Add</Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {topics.map((t, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold flex items-center gap-1">
                                            {t}
                                            <button onClick={() => removeTopic(i)} className="hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Cover Art</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                                        {coverArt ? <img src={coverArt} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                                    </div>
                                    <label className="cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50">
                                        Upload Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </div>

                            <Button 
                                onClick={generateScript} 
                                disabled={isGeneratingScript}
                                className="w-full bg-primary text-white h-12 font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
                            >
                                {isGeneratingScript ? <><Spinner className="w-4 h-4 border-white" /> Generating Script...</> : <><RadioIcon className="w-4 h-4" /> Generate Script with AI</>}
                            </Button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">Podcast Transcript / Script</label>
                                <textarea 
                                    value={transcript}
                                    onChange={e => setTranscript(e.target.value)}
                                    placeholder="Write your podcast script here, or use AI to generate one..."
                                    className="w-full h-40 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium leading-relaxed"
                                />
                            </div>

                            <Button 
                                onClick={generateAudio} 
                                disabled={isGeneratingAudio || !transcript}
                                className="w-full bg-indigo-600 text-white h-12 font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
                            >
                                {isGeneratingAudio ? <><Spinner className="w-4 h-4 border-white" /> Generating Audio...</> : <><MicIcon className="w-4 h-4" /> Generate Audio from Script</>}
                            </Button>

                            {audioDataUri && (
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2 block">Audio Preview</label>
                                    <audio src={audioDataUri} controls className="w-full h-10" />
                                </div>
                            )}

                            {audioDataUri && (
                                <Button 
                                    onClick={handlePublish} 
                                    disabled={isPublishing}
                                    className="w-full bg-green-600 text-white h-12 font-black uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isPublishing ? <Spinner className="w-4 h-4 border-white" /> : <><CheckIcon className="w-4 h-4" /> Publish Episode</>}
                                </Button>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}
                    </CardContent>
                </Card>

                {/* Published List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <RadioIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <h3 className="font-black uppercase tracking-widest text-sm">Published Episodes</h3>
                    </div>

                    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {podcasts.length === 0 ? (
                            <div className="p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm italic">No episodes published yet.</p>
                            </div>
                        ) : (
                            podcasts.map(p => (
                                <Card key={p.id} className="border-0 shadow-md hover:shadow-lg transition-shadow rounded-2xl overflow-hidden">
                                    <CardContent className="p-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                            {p.coverArtUrl ? <img src={p.coverArtUrl} className="w-full h-full object-cover" /> : <RadioIcon className="w-full h-full p-4 text-gray-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{p.title}</h4>
                                            <div className="flex gap-2 mt-1">
                                                {p.topics?.slice(0, 2).map((t: string, i: number) => (
                                                    <span key={i} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">#{t}</span>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-1">Published by {p.author}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.confirm("Delete this episode?") && deletePodcast(p.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPodcasts;
