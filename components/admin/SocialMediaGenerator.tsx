import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CopyIcon from '../icons/CopyIcon';
import SparklesIcon from '../icons/SparklesIcon';
import RefreshIcon from '../icons/RefreshIcon';
import PhotoIcon from '../icons/PhotoIcon';
import DownloadIcon from '../icons/DownloadIcon';
import FilmIcon from '../icons/FilmIcon';
import RadioIcon from '../icons/RadioIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import NewspaperIcon from '../icons/NewspaperIcon';
import FileTextIcon from '../icons/FileTextIcon';
import ShareIcon from '../icons/ShareIcon';
import MessageSquareIcon from '../icons/MessageSquareIcon';
import { fetchAllCompetitions, fetchDirectoryEntries, fetchNews } from '../../services/api';
import { superNormalize } from '../../services/utils';
import RecapGeneratorModal from './RecapGeneratorModal';

type DivisionType = 'MTN Premier League' | 'National First Division' | 'Regional' | 'International' | 'National Team' | 'Womens Football';
type ContentType = 'captions' | 'summary' | 'image' | 'video';
type PlatformType = 'Twitter/X' | 'Facebook' | 'Instagram' | 'Newsletter';

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
    fullDate?: string;
    time?: string;
    competition: string;
    competitionLogoUrl?: string;
    venue?: string;
    matchday?: number;
}

const SocialMediaGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentType>('captions');
    const [division, setDivision] = useState<DivisionType>('MTN Premier League');
    const [platform, setPlatform] = useState<PlatformType>('Instagram');
    const [contextData, setContextData] = useState('');
    const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
    const [generatedSummary, setGeneratedSummary] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    
    // Image Gen State
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Robust Normalization for Crest Matching
    const normalizeName = (name: string) => (name || '').trim().toLowerCase().replace(/\s+fc$/i, '').replace(/\s+football club$/i, '').trim();

    const fetchRecentData = async () => {
        setIsFetchingData(true);
        try {
            const [allComps, dirEntries, allNews] = await Promise.all([
                fetchAllCompetitions().catch(() => ({})),
                fetchDirectoryEntries().catch(() => []),
                fetchNews().catch(() => [])
            ]);

            const dirCrestMap = new Map<string, string>();
            dirEntries.forEach(e => {
                if (e.crestUrl && e.name) {
                    dirCrestMap.set(e.name.toLowerCase().trim(), e.crestUrl);
                    dirCrestMap.set(normalizeName(e.name), e.crestUrl);
                }
            });

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14); 
            
            let relevantText = `CONTEXTUAL DATA FOR ${division} (${new Date().toLocaleDateString()}):\n\n`;
            
            const relevantNews = allNews.filter(n => {
                const cats = Array.isArray(n.category) ? n.category : [n.category];
                return cats.some(c => c.includes(division.split(' ')[0]));
            }).slice(0, 5);
            
            if (relevantNews.length > 0) {
                relevantText += "--- RECENT HEADLINES ---\n";
                relevantNews.forEach(n => relevantText += `- ${n.title}: ${n.summary}\n`);
                relevantText += "\n";
            }

            const extractedMatches: SocialMatch[] = [];

            Object.values(allComps).forEach(comp => {
                if (!comp || !comp.name) return;
                
                const nameLower = comp.name.toLowerCase();
                let isRelevant = false;
                if (division === 'MTN Premier League' && nameLower.includes('mtn premier')) isRelevant = true;
                else if (division === 'National First Division' && (nameLower.includes('first division') || nameLower.includes('nfd'))) isRelevant = true;
                else if (division === 'Regional' && (nameLower.includes('regional') || nameLower.includes('super league'))) isRelevant = true;
                else if (division === 'International' && (nameLower.includes('caf') || nameLower.includes('uefa') || nameLower.includes('cl'))) isRelevant = true;
                else if (division === 'National Team' && nameLower.includes('sihlangu')) isRelevant = true;
                else if (division === 'Womens Football' && nameLower.includes('women')) isRelevant = true;

                if (isRelevant) {
                    const getCrest = (name: string) => {
                        if (!name) return undefined;
                        const lower = name.toLowerCase().trim();
                        const norm = normalizeName(name);
                        return dirCrestMap.get(lower) || dirCrestMap.get(norm) || (comp.teams?.find(t => t.name === name)?.crestUrl);
                    };

                    const combined = [...(comp.results || []), ...(comp.fixtures || [])];
                    combined.forEach(m => {
                        const mDate = new Date(m.fullDate || '');
                        if (mDate >= sevenDaysAgo) {
                            extractedMatches.push({
                                id: `${comp.name}-${m.id}`,
                                type: m.status === 'finished' ? 'result' : 'fixture',
                                teamA: m.teamA,
                                teamB: m.teamB,
                                teamACrest: getCrest(m.teamA),
                                teamBCrest: getCrest(m.teamB),
                                scoreA: m.scoreA,
                                scoreB: m.scoreB,
                                date: m.fullDate || '',
                                fullDate: m.fullDate,
                                time: m.time,
                                competition: comp.name,
                                competitionLogoUrl: comp.logoUrl,
                                venue: m.venue,
                                matchday: m.matchday
                            });
                        }
                    });
                }
            });

            relevantText += "--- RECENT & UPCOMING MATCHES ---\n";
            relevantText += extractedMatches.map(m => 
                `${m.type === 'result' ? '[RESULT]' : '[FIXTURE]'} ${m.teamA} ${m.type === 'result' ? m.scoreA + '-' + m.scoreB : 'vs'} ${m.teamB} (${m.date})`
            ).join('\n');

            setContextData(relevantText);
            setRawMatches(extractedMatches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            if (extractedMatches.length > 0) setSelectedMatchIds([extractedMatches[0].id]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerateContent = async () => {
        if (!contextData.trim()) return alert("Enter context first.");
        if (!process.env.API_KEY) return alert('API Key missing.');

        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            let prompt = "";
            if (activeTab === 'captions') {
                prompt = `You are a high-energy social media manager for Football Eswatini. 
                Based on this data: "${contextData}", write 3 distinct and exciting captions for ${platform}. 
                Include emojis, hashtags (like #FootballEswatini, #EswatiniSoccer), and use a professional yet vibrant tone. 
                Separate each caption with '---'.`;
            } else {
                prompt = `You are an expert Eswatini football pundit and editor. 
                Based on this data: "${contextData}", write a comprehensive ${division} Weekly Summary. 
                The summary should include Markdown formatting.`;
            }
            
            const response = await ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: prompt 
            });
            
            if (activeTab === 'captions') {
                setGeneratedCaptions(response.text?.split('---').map(s => s.trim()).filter(Boolean) || []);
            } else {
                setGeneratedSummary(response.text || '');
            }
        } catch (error) {
            console.error(error);
            alert("AI generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleMatchSelection = (id: string) => {
        setSelectedMatchIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id].slice(0, 8));
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

    const drawTextInRect = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number, align: 'left' | 'right', color: string) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.floor(h * 0.4)}px "Inter", sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        let displayX = align === 'left' ? x + 20 : x + w - 20;
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

        const W = 1080;
        const H = 1350;
        canvas.width = W;
        canvas.height = H;

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

        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#000814');
        bgGrad.addColorStop(0.4, '#002B7F');
        bgGrad.addColorStop(1, '#003566');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        const topComp = matchesToDraw[0];
        const headerY = 80;
        if (topComp.competitionLogoUrl && newCache.has(topComp.competitionLogoUrl)) {
            const logo = newCache.get(topComp.competitionLogoUrl)!;
            ctx.drawImage(logo, (W - 120) / 2, headerY, 120, 120);
        }

        const leaguePillW = 650;
        const leaguePillH = 60;
        const leaguePillY = headerY + 140;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect((W - leaguePillW) / 2, leaguePillY, leaguePillW, leaguePillH, 15);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
        ctx.restore();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDB913';
        ctx.font = '800 32px "Inter", sans-serif';
        ctx.fillText(topComp.competition.toUpperCase(), W / 2, leaguePillY + 42);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 92px "Poppins", sans-serif';
        const titleText = topComp.type === 'result' ? `MATCH RESULTS` : `UPCOMING FIXTURES`;
        ctx.fillText(titleText, W / 2, leaguePillY + 170);

        const startY = 480;
        const rowH = matchesToDraw.length === 1 ? 500 : (H - 650) / matchesToDraw.length;
        
        matchesToDraw.forEach((m, i) => {
            const midY = startY + (i * rowH) + (rowH / 2);
            const scoreW = matchesToDraw.length === 1 ? 260 : 160;
            const scoreH = matchesToDraw.length === 1 ? 160 : 80;
            const teamW = matchesToDraw.length === 1 ? 420 : 380;
            const crestSize = matchesToDraw.length === 1 ? 180 : 80;

            const scoreGrad = ctx.createLinearGradient(0, midY - scoreH/2, 0, midY + scoreH/2);
            scoreGrad.addColorStop(0, '#FDB913');
            scoreGrad.addColorStop(1, '#D22730');
            
            ctx.save();
            ctx.beginPath();
            ctx.roundRect((W - scoreW) / 2, midY - scoreH / 2, scoreW, scoreH, 20);
            ctx.fillStyle = scoreGrad;
            ctx.fill();
            ctx.restore();

            ctx.fillStyle = '#000814';
            ctx.textAlign = 'center';
            ctx.font = `900 ${matchesToDraw.length === 1 ? 110 : 52}px "Poppins", sans-serif`;
            ctx.fillText(m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : 'VS', W / 2, midY + (matchesToDraw.length === 1 ? 25 : 15));

            const homeX = (W - scoreW) / 2 - teamW - 15;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(homeX, midY - scoreH / 2, teamW, scoreH, 15);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.restore();
            drawTextInRect(ctx, m.teamA, homeX, midY - scoreH / 2, teamW, scoreH, 'right', '#FFFFFF');
            if (m.teamACrest && newCache.has(m.teamACrest)) ctx.drawImage(newCache.get(m.teamACrest)!, homeX - crestSize - 10, midY - crestSize / 2, crestSize, crestSize);

            const awayX = (W + scoreW) / 2 + 15;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(awayX, midY - scoreH / 2, teamW, scoreH, 15);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.restore();
            drawTextInRect(ctx, m.teamB, awayX, midY - scoreH / 2, teamW, scoreH, 'left', '#FFFFFF');
            if (m.teamBCrest && newCache.has(m.teamBCrest)) ctx.drawImage(newCache.get(m.teamBCrest)!, awayX + teamW + 10, midY - crestSize / 2, crestSize, crestSize);
        });

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, H - 100, W, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 42px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("FOOTBALL ESWATINI", W / 2, H - 40);

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

    const handleShareGraphic = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !navigator.share) return alert("Sharing is not supported in this browser.");

        setIsSharing(true);
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `fe-graphic-${Date.now()}.png`, { type: 'image/png' });
                const shareData = {
                    title: 'Football Eswatini Update',
                    text: 'Latest news from the Beautiful Game!',
                    files: [file],
                };

                if (navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                    alert("Your browser does not support sharing files.");
                }
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex bg-white/50 p-1.5 rounded-2xl w-fit border border-gray-200 shadow-sm flex-wrap gap-2">
                <button onClick={() => setActiveTab('captions')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'captions' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>AI Captions</button>
                <button onClick={() => setActiveTab('summary')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>Weekly Summary</button>
                <button onClick={() => setActiveTab('image')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'image' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>Graphic Studio</button>
                <button onClick={() => setIsRecapModalOpen(true)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50 flex items-center gap-2">
                    <FilmIcon className="w-4 h-4" /> AI Recap Video
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card className="shadow-xl border-0 bg-white">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-2xl"><SparklesIcon className="w-6 h-6 text-purple-600" /></div>
                            <h3 className="text-2xl font-bold font-display text-gray-800">Content Engine</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target League</label>
                                <select value={division} onChange={(e) => setDivision(e.target.value as DivisionType)} className="block w-full px-3 py-2.5 border rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-purple-500">
                                    <option value="MTN Premier League">Premier League</option>
                                    <option value="National First Division">NFD</option>
                                    <option value="Regional">Regional / Super League</option>
                                    <option value="International">International Hub</option>
                                    <option value="National Team">National Team</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Sync Latest</label>
                                <button onClick={fetchRecentData} disabled={isFetchingData} className="w-full bg-gray-100 hover:bg-gray-200 border rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 flex items-center justify-center gap-2">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                    Refresh Context
                                </button>
                            </div>
                        </div>

                        {activeTab === 'image' && (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase">Step 1: Select Records (Max 8)</p>
                                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar border rounded-2xl p-2 bg-gray-50">
                                    {rawMatches.length > 0 ? rawMatches.map(m => (
                                        <div 
                                            key={m.id} 
                                            onClick={() => toggleMatchSelection(m.id)}
                                            className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400 shadow-sm' : 'bg-white hover:bg-gray-100 border-gray-100'}`}
                                        >
                                            <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                                            <div className="flex-grow min-w-0">
                                                <p className="font-bold text-xs truncate text-gray-900">{m.teamA} vs {m.teamB}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">{m.date} &bull; {m.competition}</p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-1.5">
                                                {m.teamACrest && m.teamBCrest && <CheckCircleIcon className="w-3 h-3 text-green-500" />}
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${m.type === 'result' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{m.type.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <PhotoIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-medium">No matches in queue. Sync data first.</p>
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    onClick={generateGraphic} 
                                    disabled={isGeneratingImage || selectedMatchIds.length === 0} 
                                    className="w-full bg-primary text-white h-12 rounded-2xl shadow-xl flex justify-center items-center gap-2 hover:bg-primary-dark transition-all"
                                >
                                    {isGeneratingImage ? <Spinner className="w-5 h-5 border-2" /> : <><PhotoIcon className="w-5 h-5" /> Render Graphic</>}
                                </Button>
                            </div>
                        )}

                        {(activeTab === 'captions' || activeTab === 'summary') && (
                            <div className="space-y-4">
                                <label className="block text-xs font-black uppercase text-gray-400 mb-1">Target Platform</label>
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl flex-wrap">
                                    {(activeTab === 'captions' ? ['Instagram', 'Facebook', 'Twitter/X'] : ['Facebook', 'Newsletter', 'Web Article']).map(p => (
                                        <button key={p} onClick={() => setPlatform(p as PlatformType)} className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-xs font-bold transition-all ${platform === p ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{p}</button>
                                    ))}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase">Context Snapshot</label>
                                    <textarea rows={6} value={contextData} onChange={(e) => setContextData(e.target.value)} className="block w-full p-4 border rounded-2xl text-xs font-mono bg-gray-50 shadow-inner" />
                                </div>
                                <Button onClick={handleGenerateContent} disabled={isGenerating || !contextData} className="w-full bg-purple-600 text-white h-12 rounded-2xl shadow-lg hover:bg-purple-700 flex justify-center items-center gap-2">
                                    {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Content</>}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {activeTab === 'image' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-bold font-display text-gray-800 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div> Preview
                                </h3>
                                {selectedMatchIds.length > 0 && (
                                    <div className="flex gap-2">
                                        <Button onClick={handleShareGraphic} disabled={isSharing} className="bg-blue-600 text-white h-10 px-4 flex items-center gap-2 text-xs rounded-xl shadow-lg hover:bg-blue-700">
                                            {isSharing ? <Spinner className="w-4 h-4 border-2" /> : <ShareIcon className="w-4 h-4" />} Share
                                        </Button>
                                        <Button onClick={downloadGraphic} className="bg-green-600 text-white h-10 px-4 flex items-center gap-2 text-xs rounded-xl shadow-lg hover:bg-green-700">
                                            <DownloadIcon className="w-4 h-4" /> Download
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="relative border-4 border-white shadow-2xl rounded-[2rem] overflow-hidden aspect-[4/5] bg-gray-900">
                                <canvas ref={canvasRef} className="w-full h-full object-contain" />
                                {!selectedMatchIds.length && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 p-12 text-center">
                                        <PhotoIcon className="w-16 h-16 mb-6 opacity-10" />
                                        <p className="text-sm font-black opacity-40 uppercase">Studio Canvas</p>
                                    </div>
                                )}
                                {isGeneratingImage && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                        <Spinner className="w-16 h-16 border-4 border-white" />
                                        <p className="text-white font-black mt-6 uppercase tracking-widest text-sm">Rendering...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'captions' && (
                        <Card className="shadow-xl border-2 border-dashed border-gray-200 min-h-[450px] rounded-3xl bg-gray-50/50 p-6">
                            <h3 className="text-sm font-black uppercase text-gray-400 mb-5 tracking-widest">AI Copy Output</h3>
                            {generatedCaptions.map((text, i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 mb-4 flex justify-between shadow-sm">
                                    <p className="text-sm leading-relaxed text-gray-800">{text}</p>
                                    <button onClick={() => { navigator.clipboard.writeText(text); alert("Copied!"); }} className="p-2 text-gray-300 hover:text-primary h-fit"><CopyIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </Card>
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