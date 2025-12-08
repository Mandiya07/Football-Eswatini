
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchAllCompetitions } from '../../services/api';
import { calculateStandings, normalize } from '../../services/utils';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import CopyIcon from '../icons/CopyIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';

interface SocialMatch {
    id: string;
    type: 'fixture' | 'result';
    teamA: string;
    teamB: string;
    teamACrest?: string;
    teamBCrest?: string;
    scoreA?: number;
    scoreB?: number;
    date: string;
    time?: string;
    competition: string;
    competitionLogoUrl?: string;
    venue?: string;
    matchday?: number;
}

const SocialMediaGenerator: React.FC = () => {
    const [division, setDivision] = useState('MTN Premier League');
    const [contextData, setContextData] = useState('');
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(false);
    
    const [contentType, setContentType] = useState<'captions' | 'recap' | 'summary'>('captions');
    const [platform, setPlatform] = useState('twitter');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string | string[]>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [savedAsNews, setSavedAsNews] = useState(false);

    // Helper to format dates
    const formatMatchDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch { return dateStr; }
    };

    const normalizeName = (name: string) => normalize(name);

    const fetchRecentData = async () => {
        setIsFetchingData(true);
        try {
            const allComps = await fetchAllCompetitions();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            let relevantText = `CONTEXT REPORT for ${division}\nGenerated: ${new Date().toLocaleString()}\n================================\n`;
            let foundData = false;
            const extractedMatches: SocialMatch[] = [];

            Object.values(allComps).forEach((comp: any) => {
                let isRelevant = false;
                const nameLower = comp.name.toLowerCase();
                const catLower = (comp.categoryId || '').toLowerCase();
                
                if (division === 'MTN Premier League' && (nameLower.includes('premier') || nameLower.includes('mtn'))) isRelevant = true;
                else if (division === 'National First Division League' && (nameLower.includes('first division') || nameLower.includes('nfd'))) isRelevant = true;
                else if (division === 'Regional' && (nameLower.includes('regional') || nameLower.includes('super league'))) isRelevant = true;
                else if (division === 'Cups' && (nameLower.includes('cup') || nameLower.includes('tournament'))) isRelevant = true;
                else if (division === 'National Team' && (catLower === 'national-teams' || nameLower.includes('sihlangu'))) isRelevant = true;
                else if (division === 'International' && (nameLower.includes('caf') || nameLower.includes('cosafa'))) isRelevant = true;

                if (isRelevant) {
                    foundData = true;
                    relevantText += `\nCOMPETITION: ${comp.name}\n`;

                    // 1. CALCULATE AND ADD STANDINGS WITH MARKDOWN TABLE
                    if (comp.teams && comp.teams.length > 0) {
                        // Ensure we are using valid arrays
                        const results = Array.isArray(comp.results) ? comp.results : [];
                        const fixtures = Array.isArray(comp.fixtures) ? comp.fixtures : [];
                        
                        const standings = calculateStandings(comp.teams, results, fixtures);
                        
                        relevantText += `\n### LEAGUE TABLE: ${comp.name}\n`;
                        relevantText += `| Pos | Team | P | W | D | L | GF | GA | GD | Pts | Form |\n`;
                        relevantText += `|---|---|---|---|---|---|---|---|---|---|---|\n`;
                        
                        standings.forEach((team, index) => {
                            relevantText += `| ${index + 1} | ${team.name} | ${team.stats.p} | ${team.stats.w} | ${team.stats.d} | ${team.stats.l} | ${team.stats.gs} | ${team.stats.gc} | ${team.stats.gd} | ${team.stats.pts} | ${team.stats.form} |\n`;
                        });
                        relevantText += `\n`;
                    }

                    // 2. ADD RECENT & UPCOMING MATCHES
                    const recentResults = (comp.results || []).filter((r: any) => new Date(r.fullDate || '') >= sevenDaysAgo);
                    const upcomingFixtures = (comp.fixtures || []).filter((f: any) => new Date(f.fullDate || '') >= new Date() && new Date(f.fullDate || '') <= new Date(new Date().setDate(new Date().getDate() + 7)));

                    // Build robust map for crests
                    const teamCrestMap = new Map<string, string>();
                    (comp.teams || []).forEach((t: any) => {
                        if (t.crestUrl) {
                            teamCrestMap.set(t.name, t.crestUrl);
                            teamCrestMap.set(t.name.toLowerCase(), t.crestUrl);
                            teamCrestMap.set(t.name.trim(), t.crestUrl);
                            teamCrestMap.set(normalizeName(t.name), t.crestUrl);
                        }
                    });

                    const getCrest = (name: string) => {
                        if (!name) return undefined;
                        return teamCrestMap.get(name) || 
                               teamCrestMap.get(name.trim()) || 
                               teamCrestMap.get(name.toLowerCase()) || 
                               teamCrestMap.get(normalizeName(name));
                    };

                    if (recentResults.length > 0 || upcomingFixtures.length > 0) {
                        relevantText += `\n### ACTIVITY LOG (Last 7 Days & Next 7 Days)\n`;
                        
                        if (recentResults.length > 0) {
                            relevantText += `**Recent Results:**\n`;
                            recentResults.forEach((r: any) => {
                                relevantText += `- ${r.teamA} ${r.scoreA}-${r.scoreB} ${r.teamB} (${r.fullDate})\n`;
                                extractedMatches.push({
                                    id: `res-${r.id}`,
                                    type: 'result',
                                    teamA: r.teamA,
                                    teamB: r.teamB,
                                    teamACrest: getCrest(r.teamA),
                                    teamBCrest: getCrest(r.teamB),
                                    scoreA: r.scoreA,
                                    scoreB: r.scoreB,
                                    date: formatMatchDate(r.fullDate || ''),
                                    competition: comp.name,
                                    competitionLogoUrl: comp.logoUrl,
                                    venue: r.venue,
                                    matchday: r.matchday
                                });
                            });
                        }
                        
                        if (upcomingFixtures.length > 0) {
                            relevantText += `\n**Upcoming Fixtures:**\n`;
                            upcomingFixtures.forEach((f: any) => {
                                relevantText += `- ${f.teamA} vs ${f.teamB} (${f.fullDate} @ ${f.time})\n`;
                                extractedMatches.push({
                                    id: `fix-${f.id}`,
                                    type: 'fixture',
                                    teamA: f.teamA,
                                    teamB: f.teamB,
                                    teamACrest: getCrest(f.teamA),
                                    teamBCrest: getCrest(f.teamB),
                                    date: formatMatchDate(f.fullDate || ''),
                                    time: f.time,
                                    competition: comp.name,
                                    competitionLogoUrl: comp.logoUrl,
                                    venue: f.venue,
                                    matchday: f.matchday
                                });
                            });
                        }
                    }
                }
            });

            if (!foundData) {
                relevantText += "No specific match data found in the database for this period.";
            }

            setContextData(relevantText);
            setRawMatches(extractedMatches);
            if (extractedMatches.length > 0) {
                setSelectedMatchIds([extractedMatches[0].id]);
            } else {
                setSelectedMatchIds([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to auto-fetch data. Please ensure the database is accessible.");
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerate = async () => {
        if (!contextData.trim()) {
            alert("Please enter some context or fetch recent data first.");
            return;
        }
        if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY === '') {
            alert('System Error: API_KEY is not configured. Please add the API_KEY environment variable in your Vercel project settings and redeploy.');
            return;
        }

        setIsGenerating(true);
        setGeneratedContent('');
        setSavedAsNews(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let prompt = "";

            if (contentType === 'captions') {
                if (platform === 'twitter') {
                    prompt = `You are a social media manager for Football Eswatini. Create 5 distinct, engaging Twitter posts (under 280 characters each) based on the provided data.
                    Section: ${division}.
                    Context Data:
                    ${contextData}
                    
                    Instructions:
                    - **CRITICAL:** Use the provided LEAGUE TABLE to accurately describe team standings. Do not hallucinate title contenders if the points difference is large.
                    - Mention specific scores from the 'Recent Results' section.
                    - Style: Short, exciting, use emojis, and use 2-3 relevant hashtags like #FootballEswatini #${division.replace(/\s/g, '')}.
                    Output format: Just the 5 captions separated by a "|||" delimiter. Do not number them.`;
                } else if (platform === 'facebook') {
                    prompt = `You are a social media manager for Football Eswatini. Create 3 distinct, engaging Facebook posts based on the provided data.
                    Section: ${division}.
                    Context Data:
                    ${contextData}
                    
                    Instructions:
                    - **CRITICAL:** Reference the LEAGUE TABLE positions to add context (e.g., "Top of the table clash", "Relegation battle"). Ensure accuracy of points/positions.
                    - Style: Slightly more descriptive than Twitter. Ask a question to encourage comments and engagement. Use emojis and 1-2 relevant hashtags.
                    Output format: Just the 3 captions separated by a "|||" delimiter. Do not number them.`;
                } else { // instagram
                     prompt = `You are a social media manager for Football Eswatini. Create 3 distinct, visually-focused Instagram captions based on the provided data.
                    Section: ${division}.
                    Context Data:
                    ${contextData}
                    
                    Instructions:
                    - **CRITICAL:** Use the provided LEAGUE TABLE to ensure any claims about "Title Races" or "Leaders" are mathematically accurate based on the Points column.
                    - Style: Storytelling and descriptive, as if accompanying a photo or video. End each caption with a block of 5-7 relevant hashtags.
                    Output format: Just the 3 captions separated by a "|||" delimiter. Do not number them.`;
                }
            } else if (contentType === 'recap') {
                const selectedMatch = rawMatches.find(m => selectedMatchIds.includes(m.id));
                
                if (!selectedMatch && !contextData.trim()) {
                    alert("For a Match Recap, please select a match from the list or enter details manually in the text box.");
                    setIsGenerating(false);
                    return;
                }

                // If a match is selected, we emphasize it, but we keep the full contextData (with standings) so the AI knows the stakes
                const specificMatchInfo = selectedMatch 
                    ? `FOCUS MATCH: ${selectedMatch.teamA} vs ${selectedMatch.teamB}, Score: ${selectedMatch.scoreA}-${selectedMatch.scoreB}, Date: ${selectedMatch.date}, Venue: ${selectedMatch.venue}`
                    : "Focus on the key results in the context provided.";

                prompt = `You are a sports journalist for Football Eswatini. Write a detailed match recap (200-400 words).
                
                ${specificMatchInfo}
                
                Full League Context (Standings & Other Results):
                ${contextData}
                
                Instructions:
                - **CRITICAL:** Analyze the LEAGUE TABLE provided. Explain the implication of this result on the table (e.g., did the winner move up? did the loser drop into the relegation zone?).
                - If specific match details (scorers/events) are missing in the data, use generic but professional sports writing to describe the result's impact, focusing heavily on the league implications.
                - Style: Engaging, professional sports journalism. Title the recap appropriately.
                Output format: A single markdown-formatted article body.`;
            } else { // summary
                prompt = `You are a sports journalist for Football Eswatini. Write a comprehensive "Weekly Wrap-Up" summary article for the ${division}.
                
                Data Provided:
                ${contextData}
                
                Instructions:
                - **CRITICAL:** Accurately reflect current league positions using the provided LEAGUE TABLE. Do NOT invent positions or points.
                - Highlight big wins, upsets, and movement in the table based on the Points and Goal Difference columns.
                - Mention upcoming key fixtures.
                - Style: Professional, engaging, journalistic. Length: 150-250 words.
                Output format: A single markdown-formatted article body.`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            const text = response.text || '';
            if (contentType === 'captions') {
                setGeneratedContent(text.split('|||').map(s => s.trim()).filter(s => s.length > 0));
            } else {
                setGeneratedContent(text);
            }

        } catch (error: any) {
            console.error("AI Error:", error);
            // Detailed error reporting for debugging
            alert(`Failed to generate content. Error: ${error.message || error}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-2xl font-bold font-display">Social Media & Content Generator</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Panel: Configuration */}
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Division / Focus</label>
                            <select 
                                value={division} 
                                onChange={(e) => setDivision(e.target.value)} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option>MTN Premier League</option>
                                <option>National First Division League</option>
                                <option>Cups</option>
                                <option>National Team</option>
                                <option>Regional</option>
                                <option>International</option>
                            </select>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase">Context Data</label>
                                <Button onClick={fetchRecentData} disabled={isFetchingData} className="bg-blue-100 text-blue-700 hover:bg-blue-200 h-6 text-[10px] px-2 flex items-center gap-1">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2 border-blue-700"/> : <><RefreshIcon className="w-3 h-3" /> Fetch Recent Data</>}
                                </Button>
                             </div>
                             <textarea 
                                value={contextData} 
                                onChange={(e) => setContextData(e.target.value)} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-mono h-40"
                                placeholder="Fetched data (Standings, Results) will appear here. You can also paste your own stats..."
                            />
                        </div>
                        
                        {rawMatches.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Select Focus Match (Optional)</label>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                    {rawMatches.map(match => (
                                        <div 
                                            key={match.id} 
                                            onClick={() => setSelectedMatchIds(prev => prev.includes(match.id) ? [] : [match.id])} // Single select for simplicity
                                            className={`p-2 rounded text-xs cursor-pointer border ${selectedMatchIds.includes(match.id) ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-bold">{match.teamA} vs {match.teamB}</span>
                                                <span>{match.date}</span>
                                            </div>
                                            {(match.scoreA !== undefined) && <div>Result: {match.scoreA} - {match.scoreB}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                                <select 
                                    value={contentType} 
                                    onChange={(e) => setContentType(e.target.value as any)} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="captions">Social Media Captions</option>
                                    <option value="recap">Match Recap Article</option>
                                    <option value="summary">Weekly Summary</option>
                                </select>
                            </div>
                            {contentType === 'captions' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                                    <select 
                                        value={platform} 
                                        onChange={(e) => setPlatform(e.target.value)} 
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    >
                                        <option value="twitter">Twitter / X</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="instagram">Instagram</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <Button 
                            onClick={handleGenerate} 
                            disabled={isGenerating || !contextData} 
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11 flex justify-center items-center gap-2 text-base font-bold shadow-md"
                        >
                            {isGenerating ? <Spinner className="w-5 h-5 border-2"/> : <><SparklesIcon className="w-5 h-5" /> Generate Content</>}
                        </Button>
                    </div>

                    {/* Right Panel: Output */}
                    <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 min-h-[400px]">
                        <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            Generated Output
                            {generatedContent && Array.isArray(generatedContent) ? ` (${generatedContent.length} variants)` : ''}
                        </h4>
                        
                        {!generatedContent && !isGenerating && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                                <SparklesIcon className="w-12 h-12 mb-2 opacity-50" />
                                <p>Select options and click Generate to create content.</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="h-full flex items-center justify-center">
                                <Spinner className="w-10 h-10 border-4 border-purple-500" />
                            </div>
                        )}

                        {generatedContent && (
                            <div className="space-y-4">
                                {Array.isArray(generatedContent) ? (
                                    generatedContent.map((text, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group relative">
                                            <p className="text-gray-800 text-sm whitespace-pre-wrap">{text}</p>
                                            <button 
                                                onClick={() => copyToClipboard(text)}
                                                className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Copy"
                                            >
                                                <CopyIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group relative">
                                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{generatedContent}</p>
                                        <button 
                                            onClick={() => copyToClipboard(generatedContent)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Copy"
                                        >
                                            <CopyIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default SocialMediaGenerator;
