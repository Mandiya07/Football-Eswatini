import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import PhotoIcon from '../icons/PhotoIcon';
import DownloadIcon from '../icons/DownloadIcon';
import { fetchAllCompetitions, fetchDirectoryEntries } from '../../services/api';
import { calculateStandings, superNormalize } from '../../services/utils';

type DivisionType = 'International' | 'MTN Premier League' | 'National First Division League' | 'Regional' | 'Cups' | 'National Team' | 'Womens Football';
type ContentType = 'captions' | 'image';
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
                fetchAllCompetitions().catch(() => ({})),
                fetchDirectoryEntries().catch(() => [])
            ]);

            const dirCrestMap = new Map<string, string>();
            dirEntries.forEach(e => {
                if (e.crestUrl && e.name) {
                    dirCrestMap.set(e.name.toLowerCase().trim(), e.crestUrl);
                    dirCrestMap.set(normalizeName(e.name), e.crestUrl);
                }
            });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            let relevantText = `Recent results and fixtures for ${division}:\n`;
            let foundData = false;
            const extractedMatches: SocialMatch[] = [];

            Object.values(allComps).forEach(comp => {
                if (!comp || !comp.name) return;
                
                let isRelevant = false;
                const nameLower = comp.name.toLowerCase();
                if (division === 'MTN Premier League' && nameLower.includes('mtn premier')) isRelevant = true;
                else if (division === 'National First Division League' && (nameLower.includes('first division') || nameLower.includes('nfd'))) isRelevant = true;
                else if (division === 'Regional' && (nameLower.includes('regional') || nameLower.includes('super league'))) isRelevant = true;
                else if (division === 'Cups' && (nameLower.includes('cup') || nameLower.includes('tournament'))) isRelevant = true;
                else if (division === 'National Team' && nameLower.includes('sihlangu')) isRelevant = true;
                else if (division === 'International' && (nameLower.includes('caf') || nameLower.includes('cosafa') || nameLower.includes('uefa'))) isRelevant = true;
                else if (division === 'Womens Football' && (nameLower.includes('women') || nameLower.includes('ladies'))) isRelevant = true;

                if (isRelevant) {
                    const recentResults = (comp.results || []).filter(r => r.fullDate && new Date(r.fullDate) >= sevenDaysAgo);
                    const upcomingFixtures = (comp.fixtures || []).filter(f => f.fullDate && new Date(f.fullDate) >= new Date());

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
                            relevantText += `- FIXTURE: ${f.teamA} vs ${f.teamB} (${f.fullDate})\n`;
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

    // --- High-Fidelity Image Generation Logic ---

    const toggleMatchSelection = (id: string) => {
        setSelectedMatchIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id].slice(0, 10));
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

    const drawTextInRect = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number, align: 'left' | 'right' | 'center', color: string) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(h * 0.4)}px "Inter", sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        
        let displayX = x;
        if (align === 'center') displayX = x + w / 2;
        else if (align === 'right') displayX = x + w - 20;
        else if (align === 'left') displayX = x + 20;

        // Truncate if too long
        let displayText = text;
        const maxWidth = w - 40;
        if (ctx.measureText(displayText).width > maxWidth) {
            while (ctx.measureText(displayText + "...").width > maxWidth && displayText.length > 0) {
                displayText = displayText.slice(0, -1);
            }
            displayText += "...";
        }

        ctx.fillText(displayText, displayX, y + h / 2);
        ctx.restore();
    };

    const generateGraphic = async () => {
        const matchesToDraw = rawMatches.filter(m => selectedMatchIds.includes(m.id));
        if (matchesToDraw.length === 0) return alert("Select matches first.");
        
        setIsGeneratingImage(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Instagram Portrait Aspect Ratio (4:5)
        const W = 1080;
        const H = 1350;
        canvas.width = W;
        canvas.height = H;

        // 1. Pre-load Images
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
        bgGrad.addColorStop(0.5, '#002B7F');
        bgGrad.addColorStop(1, '#003566');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Tech grid pattern overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // Glow effects
        const glow = ctx.createRadialGradient(W / 2, H / 3, 0, W / 2, H / 3, W / 1.5);
        glow.addColorStop(0, 'rgba(0, 53, 102, 0.6)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        // 3. Header Section
        const topComp = matchesToDraw[0];
        const headerY = 80;
        
        // League Logo
        if (topComp.competitionLogoUrl && newCache.has(topComp.competitionLogoUrl)) {
            const logo = newCache.get(topComp.competitionLogoUrl)!;
            const logoSize = 120;
            ctx.drawImage(logo, (W - logoSize) / 2, headerY, logoSize, logoSize);
        }

        // League Name in a Pill
        const leaguePillW = 600;
        const leaguePillH = 60;
        const leaguePillY = headerY + 140;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect((W - leaguePillW) / 2, leaguePillY, leaguePillW, leaguePillH, 15);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();
        ctx.restore();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDB913';
        ctx.font = '800 32px "Inter", sans-serif';
        ctx.fillText(topComp.competition.toUpperCase(), W / 2, leaguePillY + 42);

        // Title
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 86px "Poppins", sans-serif';
        const titleText = topComp.type === 'result' 
            ? `MATCHDAY ${topComp.matchday || ''} RESULTS` 
            : `UPCOMING FIXTURES`;
        ctx.fillText(titleText, W / 2, leaguePillY + 160);

        // 4. Draw Matches
        const isSingle = matchesToDraw.length === 1;
        const startY = 480;
        const rowH = isSingle ? 500 : (H - 650) / matchesToDraw.length;
        
        matchesToDraw.forEach((m, i) => {
            const y = startY + (i * rowH);
            const midY = y + (rowH / 2);
            
            // Layout dimensions
            const scoreW = isSingle ? 240 : 160;
            const scoreH = isSingle ? 160 : 80;
            const teamW = isSingle ? 450 : 380;
            const teamH = scoreH;
            const crestSize = isSingle ? 180 : 80;

            // Score Pill (Center)
            const scoreGrad = ctx.createLinearGradient(0, midY - scoreH/2, 0, midY + scoreH/2);
            scoreGrad.addColorStop(0, '#FDB913');
            scoreGrad.addColorStop(1, '#D22730');
            
            ctx.save();
            ctx.beginPath();
            ctx.roundRect((W - scoreW) / 2, midY - scoreH / 2, scoreW, scoreH, 20);
            ctx.fillStyle = scoreGrad;
            ctx.fill();
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 15;
            ctx.restore();

            ctx.fillStyle = '#000814';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `900 ${isSingle ? 96 : 48}px "Poppins", sans-serif`;
            const scoreText = m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : 'VS';
            ctx.fillText(scoreText, W / 2, midY + 4);

            // Home Team Rect & Crest
            const homeX = (W - scoreW) / 2 - teamW - 10;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(homeX, midY - teamH / 2, teamW, teamH, 15);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.stroke();
            ctx.restore();

            drawTextInRect(ctx, m.teamA, homeX, midY - teamH / 2, teamW, teamH, 'right', '#FFFFFF');
            
            if (m.teamACrest && newCache.has(m.teamACrest)) {
                const img = newCache.get(m.teamACrest)!;
                ctx.drawImage(img, homeX - crestSize - 10, midY - crestSize / 2, crestSize, crestSize);
            }

            // Away Team Rect & Crest
            const awayX = (W + scoreW) / 2 + 10;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(awayX, midY - teamH / 2, teamW, teamH, 15);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.stroke();
            ctx.restore();

            drawTextInRect(ctx, m.teamB, awayX, midY - teamH / 2, teamW, teamH, 'left', '#FFFFFF');

            if (m.teamBCrest && newCache.has(m.teamBCrest)) {
                const img = newCache.get(m.teamBCrest)!;
                ctx.drawImage(img, awayX + teamW + 10, midY - crestSize / 2, crestSize, crestSize);
            }

            // Venue/Date Metadata (Small Pill below)
            const metaW = 400;
            const metaH = 30;
            const metaY = midY + teamH / 2 + 15;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '600 20px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${m.date} • ${m.time || ''} • ${m.venue || 'STADIUM'}`, W / 2, metaY);
        });

        // 5. Footer Branding
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, H - 100, W, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 36px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("FOOTBALL ESWATINI", W / 2, H - 40);
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
                            <h3 className="text-2xl font-bold font-display text-gray-800">Content Studio</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Division</label>
                                <select value={division} onChange={(e) => setDivision(e.target.value as DivisionType)} className="block w-full px-3 py-2 border rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-purple-500">
                                    <option value="MTN Premier League">MTN Premier League</option>
                                    <option value="National First Division League">NFD</option>
                                    <option value="Regional">Regional</option>
                                    <option value="International">International</option>
                                    <option value="National Team">National Team</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Data Sync</label>
                                <button onClick={fetchRecentData} disabled={isFetchingData} className="w-full bg-gray-100 hover:bg-gray-200 border rounded-xl px-3 py-2 text-xs font-bold text-gray-700 flex items-center justify-center gap-2">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                    Fetch Matches
                                </button>
                            </div>
                        </div>

                        {contentType === 'captions' ? (
                            <>
                                <textarea rows={6} value={contextData} onChange={(e) => setContextData(e.target.value)} placeholder="Enter context or fetch match data..." className="block w-full p-4 border rounded-2xl text-sm font-mono bg-gray-50 shadow-inner" />
                                <Button onClick={handleGenerateCaptions} disabled={isGenerating || !contextData} className="w-full bg-purple-600 text-white h-12 rounded-2xl shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2">
                                    {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Social Posts</>}
                                </Button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase">Step 1: Select Records (Max 10)</p>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border rounded-xl p-2 bg-gray-50">
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
                                            {m.teamACrest && m.teamBCrest && <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Crests OK</span>}
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <PhotoIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-xs">No matches found. Click "Fetch Matches".</p>
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    onClick={generateGraphic} 
                                    disabled={isGeneratingImage || selectedMatchIds.length === 0} 
                                    className="w-full bg-primary text-white h-12 rounded-2xl shadow-lg flex justify-center items-center gap-2"
                                >
                                    {isGeneratingImage ? <Spinner className="w-5 h-5 border-2" /> : <><PhotoIcon className="w-5 h-5" /> Generate Futuristic Portrait</>}
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
                                <h3 className="text-sm font-black uppercase text-gray-400 mb-4 tracking-widest">AI Content Queue</h3>
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                        <Spinner className="w-10 h-10 border-4 border-purple-500 mb-4" />
                                        <p className="font-bold">Crafting headlines...</p>
                                    </div>
                                ) : generatedContent.length > 0 ? (
                                    <div className="space-y-4">
                                        {generatedContent.map((text, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border flex justify-between gap-4 group shadow-sm">
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
                                <h3 className="text-lg font-bold font-display text-gray-800">Graphics Hub</h3>
                                {selectedMatchIds.length > 0 && (
                                    <Button onClick={downloadGraphic} className="bg-green-600 text-white h-9 px-4 flex items-center gap-2 text-xs">
                                        <DownloadIcon className="w-4 h-4" /> Download PNG
                                    </Button>
                                )}
                            </div>
                            <div className="relative border-4 border-white shadow-2xl rounded-2xl overflow-hidden aspect-[4/5] bg-gray-900">
                                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                                {!selectedMatchIds.length && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                        <PhotoIcon className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="text-sm font-bold opacity-50 uppercase tracking-widest">Select matches to preview</p>
                                    </div>
                                )}
                                {isGeneratingImage && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                                        <Spinner className="w-12 h-12 border-4 border-white" />
                                        <p className="text-white font-black mt-4 uppercase tracking-widest text-sm">Rendering Portrait...</p>
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