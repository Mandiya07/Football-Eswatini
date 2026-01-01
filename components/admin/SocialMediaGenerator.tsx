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
type ContentType = 'captions' | 'image' | 'summary';
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
    const [platform, setPlatform] = useState<PlatformType>('instagram');
    const [contextData, setContextData] = useState('');
    const [generatedContent, setGeneratedContent] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [savedAsNews, setSavedAsNews] = useState(false);
    
    // Image Gen State
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Robust Normalization for Crest Matching
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

            const dirCrestMap = new Map<string, string>();
            dirEntries.forEach(e => {
                if (e.crestUrl && e.name) {
                    // Store multiple keys for robust matching
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
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerateCaptions = async () => {
        if (!contextData.trim()) return alert("Enter context first.");
        if (!process.env.API_KEY) return alert('API Key missing.');

        setIsGenerating(true);
        setGeneratedContent([]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Write 3 engaging social media posts for ${platform} based on these Eswatini football updates: ${contextData}. Use emojis and local hashtags. Separate each post with |||`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setGeneratedContent(response.text?.split('|||').map(s => s.trim()) || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Image Generation Logic ---

    const toggleMatchSelection = (id: string) => {
        setSelectedMatchIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id].slice(0, 8)); // Limit to 8
    };

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        });
    };

    const generateGraphic = async () => {
        const matchesToDraw = rawMatches.filter(m => selectedMatchIds.includes(m.id));
        if (matchesToDraw.length === 0) return alert("Select at least one match.");
        
        setIsGeneratingImage(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set Portrait Dimensions (e.g. 1080 x 1350 for Instagram)
        const W = 1080;
        const H = 1350;
        canvas.width = W;
        canvas.height = H;

        // 1. Pre-load Images (Crests and Logos)
        const urlsToLoad = new Set<string>();
        matchesToDraw.forEach(m => {
            if (m.teamACrest) urlsToLoad.add(m.teamACrest);
            if (m.teamBCrest) urlsToLoad.add(m.teamBCrest);
            if (m.competitionLogoUrl) urlsToLoad.add(m.competitionLogoUrl);
        });

        const newCache = new Map(imageCache);
        await Promise.all(Array.from(urlsToLoad).map(async url => {
            if (!newCache.has(url)) {
                const img = await loadImage(url);
                if (img) newCache.set(url, img);
            }
        }));
        setImageCache(newCache);

        // 2. Draw Background (Futuristic Dark Blue Gradient)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#000814');
        bgGrad.addColorStop(0.5, '#001e5a');
        bgGrad.addColorStop(1, '#003566');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Add "flavor" - tech grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Glow effects
        const glow = ctx.createRadialGradient(W / 2, H / 3, 0, W / 2, H / 3, W / 1.5);
        glow.addColorStop(0, 'rgba(0, 53, 102, 0.4)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // 3. Header Section
        const comp = matchesToDraw[0];
        if (comp.competitionLogoUrl && newCache.has(comp.competitionLogoUrl)) {
            const logo = newCache.get(comp.competitionLogoUrl)!;
            ctx.drawImage(logo, (W / 2) - 60, 80, 120, 120);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDB913';
        ctx.font = '800 42px "Poppins", sans-serif';
        ctx.fillText(comp.competition.toUpperCase(), W / 2, 260);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 84px "Poppins", sans-serif';
        const title = matchesToDraw[0].type === 'result' ? `MATCHDAY ${comp.matchday || ''} RESULTS` : `UPCOMING FIXTURES`;
        ctx.fillText(title, W / 2, 360);

        // 4. Draw Match Rows
        const isSingle = matchesToDraw.length === 1;
        const rowH = isSingle ? 600 : (H - 550) / matchesToDraw.length;
        const startY = 450;

        matchesToDraw.forEach((m, i) => {
            const y = startY + (i * rowH);
            const midY = y + (rowH / 2);

            // Draw Team Pill Backdrops
            const drawPill = (x: number, py: number, width: number, height: number, align: 'left'|'right') => {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(align === 'left' ? x : x - width, py - (height / 2), width, height, 15);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.stroke();
                ctx.restore();
            };

            // Left Team (Home)
            drawPill(80, midY, 350, isSingle ? 120 : 80, 'left');
            if (m.teamACrest && newCache.has(m.teamACrest)) {
                ctx.drawImage(newCache.get(m.teamACrest)!, 100, midY - (isSingle ? 50 : 30), isSingle ? 100 : 60, isSingle ? 100 : 60);
            }
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `800 ${isSingle ? 36 : 24}px "Inter", sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(m.teamA, 220, midY + (isSingle ? 12 : 8));

            // Right Team (Away)
            drawPill(W - 80, midY, 350, isSingle ? 120 : 80, 'right');
            if (m.teamBCrest && newCache.has(m.teamBCrest)) {
                ctx.drawImage(newCache.get(m.teamBCrest)!, W - (isSingle ? 200 : 160), midY - (isSingle ? 50 : 30), isSingle ? 100 : 60, isSingle ? 100 : 60);
            }
            ctx.textAlign = 'right';
            ctx.fillText(m.teamB, W - 220, midY + (isSingle ? 12 : 8));

            // Center Score/VS Pill
            ctx.save();
            ctx.beginPath();
            const pillW = isSingle ? 220 : 140;
            const pillH = isSingle ? 140 : 80;
            ctx.roundRect((W / 2) - (pillW / 2), midY - (pillH / 2), pillW, pillH, 20);
            const pillGrad = ctx.createLinearGradient(0, midY - pillH, 0, midY + pillH);
            pillGrad.addColorStop(0, '#FDB913');
            pillGrad.addColorStop(1, '#FF8C00');
            ctx.fillStyle = pillGrad;
            ctx.fill();
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#000814';
            ctx.font = `900 ${isSingle ? 72 : 36}px "Poppins", sans-serif`;
            const scoreText = m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : 'VS';
            ctx.fillText(scoreText, W / 2, midY + (isSingle ? 26 : 14));

            // Subtext (Date/Venue)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '600 18px "Inter", sans-serif';
            const infoText = `${m.date}${m.time ? ' @ ' + m.time : ''} • ${m.venue || 'Match Center'}`;
            ctx.fillText(infoText, W / 2, midY + (isSingle ? 120 : 65));
        });

        // 5. Footer Branding
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, H - 100, W, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 36px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("FOOTBALL ESWATINI", W / 2, H - 40);
        
        // Red Top Accent Line
        ctx.fillStyle = '#D22730';
        ctx.fillRect(0, H - 100, W, 6);

        setIsGeneratingImage(false);
    };

    const downloadGraphic = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `fe-social-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex bg-white/50 p-1 rounded-xl w-fit border border-gray-200 shadow-sm">
                <button onClick={() => setContentType('captions')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'captions' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:bg-white'}`}>AI Captions</button>
                <button onClick={() => setContentType('image')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${contentType === 'image' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:bg-white'}`}>Graphic Studio</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card className="shadow-lg border-0 bg-white">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-2xl"><SparklesIcon className="w-6 h-6 text-purple-600" /></div>
                            <h3 className="text-2xl font-bold font-display text-gray-800">Context Source</h3>
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
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Sync Range</label>
                                <button onClick={fetchRecentData} disabled={isFetchingData} className="w-full bg-gray-100 hover:bg-gray-200 border rounded-xl px-3 py-2 text-xs font-bold text-gray-700 flex items-center justify-center gap-2">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                    Fetch Live Data
                                </button>
                            </div>
                        </div>

                        {contentType === 'captions' ? (
                            <>
                                <textarea rows={6} value={contextData} onChange={(e) => setContextData(e.target.value)} placeholder="Fetch data or type context manually..." className="block w-full p-4 border rounded-2xl text-sm font-mono bg-gray-50 shadow-inner" />
                                <Button onClick={handleGenerateCaptions} disabled={isGenerating || !contextData} className="w-full bg-purple-600 text-white h-12 rounded-2xl shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2">
                                    {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Social Posts</>}
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase">Step 1: Select Matches (Max 8)</p>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {rawMatches.length > 0 ? rawMatches.map(m => (
                                        <div 
                                            key={m.id} 
                                            onClick={() => toggleMatchSelection(m.id)}
                                            className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
                                        >
                                            <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                                            <div className="flex-grow min-w-0">
                                                <p className="font-bold text-xs truncate">{m.teamA} vs {m.teamB}</p>
                                                <p className="text-[10px] text-gray-500">{m.date} &bull; {m.competition}</p>
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${m.type === 'result' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{m.type.toUpperCase()}</span>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                                            <PhotoIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs">No matches synced. Use "Fetch" above.</p>
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    onClick={generateGraphic} 
                                    disabled={isGeneratingImage || selectedMatchIds.length === 0} 
                                    className="w-full bg-primary text-white h-12 rounded-2xl shadow-lg flex justify-center items-center gap-2"
                                >
                                    {isGeneratingImage ? <Spinner className="w-5 h-5 border-2" /> : <><PhotoIcon className="w-5 h-5" /> Generate Futuristic Graphic</>}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* OUTPUT SIDE */}
                <div className="space-y-6">
                    {contentType === 'captions' ? (
                        <Card className="shadow-lg border-2 border-dashed border-gray-200 min-h-[400px] rounded-2xl bg-gray-50/30">
                            <CardContent className="p-6">
                                <h3 className="text-sm font-black uppercase text-gray-400 mb-4 tracking-widest">AI Copywriter</h3>
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Spinner className="w-10 h-10 border-4 border-purple-500 mb-4" />
                                        <p className="font-bold">Crafting perfect captions...</p>
                                    </div>
                                ) : generatedContent.length > 0 ? (
                                    <div className="space-y-4">
                                        {generatedContent.map((text, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border flex justify-between gap-4 group">
                                                <p className="text-sm leading-relaxed">{text}</p>
                                                <button onClick={() => { navigator.clipboard.writeText(text); alert("Copied!"); }} className="p-2 text-gray-300 hover:text-primary transition-colors h-fit"><CopyIcon className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-50">
                                        <SparklesIcon className="w-12 h-12 mb-4" />
                                        <p className="text-sm font-bold">Generated copy will appear here.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold font-display text-gray-800">Preview Hub</h3>
                                {imageCache.size > 0 && (
                                    <Button onClick={downloadGraphic} className="bg-green-600 text-white h-9 px-4 flex items-center gap-2 text-xs">
                                        <DownloadIcon className="w-4 h-4" /> Download PNG
                                    </Button>
                                )}
                            </div>
                            <div className="relative border-4 border-white shadow-2xl rounded-2xl overflow-hidden aspect-[4/5] bg-gray-900 group">
                                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                                {!imageCache.size && !isGeneratingImage && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                                        <PhotoIcon className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Studio Ready</p>
                                        <p className="text-xs mt-1">Select matches and hit generate.</p>
                                    </div>
                                )}
                                {isGeneratingImage && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <Spinner className="w-12 h-12 border-4 border-white" />
                                        <p className="text-white font-black mt-4 uppercase tracking-widest text-sm">Rendering Studio...</p>
                                    </div>
                                )}
                                
                                {/* Overlay instruction */}
                                {imageCache.size > 0 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
                                            Portrait Graphic Generated
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialMediaGenerator;