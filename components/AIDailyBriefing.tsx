
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from './ui/Card';
import { fetchNews, listenToAllCompetitions } from '../services/api';
import { calculateStandings } from '../services/utils';
import SparklesIcon from './icons/SparklesIcon';
import Spinner from './ui/Spinner';
import RefreshIcon from './icons/RefreshIcon';

const AIDailyBriefing: React.FC = () => {
    const [briefing, setBriefing] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    const generateBriefing = async () => {
        if (!process.env.API_KEY) return;
        
        setIsLoading(true);
        setError(false);
        try {
            // Wait for one data emission from competitions listener
            const [news, comps] = await Promise.all([
                fetchNews(),
                new Promise<any>((resolve) => {
                    const unsub = listenToAllCompetitions((data) => {
                        unsub();
                        resolve(data);
                    });
                })
            ]);

            const premierLeague = comps['mtn-premier-league'];
            const standings = premierLeague ? calculateStandings(premierLeague.teams || [], premierLeague.results || [], premierLeague.fixtures || []) : [];
            
            const newsContext = news.slice(0, 5).map(n => n.title).join(', ');
            const topTeams = standings.slice(0, 3).map(t => `${t.name} (${t.stats.pts}pts)`).join(', ');
            const upcoming = premierLeague?.fixtures?.slice(0, 3).map(f => `${f.teamA} vs ${f.teamB}`).join(', ');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `You are the Football Eswatini Digital Voice. Summarize the state of football in Eswatini today.
            CONTEXT:
            - Recent News Headlines: ${newsContext}
            - Current Top 3 (MTN PL): ${topTeams}
            - Highlight Upcoming Matches: ${upcoming}
            
            GOAL: Write a high-energy, concise daily summary (max 60 words). Focus on key matches and momentum. Be professional and supportive of the Kingdom's football.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setBriefing(response.text || 'The pitch is ready, but the briefing failed to synthesize. Check the logs for the latest.');
        } catch (err) {
            console.error("AI Briefing failed:", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        generateBriefing();
    }, []);

    return (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-900 via-[#002B7F] to-blue-900 text-white shadow-2xl rounded-3xl group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/30 transition-all duration-700"></div>
            
            <CardContent className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                                <SparklesIcon className="w-5 h-5 text-accent" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Official Daily Intel</span>
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl font-display font-black mb-4 leading-tight">
                            Eswatini <span className="text-accent">AI Briefing</span>
                        </h2>

                        {isLoading ? (
                            <div className="flex items-center gap-3 py-2">
                                <Spinner className="w-5 h-5 border-white border-t-accent" />
                                <p className="text-sm font-medium text-blue-200 animate-pulse uppercase tracking-widest">Synthesizing match reports...</p>
                            </div>
                        ) : error ? (
                            <div className="py-2">
                                <p className="text-sm text-red-300 font-medium">Link with Football AI interrupted.</p>
                                <button onClick={generateBriefing} className="mt-2 text-xs font-bold text-accent flex items-center gap-1 hover:underline">
                                    <RefreshIcon className="w-3 h-3 text-accent" /> Try Syncing Again
                                </button>
                            </div>
                        ) : (
                            <p className="text-lg text-blue-50 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-700">
                                "{briefing}"
                            </p>
                        )}
                    </div>

                    <div className="flex-shrink-0 w-full md:w-auto">
                        <button 
                            onClick={generateBriefing}
                            disabled={isLoading}
                            className="w-full md:w-auto bg-primary border border-white/20 text-white font-black py-4 px-8 rounded-2xl transition-all hover:bg-primary-dark hover:scale-105 active:scale-95 disabled:opacity-50 text-[10px] tracking-widest uppercase shadow-xl"
                        >
                            {isLoading ? 'Processing...' : 'Sync Latest'}
                        </button>
                    </div>
                </div>
            </CardContent>
            
            <div className="absolute bottom-0 right-0 p-4 opacity-5">
                <SparklesIcon className="w-32 h-32 text-white" />
            </div>
        </Card>
    );
};

export default AIDailyBriefing;
