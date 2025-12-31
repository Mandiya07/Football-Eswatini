import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import SaveIcon from '../icons/SaveIcon';
import PhotoIcon from '../icons/PhotoIcon';
import DownloadIcon from '../icons/DownloadIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { fetchAllCompetitions, fetchDirectoryEntries } from '../../services/api';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { calculateStandings } from '../../services/utils';

type DivisionType = 'International' | 'MTN Premier League' | 'National First Division League' | 'Regional' | 'Cups' | 'National Team' | 'Womens Football';
type ContentType = 'captions' | 'summary' | 'image' | 'recap';
type PlatformType = 'twitter' | 'facebook' | 'instagram';

interface SocialMatch {
    id: string;
    type: 'result' | 'fixture';
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
    const [division, setDivision] = useState<DivisionType>('MTN Premier League');
    const [contentType, setContentType] = useState<ContentType>('captions');
    const [platform, setPlatform] = useState<PlatformType>('twitter');
    const [contextData, setContextData] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [savedAsNews, setSavedAsNews] = useState(false);
    
    // Image Gen State
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const normalizeName = (name: string) => (name || '').trim().toLowerCase().replace(/\s+fc$/i, '').replace(/\s+football club$/i, '').trim();

    const formatMatchDate = (dateStr: string) => {
        try {
            if (!dateStr) return 'TBD';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch { return dateStr || 'TBD'; }
    };

    const fetchRecentData = async () => {
        setIsFetchingData(true);
        try {
            const [allComps, dirEntries] = await Promise.all([
                fetchAllCompetitions().catch(e => { console.error("Comps fetch failed", e); return {}; }),
                fetchDirectoryEntries().catch(e => { console.error("Directory fetch failed", e); return []; })
            ]);

            if (Object.keys(allComps).length === 0) {
                alert("Database warning: No competition data found. Verify your Firestore connection.");
            }

            const dirCrestMap = new Map<string, string>();
            dirEntries.forEach(e => {
                if (e.crestUrl && e.name) {
                    dirCrestMap.set(e.name.toLowerCase().trim(), e.crestUrl);
                    dirCrestMap.set(normalizeName(e.name), e.crestUrl);
                }
            });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            let relevantText = `Recent results and fixtures for ${division} (Last 7 days):\n`;
            let foundData = false;
            const extractedMatches: SocialMatch[] = [];

            Object.values(allComps).forEach(comp => {
                if (!comp || !comp.name) return;
                
                let isRelevant = false;
                const nameLower = comp.name.toLowerCase();
                const catLower = (comp.categoryId || '').toLowerCase();
                
                if (division === 'MTN Premier League' && (nameLower.includes('mtn premier') || (nameLower.includes('premier') && !nameLower.includes('english')))) isRelevant = true;
                else if (division === 'National First Division League' && (nameLower.includes('first division') || nameLower.includes('nfd'))) isRelevant = true;
                else if (division === 'Regional' && (nameLower.includes('regional') || nameLower.includes('super league'))) isRelevant = true;
                else if (division === 'Cups' && (nameLower.includes('cup') || nameLower.includes('tournament'))) isRelevant = true;
                else if (division === 'National Team' && (catLower === 'national-teams' || nameLower.includes('sihlangu'))) isRelevant = true;
                else if (division === 'International' && (nameLower.includes('caf') || nameLower.includes('cosafa'))) isRelevant = true;
                else if (division === 'Womens Football' && (nameLower.includes('women') || nameLower.includes('ladies'))) isRelevant = true;

                if (isRelevant) {
                    if (comp.teams && comp.teams.length > 0) {
                        const standings = calculateStandings(comp.teams, comp.results || [], comp.fixtures || []);
                        if (standings.length > 0) {
                            relevantText += `\n--- STANDINGS CONTEXT (${comp.name}) ---\n`;
                            standings.slice(0, 4).forEach((t, i) => {
                                relevantText += `${i + 1}. ${t.name} (${t.stats.pts}pts)\n`;
                            });
                            relevantText += `-------------------------------------------\n\n`;
                        }
                    }

                    const recentResults = (comp.results || []).filter(r => r.fullDate && new Date(r.fullDate) >= sevenDaysAgo);
                    const upcomingFixtures = (comp.fixtures || []).filter(f => f.fullDate && new Date(f.fullDate) >= new Date() && new Date(f.fullDate) <= new Date(new Date().setDate(new Date().getDate() + 7)));

                    const getCrest = (name: string) => {
                        if (!name) return undefined;
                        const norm = normalizeName(name);
                        const lower = name.toLowerCase().trim();
                        return dirCrestMap.get(lower) || dirCrestMap.get(norm) || (comp.teams?.find(t => t.name === name)?.crestUrl);
                    };

                    if (recentResults.length > 0 || upcomingFixtures.length > 0) {
                        foundData = true;
                        relevantText += `\nCompetition: ${comp.name}\n`;
                        
                        recentResults.forEach(r => {
                            relevantText += `- RESULT: ${r.teamA} ${r.scoreA}-${r.scoreB} ${r.teamB} (${r.fullDate})\n`;
                            extractedMatches.push({
                                id: `res-${r.id}`, type: 'result', teamA: r.teamA, teamB: r.teamB,
                                teamACrest: getCrest(r.teamA), teamBCrest: getCrest(r.teamB),
                                scoreA: r.scoreA, scoreB: r.scoreB, date: formatMatchDate(r.fullDate || ''),
                                competition: comp.name, competitionLogoUrl: comp.logoUrl, venue: r.venue, matchday: r.matchday
                            });
                        });
                        
                        upcomingFixtures.forEach(f => {
                            relevantText += `- FIXTURE: ${f.teamA} vs ${f.teamB} (${f.fullDate} @ ${f.time})\n`;
                            extractedMatches.push({
                                id: `fix-${f.id}`, type: 'fixture', teamA: f.teamA, teamB: f.teamB,
                                teamACrest: getCrest(f.teamA), teamBCrest: getCrest(f.teamB),
                                date: formatMatchDate(f.fullDate || ''), time: f.time,
                                competition: comp.name, competitionLogoUrl: comp.logoUrl, venue: f.venue, matchday: f.matchday
                            });
                        });
                    }
                }
            });

            if (!foundData) relevantText += "No specific match data found for this period.";
            setContextData(relevantText);
            setRawMatches(extractedMatches);
            if (extractedMatches.length > 0) setSelectedMatchIds([extractedMatches[0].id]);
        } catch (error) {
            console.error("Auto-fetch error", error);
            alert("Error connecting to data services. Check your connection.");
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerate = async () => {
        if (!contextData.trim()) return alert("Enter context first.");
        if (!process.env.API_KEY) return alert('API Key missing.');

        setIsGenerating(true);
        setGeneratedContent([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Write 5 social media captions for ${platform} based on: ${contextData}. Use delimiters ||| between each.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            const text = response.text || "";
            setGeneratedContent(text.split('|||').map(c => c.trim()).filter(c => c.length > 0));
        } catch (error) {
            console.error("AI Gen error", error);
            alert("Generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied!");
    };

    const saveAsNews = async () => {
        if (generatedContent.length === 0) return;
        try {
            await addDoc(collection(db, "news"), {
                title: `${division} Update`,
                date: new Date().toISOString(),
                content: generatedContent[0],
                summary: generatedContent[0].substring(0, 100),
                image: 'https://via.placeholder.com/800x400?text=Update',
                category: ['Social Media', division],
                url: `/news/update-${Date.now()}`
            });
            setSavedAsNews(true);
            alert("Posted to News Feed!");
        } catch (e) { console.error(e); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <Card className="shadow-lg h-fit border-0">
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-purple-100 p-3 rounded-2xl"><SparklesIcon className="w-6 h-6 text-purple-600" /></div>
                        <h3 className="text-2xl font-bold font-display text-gray-800">Social Studio</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Division</label>
                            <select value={division} onChange={(e) => setDivision(e.target.value as DivisionType)} className="block w-full px-3 py-2 border rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-purple-500">
                                <option value="MTN Premier League">MTN Premier League</option>
                                <option value="National First Division League">NFD</option>
                                <option value="Regional">Regional</option>
                                <option value="National Team">National Team</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Platform</label>
                            <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformType)} className="block w-full px-3 py-2 border rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-purple-500">
                                <option value="twitter">Twitter / X</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-black uppercase text-gray-400">Context Source</label>
                            <button onClick={fetchRecentData} disabled={isFetchingData} className="text-xs flex items-center gap-1 text-purple-600 font-bold hover:underline">
                                {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                Sync Latest Results
                            </button>
                        </div>
                        <textarea rows={6} value={contextData} onChange={(e) => setContextData(e.target.value)} placeholder="Fetch data or type context manually..." className="block w-full p-4 border rounded-2xl text-sm font-mono bg-gray-50 shadow-inner" />
                    </div>

                    <Button onClick={handleGenerate} disabled={isGenerating || !contextData} className="w-full bg-purple-600 text-white h-12 rounded-2xl shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2">
                        {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Captions</>}
                    </Button>
                </CardContent>
            </Card>

            <Card className="shadow-lg bg-gray-50 border-2 border-dashed border-gray-200 min-h-[400px] rounded-2xl">
                <CardContent className="p-6 h-full flex flex-col">
                    <h3 className="text-sm font-black uppercase text-gray-400 mb-4 tracking-widest">AI Output</h3>
                    {isGenerating ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <Spinner className="w-10 h-10 border-4 border-purple-500" />
                            <p className="mt-4 font-bold">Writing your posts...</p>
                        </div>
                    ) : generatedContent.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 opacity-30">
                            <SparklesIcon className="w-16 h-16 mb-4" />
                            <p className="text-sm font-bold">Generated content will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {generatedContent.map((caption, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-start animate-fade-in group">
                                    <div className="flex-grow text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{caption}</div>
                                    <button onClick={() => copyToClipboard(caption)} className="text-gray-300 hover:text-purple-600 p-1 rounded-lg hover:bg-purple-50 transition-colors"><CopyIcon className="w-5 h-5" /></button>
                                </div>
                            ))}
                            <div className="mt-6 pt-6 border-t flex justify-end">
                                <Button onClick={saveAsNews} disabled={savedAsNews} className={`h-11 px-6 rounded-xl font-bold flex items-center gap-2 transition-all ${savedAsNews ? 'bg-green-100 text-green-700 cursor-default' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`}>
                                    {savedAsNews ? <><CheckCircleIcon className="w-5 h-5" /> Published</> : <><SaveIcon className="w-5 h-5" /> Post to News Feed</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SocialMediaGenerator;