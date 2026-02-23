import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import PhotoIcon from '../icons/PhotoIcon';
import FilmIcon from '../icons/FilmIcon';
import { fetchAllCompetitions, fetchDirectoryEntries, fetchCups, fetchAllTeams } from '../../services/api';
import { superNormalize, findInMap, calculateStandings } from '../../services/utils';
import RecapGeneratorModal from './RecapGeneratorModal';
import { DirectoryEntity } from '../../data/directory';
import { MatchEvent, Team } from '../../data/teams';
import CalendarIcon from '../icons/CalendarIcon';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import CheckCircleIcon from '../icons/CheckCircleIcon';

type ContentType = 'captions' | 'image' | 'weekly';
type PlatformType = 'Twitter/X' | 'Facebook' | 'Instagram';

interface SocialMatch {
    id: string;
    type: 'result' | 'fixture';
    teamA: string;
    teamB: string;
    teamACrest?: string;
    teamBCrest?: string;
    scoreA?: string | number;
    scoreB?: string | number;
    date: string;
    fullDate?: string;
    time?: string;
    venue?: string;
    matchday?: number;
    competition: string;
    competitionLogoUrl?: string;
    events?: MatchEvent[];
}

interface LeagueOption {
    id: string;
    name: string;
    logoUrl?: string;
    isCup: boolean;
}

const SocialMediaGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentType>('captions');
    const [platform, setPlatform] = useState<PlatformType>('Instagram');
    const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    
    const [allLeagues, setAllLeagues] = useState<LeagueOption[]>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const loadLeagues = async () => {
            const [comps, cups] = await Promise.all([
                fetchAllCompetitions(),
                fetchCups()
            ]);
            
            const leagueList = Object.entries(comps)
                .map(([id, c]) => ({ id, name: c.name, logoUrl: c.logoUrl, isCup: false }));
            
            const cupList = cups.map(c => ({ 
                id: c.id, 
                name: c.name, 
                logoUrl: (c as any).logoUrl, 
                isCup: true 
            }));

            const list = [...leagueList, ...cupList].sort((a, b) => a.name.localeCompare(b.name));
            setAllLeagues(list);
            if (list.length > 0) setSelectedLeagueId(list[0].id);
        };
        loadLeagues();
    }, []);

    const fetchRecentData = async () => {
        if (!selectedLeagueId) return;
        setIsFetchingData(true);
        setRawMatches([]);
        setSelectedMatchIds([]);
        try {
            const [allComps, dirEntries, allCups, allGlobalTeams] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries(),
                fetchCups(),
                fetchAllTeams()
            ]);

            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const selectedOption = allLeagues.find(l => l.id === selectedLeagueId);
            const extractedMatches: SocialMatch[] = [];

            const getCrest = (name: string) => {
                if (!name || name === 'TBD') return undefined;
                const dirEntry = findInMap(name, dirMap);
                if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                return undefined;
            };

            const parseVal = (val: any): string | number | undefined => {
                if (val === undefined || val === null || val === '') return undefined;
                // If it contains parentheses, it's a penalty score, keep as string
                if (typeof val === 'string' && val.includes('(')) return val;
                const n = Number(val);
                return isNaN(n) ? val : n;
            };

            if (selectedOption?.isCup) {
                // Handling Cup Matches from Tournament Bracket
                const cup = allCups.find(c => c.id === selectedLeagueId);
                if (cup) {
                    cup.rounds.forEach(round => {
                        const roundTitle = round.title;
                        round.matches.forEach(m => {
                            const mAny = m as any;
                            
                            // ROBUST TEAM NAME DETECTION
                            // Matches from the builder use flat properties (team1Name) whereas hybrid uses nested objects
                            let t1Name = mAny.team1Name || m.team1?.name || mAny.teamA || 'TBD';
                            let t2Name = mAny.team2Name || m.team2?.name || mAny.teamB || 'TBD';

                            // SECONDARY ID LOOKUP (If name is TBD but ID exists)
                            const t1Id = mAny.team1Id || m.team1?.id;
                            const t2Id = mAny.team2Id || m.team2?.id;

                            if (t1Name === 'TBD' && t1Id) {
                                const lookup = allGlobalTeams.find(t => String(t.id) === String(t1Id));
                                if (lookup) t1Name = lookup.name;
                            }
                            if (t2Name === 'TBD' && t2Id) {
                                const lookup = allGlobalTeams.find(t => String(t.id) === String(t2Id));
                                if (lookup) t2Name = lookup.name;
                            }

                            // ROBUST SCORE DETECTION (Prevents NaN)
                            const s1 = parseVal(mAny.score1 ?? m.team1?.score ?? mAny.scoreA);
                            const s2 = parseVal(mAny.score2 ?? m.team2?.score ?? mAny.scoreB);

                            // Determine if result or fixture
                            const isFinished = m.winner !== null || (s1 !== undefined && s2 !== undefined);

                            extractedMatches.push({
                                id: `${selectedLeagueId}-${m.id}`,
                                type: isFinished ? 'result' : 'fixture',
                                teamA: t1Name,
                                teamB: t2Name,
                                teamACrest: mAny.team1Crest || m.team1?.crestUrl || getCrest(t1Name),
                                teamBCrest: mAny.team2Crest || m.team2?.crestUrl || getCrest(t2Name),
                                scoreA: s1,
                                scoreB: s2,
                                date: m.date || '',
                                time: m.time,
                                venue: m.venue,
                                competition: `${cup.name} (${roundTitle})`, 
                                competitionLogoUrl: (cup as any).logoUrl
                            });
                        });
                    });
                }
            } else {
                // Handling Standard League Matches
                const comp = allComps[selectedLeagueId];
                if (comp) {
                    const results = (comp.results || []).map(m => ({ ...m, type: 'result' as const }));
                    const fixtures = (comp.fixtures || []).map(m => ({ ...m, type: 'fixture' as const }));
                    
                    const combined = [...results, ...fixtures];
                    combined.forEach(m => {
                        extractedMatches.push({
                            id: `${selectedLeagueId}-${m.id}`,
                            type: m.type,
                            teamA: m.teamA,
                            teamB: m.teamB,
                            teamACrest: getCrest(m.teamA),
                            teamBCrest: getCrest(m.teamB),
                            scoreA: m.scoreA,
                            scoreB: m.scoreB,
                            date: m.fullDate || m.date || '',
                            time: m.time,
                            venue: m.venue,
                            matchday: m.matchday,
                            competition: comp.displayName || comp.name,
                            competitionLogoUrl: comp.logoUrl,
                            events: m.events
                        });
                    });
                }
            }

            const sorted = extractedMatches.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'fixture' ? -1 : 1;
                const timeA = new Date(a.date).getTime();
                const timeB = new Date(b.date).getTime();
                if (a.type === 'fixture') return timeA - timeB;
                return timeB - timeA;
            });

            setRawMatches(sorted);
            if (sorted.length > 0) setSelectedMatchIds(sorted.slice(0, 8).map(m => m.id));
        } catch (error) {
            console.error("Fetch Data Error:", error);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerateContent = async (isWeeklySummary = false) => {
        if (selectedMatchIds.length === 0) return alert("Select matches first.");
        if (!process.env.API_KEY) return alert('API Key missing.');

        setIsGenerating(true);
        setPublishSuccess(false);
        try {
            const allComps = await fetchAllCompetitions();
            const currentComp = allComps[selectedLeagueId];
            
            let standingsContext = "N/A (Cup format)";
            if (currentComp) {
                const standings = calculateStandings(currentComp.teams || [], currentComp.results || [], currentComp.fixtures || []);
                standingsContext = standings.slice(0, 10).map((t, i) => 
                    `${i+1}. ${t.name} (P:${t.stats.p}, GD:${t.stats.gd}, PTS:${t.stats.pts}, Form: ${t.stats.form})`
                ).join('; ');
            }

            const matchesToSummarize = rawMatches.filter(m => selectedMatchIds.includes(m.id));
            const dataToProcess = matchesToSummarize.map(m => {
                let matchStr = `${m.teamA} ${m.type === 'result' ? (m.scoreA ?? '?') + '-' + (m.scoreB ?? '?') : 'vs'} ${m.teamB} (Date: ${m.date})`;
                if (m.events && m.events.length > 0) {
                    const eventsDetail = m.events.map(e => `${e.minute}' ${e.type}${e.playerName ? ' by ' + e.playerName : ''}: ${e.description}`).join('; ');
                    matchStr += ` [STATISTICS: ${eventsDetail}]`;
                }
                return matchStr;
            }).join(' | ');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let prompt = "";
            const commonContext = `Competition: ${matchesToSummarize[0]?.competition}. 
            CONTEXT STANDINGS: ${standingsContext}. 
            MATCH DATA: "${dataToProcess}".`;

            if (isWeeklySummary) {
                prompt = `You are a Lead Sports Journalist for Football Eswatini. Create a professional weekly review article based on the following data.
                CONTEXT: ${commonContext}.
                
                REQUIREMENTS & CONSTRAINTS:
                1. DATA-DRIVEN ANALYSIS: You MUST include specific match statistics. Explicitly mention goal scorers, red cards, and yellow cards for each match where this information is provided in the [STATISTICS] section of the context.
                2. NO HALLUCINATIONS: Do NOT invent tactical patterns unless those specific descriptions are explicitly mentioned in the match logs provided.
                3. STANDINGS IMPACT: Specifically mention which teams moved up or down the table if league context is provided.
                
                Format as a JSON object with keys: "title", "summary", "content". The content should be at least 600 words with H2 headers.`;
            } else {
                prompt = `You are the Social Media Lead for Football Eswatini. Create 3 viral captions for ${platform}.
                CONTEXT: ${commonContext}.
                
                REQUIREMENTS:
                - Caption 1: Focus on a specific 'Big Result' or 'Major Fixure'.
                - Caption 2: Focus on 'Climb to Glory' or the current status of the competition.
                - Caption 3: Hype for the 'Upcoming Matches' mentioned in data.
                
                Use emojis, #FootballEswatini. Separate each caption with '---'.`;
            }
            
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt,
                config: { 
                    responseMimeType: isWeeklySummary ? "application/json" : "text/plain",
                    systemInstruction: `You are a professional social media manager and football journalist for Football Eswatini. 
                    Your goal is to generate engaging, accurate, and high-energy content for sports fans.
                    
                    CRITICAL: 
                    - Always recognize penalty scores in the format "1(4)". This means 1 goal in regular time and 4 in penalties.
                    - If a match was decided on penalties, mention the drama and the shootout result.
                    - Use Eswatini-specific slang or references where appropriate (e.g., "Sihlangu", "Kingdom of Eswatini").
                    - Use emojis effectively for social media.
                    - Keep it professional yet passionate.`
                }
            });

            if (isWeeklySummary) {
                const articleData = JSON.parse(response.text || "{}");
                setGeneratedCaptions([JSON.stringify(articleData)]); 
            } else {
                setGeneratedCaptions(response.text?.split('---').map(s => s.trim()).filter(Boolean) || [response.text || '']);
            }
        } catch (error) {
            console.error(error);
            alert("AI generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePublishArticle = async () => {
        if (generatedCaptions.length === 0 || activeTab !== 'weekly') return;
        setIsPublishing(true);
        try {
            const article = JSON.parse(generatedCaptions[0]);
            const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            await addDoc(collection(db, 'news'), {
                title: article.title,
                summary: article.summary,
                content: article.content,
                image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1600&q=80",
                category: ['Football News', 'National'],
                date: new Date().toISOString(),
                createdAt: serverTimestamp(),
                url: `/news/${slug}-${Date.now()}`
            });
            
            setPublishSuccess(true);
            setGeneratedCaptions([]);
        } catch (error) {
            console.error("Publish failed", error);
            alert("Failed to save article to News Management.");
        } finally {
            setIsPublishing(false);
        }
    };

    const toggleMatchSelection = (id: string) => {
        setSelectedMatchIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id].slice(0, 8));
    };

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            if (!url) return resolve(null);
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            if (url.startsWith('data:')) {
                img.src = url;
            } else {
                img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            }
        });
    };

    const generateGraphic = async () => {
        const matchesToDraw = rawMatches.filter(m => selectedMatchIds.includes(m.id));
        if (matchesToDraw.length === 0) return alert("Select matches first.");
        
        setIsGeneratingImage(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 1080;
        const H = 1920; 
        canvas.width = W;
        canvas.height = H;

        const urlsToLoad = new Set<string>();
        matchesToDraw.forEach(m => {
            if (m.teamACrest) urlsToLoad.add(m.teamACrest);
            if (m.teamBCrest) urlsToLoad.add(m.teamBCrest);
            if (m.competitionLogoUrl) urlsToLoad.add(m.competitionLogoUrl);
        });

        const newCache = new Map<string, HTMLImageElement>(imageCache);
        await Promise.all(Array.from(urlsToLoad).map(async url => {
            if (!newCache.has(url)) {
                const img = await loadImage(url);
                if (img) newCache.set(url, img);
            }
        }));
        setImageCache(newCache);

        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#001E5A');
        bgGrad.addColorStop(0.5, '#002B7F');
        bgGrad.addColorStop(1, '#00143C');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < W; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
        for (let i = 0; i < H; i += 60) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

        const topComp = matchesToDraw[0];
        
        if (topComp.competitionLogoUrl && newCache.has(topComp.competitionLogoUrl)) {
            const logo = newCache.get(topComp.competitionLogoUrl)!;
            const logoW = 200;
            const logoH = (logo.height / logo.width) * logoW;
            ctx.drawImage(logo, (W - logoW) / 2, 60, logoW, logoH);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDB913';
        ctx.font = 'bold 36px "Poppins", sans-serif';
        ctx.fillText(topComp.competition.toUpperCase(), W / 2, 320);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 80px "Poppins", sans-serif';
        const headerText = matchesToDraw.every(m => m.type === 'result') ? "Match Results" : (topComp.matchday ? `Matchday ${topComp.matchday}` : "Football Eswatini");
        ctx.fillText(headerText, W / 2, 410);

        const startY = 500;
        const rowH = 155;
        const rowGap = 10;
        const textMaxW = 260; 

        matchesToDraw.forEach((m, i) => {
            const y = startY + (i * (rowH + rowGap));
            
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(50, y, W - 100, rowH, 20);
            ctx.fill();

            if (m.teamACrest && newCache.has(m.teamACrest)) {
                ctx.drawImage(newCache.get(m.teamACrest)!, 80, y + 25, 100, 100);
            }
            if (m.teamBCrest && newCache.has(m.teamBCrest)) {
                ctx.drawImage(newCache.get(m.teamBCrest)!, W - 180, y + 25, 100, 100);
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 22px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(m.teamA, 200, y + 80, textMaxW);
            ctx.textAlign = 'right';
            ctx.fillText(m.teamB, W - 200, y + 80, textMaxW);
            ctx.textAlign = 'center';
            ctx.font = '900 62px "Poppins", sans-serif';
            const centerInfo = m.type === 'result' ? `${m.scoreA ?? 0}-${m.scoreB ?? 0}` : m.time || '15:00';
            ctx.fillText(centerInfo, W/2, y + 85);
            ctx.font = '600 16px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            const subLine = m.venue ? `${m.date} • ${m.venue}` : m.date;
            ctx.fillText(subLine, W/2, y + 125, W - 450);
        });

        const footerH = 100;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, H - footerH, W, footerH);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 42px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("FOOTBALL ESWATINI", W / 2, H - 35);

        setIsGeneratingImage(false);
    };

    const downloadGraphic = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `FE-SOCIAL-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const fixtureList = rawMatches.filter(m => m.type === 'fixture');
    const resultList = rawMatches.filter(m => m.type === 'result');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex bg-white/50 p-1.5 rounded-2xl w-fit border border-gray-200 shadow-sm flex-wrap gap-2">
                <button onClick={() => { setActiveTab('captions'); setGeneratedCaptions([]); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'captions' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>AI Captions</button>
                <button onClick={() => { setActiveTab('weekly'); setGeneratedCaptions([]); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'weekly' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>Weekly Article</button>
                <button onClick={() => { setActiveTab('image'); setGeneratedCaptions([]); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'image' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>Graphic Studio</button>
                <button onClick={() => setIsRecapModalOpen(true)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50 flex items-center gap-2">
                    <FilmIcon className="w-4 h-4" /> AI Recap Video
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card className="shadow-xl border-0 bg-white">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-3 rounded-2xl">
                                {activeTab === 'weekly' ? <CalendarIcon className="w-6 h-6 text-indigo-600" /> : <SparklesIcon className="w-6 h-6 text-indigo-600" />}
                            </div>
                            <h3 className="text-2xl font-bold font-display text-gray-800">
                                {activeTab === 'weekly' ? 'Weekly Article Generator' : 'Media Studio'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Select Competition / Cup</label>
                                <select 
                                    value={selectedLeagueId} 
                                    onChange={(e) => setSelectedLeagueId(e.target.value)} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name} {l.isCup ? '(Cup)' : ''}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={fetchRecentData} disabled={isFetchingData} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 border rounded-xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 h-10 shadow-md">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                    Sync Data
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">Select Match Data (Max 8)</p>
                            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 border rounded-2xl p-4 bg-gray-50 custom-scrollbar">
                                {fixtureList.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest border-b pb-1">Fixtures</h4>
                                        {fixtureList.map(m => (
                                            <div key={m.id} onClick={() => toggleMatchSelection(m.id)} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
                                                <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-bold text-xs truncate">{m.teamA} vs {m.teamB}</p>
                                                    <p className="text-[10px] text-gray-500">{m.date} &bull; {m.competition}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {resultList.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase text-green-600 tracking-widest border-b pb-1">Results</h4>
                                        {resultList.map(m => (
                                            <div key={m.id} onClick={() => toggleMatchSelection(m.id)} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-green-50 border-green-400 ring-1 ring-green-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
                                                <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-green-600" />
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-bold text-xs truncate">{m.teamA} {m.scoreA ?? '?'}-{m.scoreB ?? '?'} {m.teamB}</p>
                                                    <p className="text-[10px] text-gray-500">{m.date} &bull; {m.competition}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {rawMatches.length === 0 && !isFetchingData && <p className="text-center py-12 text-gray-400 text-xs italic">Sync data to load match records.</p>}
                            </div>
                        </div>

                        {activeTab === 'image' ? (
                            <Button onClick={generateGraphic} disabled={isGeneratingImage || selectedMatchIds.length === 0} className="w-full bg-primary text-white h-12 rounded-2xl shadow-xl font-bold flex justify-center items-center gap-2">
                                {isGeneratingImage ? <Spinner className="w-5 h-5 border-2" /> : <><PhotoIcon className="w-5 h-5" /> Render Social Graphic</>}
                            </Button>
                        ) : (
                             <div className="space-y-4 pt-4 border-t">
                                {activeTab === 'captions' && (
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target Platform</label>
                                        <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformType)} className="block w-full px-3 py-2 border rounded-xl text-sm">
                                            <option>Instagram</option><option>Facebook</option><option>Twitter/X</option>
                                        </select>
                                    </div>
                                )}
                                <Button onClick={() => handleGenerateContent(activeTab === 'weekly')} disabled={isGenerating || selectedMatchIds.length === 0} className="w-full bg-indigo-600 text-white h-12 rounded-2xl shadow-xl font-bold flex justify-center items-center gap-2">
                                    {isGenerating ? <Spinner className="w-4 h-4 border-2" /> : <><SparklesIcon className="w-5 h-5" /> {activeTab === 'weekly' ? 'Draft Weekly Article' : 'Generate Captions'}</>}
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                <div className="sticky top-24">
                    <h3 className="text-lg font-bold font-display text-gray-800 mb-4 flex justify-between items-center">
                        Live Preview
                        {selectedMatchIds.length > 0 && activeTab === 'image' && (
                            <button onClick={downloadGraphic} className="text-blue-600 text-xs font-bold hover:underline">Download PNG</button>
                        )}
                    </h3>
                    {activeTab === 'image' ? (
                        <div className="relative border-4 border-white shadow-2xl rounded-[2rem] overflow-hidden aspect-[9/16] bg-gray-900 max-h-[800px] mx-auto">
                            <canvas ref={canvasRef} className="w-full h-full object-contain" />
                        </div>
                    ) : activeTab === 'weekly' ? (
                        <div className="space-y-4">
                            {generatedCaptions.map((jsonStr, i) => {
                                try {
                                    const article = JSON.parse(jsonStr);
                                    return (
                                        <Card key={i} className="bg-white border-0 shadow-lg animate-fade-in overflow-hidden">
                                            <div className="bg-indigo-600 p-4 text-white">
                                                <h4 className="text-lg font-bold font-display">{article.title}</h4>
                                                <p className="text-xs text-indigo-100 italic mt-1">{article.summary}</p>
                                            </div>
                                            <CardContent className="p-6">
                                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                                                    {article.content}
                                                </div>
                                                
                                                {publishSuccess ? (
                                                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2 text-green-700 font-bold">
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                        Sent to News Management!
                                                    </div>
                                                ) : (
                                                    <div className="mt-6 flex gap-3">
                                                        <Button 
                                                            onClick={handlePublishArticle} 
                                                            disabled={isPublishing} 
                                                            className="flex-grow bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-bold h-12"
                                                        >
                                                            {isPublishing ? <Spinner className="w-4 h-4 border-white" /> : "Send to News Section"}
                                                        </Button>
                                                        <button onClick={() => { navigator.clipboard.writeText(`${article.title}\n\n${article.content}`); alert("Copied!"); }} className="p-3 bg-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
                                                            <CopyIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                } catch(e) {
                                    return <p key={i} className="text-red-500">Error parsing generated article.</p>;
                                }
                            })}
                            {generatedCaptions.length === 0 && <p className="text-center py-20 text-gray-400 italic">Generate a weekly summary to preview it here.</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {generatedCaptions.map((cap, i) => (
                                <Card key={i} className="bg-white border-0 shadow-md animate-fade-in">
                                    <CardContent className="p-4 flex justify-between gap-4">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{cap}</p>
                                        <button onClick={() => { navigator.clipboard.writeText(cap); alert("Copied!"); }} className="p-2 h-fit text-gray-400 hover:text-primary"><CopyIcon className="w-4 h-4"/></button>
                                    </CardContent>
                                </Card>
                            ))}
                            {generatedCaptions.length === 0 && <p className="text-center py-20 text-gray-400 italic">Generated content will appear here.</p>}
                        </div>
                    )}
                </div>
            </div>

            {isRecapModalOpen && (
                <RecapGeneratorModal isOpen={isRecapModalOpen} onClose={() => setIsRecapModalOpen(false)} />
            )}
        </div>
    );
};

export default SocialMediaGenerator;