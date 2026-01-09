
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
import { fetchAllCompetitions, fetchDirectoryEntries } from '../../services/api';
import { superNormalize, findInMap } from '../../services/utils';
import RecapGeneratorModal from './RecapGeneratorModal';
import { DirectoryEntity } from '../../data/directory';

type ContentType = 'captions' | 'image';
type PlatformType = 'Twitter/X' | 'Facebook' | 'Instagram';

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
    matchday?: number;
    competition: string;
    competitionLogoUrl?: string;
}

const SocialMediaGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentType>('captions');
    const [platform, setPlatform] = useState<PlatformType>('Instagram');
    const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    
    const [allLeagues, setAllLeagues] = useState<{ id: string, name: string, logoUrl?: string }[]>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    
    const [rawMatches, setRawMatches] = useState<SocialMatch[]>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const loadLeagues = async () => {
            const comps = await fetchAllCompetitions();
            const list = Object.entries(comps)
                .map(([id, c]) => ({ id, name: c.name, logoUrl: c.logoUrl }))
                .sort((a, b) => a.name.localeCompare(b.name));
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
            const [allComps, dirEntries] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries()
            ]);

            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const comp = allComps[selectedLeagueId];
            if (!comp) throw new Error("Competition not found");

            const extractedMatches: SocialMatch[] = [];
            const getCrest = (name: string) => {
                if (!name) return undefined;
                const dirEntry = findInMap(name, dirMap);
                if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                const teamInComp = comp.teams?.find(t => superNormalize(t.name) === superNormalize(name));
                return teamInComp?.crestUrl;
            };

            // SYNC BOTH: Results and Fixtures
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
                    matchday: m.matchday,
                    competition: comp.displayName || comp.name,
                    competitionLogoUrl: comp.logoUrl
                });
            });

            // Sort: Results first, then fixtures
            const sorted = extractedMatches.sort((a, b) => {
                if (a.type !== b.type) return a.type === 'result' ? -1 : 1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setRawMatches(sorted);
            if (sorted.length > 0) setSelectedMatchIds(sorted.slice(0, 8).map(m => m.id));
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerateCaptions = async () => {
        if (selectedMatchIds.length === 0) return alert("Select matches first.");
        if (!process.env.API_KEY) return alert('API Key missing.');

        setIsGenerating(true);
        try {
            const matchesToSummarize = rawMatches.filter(m => selectedMatchIds.includes(m.id));
            const dataToProcess = matchesToSummarize.map(m => 
                `${m.teamA} ${m.type === 'result' ? m.scoreA + '-' + m.scoreB : 'vs'} ${m.teamB} (${m.date} ${m.time || ''})`
            ).join(', ');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `You are the social media manager for Football Eswatini. Create 3 exciting captions for ${platform} based on these matches: "${dataToProcess}". Use emojis and #FootballEswatini. Separate each with '---'.`;
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            setGeneratedCaptions(response.text?.split('---').map(s => s.trim()).filter(Boolean) || [response.text || '']);
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
            const logoW = 220;
            const logoH = (logo.height / logo.width) * logoW;
            ctx.drawImage(logo, (W - logoW) / 2, 70, logoW, logoH);
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDB913';
        ctx.font = '800 38px "Poppins", sans-serif';
        ctx.fillText(topComp.competition.toUpperCase(), W / 2, 340);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 85px "Poppins", sans-serif';
        const headerText = matchesToDraw.every(m => m.type === 'result') ? "Match Results" : (topComp.matchday ? `Matchday ${topComp.matchday}` : "Football Eswatini");
        ctx.fillText(headerText, W / 2, 440);

        const startY = 530;
        const rowH = 150;
        const rowGap = 12;
        const textMaxW = 260; // STRICT LIMIT to prevent logo overlap

        matchesToDraw.forEach((m, i) => {
            const y = startY + (i * (rowH + rowGap));
            
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath();
            ctx.roundRect(50, y, W - 100, rowH, 20);
            ctx.fill();

            // Aligned Crests
            if (m.teamACrest && newCache.has(m.teamACrest)) {
                ctx.drawImage(newCache.get(m.teamACrest)!, 80, y + 25, 100, 100);
            }
            if (m.teamBCrest && newCache.has(m.teamBCrest)) {
                ctx.drawImage(newCache.get(m.teamBCrest)!, W - 180, y + 25, 100, 100);
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '800 22px "Inter", sans-serif';
            
            // HOME TEAM: Starts after logo (80+100+20=200)
            ctx.textAlign = 'left';
            ctx.fillText(m.teamA, 200, y + 80, textMaxW);
            
            // AWAY TEAM: Ends before logo (W-180-20=W-200)
            ctx.textAlign = 'right';
            ctx.fillText(m.teamB, W - 200, y + 80, textMaxW);

            // CENTER METADATA
            ctx.textAlign = 'center';
            ctx.font = '900 62px "Poppins", sans-serif';
            const centerInfo = m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : m.time || '15:00';
            ctx.fillText(centerInfo, W/2, y + 85);

            ctx.font = '600 18px "Inter", sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText(m.date, W/2, y + 125);
        });

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, H - 140, W, 140);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 48px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("FOOTBALL ESWATINI", W / 2, H - 55);

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

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex bg-white/50 p-1.5 rounded-2xl w-fit border border-gray-200 shadow-sm flex-wrap gap-2">
                <button onClick={() => setActiveTab('captions')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'captions' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>AI Captions</button>
                <button onClick={() => setActiveTab('image')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'image' ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:bg-white'}`}>Graphic Studio</button>
                <button onClick={() => setIsRecapModalOpen(true)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-purple-600 hover:bg-purple-50 flex items-center gap-2">
                    <FilmIcon className="w-4 h-4" /> AI Recap Video
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card className="shadow-xl border-0 bg-white">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-3 rounded-2xl"><SparklesIcon className="w-6 h-6 text-indigo-600" /></div>
                            <h3 className="text-2xl font-bold font-display text-gray-800">Media Studio</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Select League</label>
                                <select 
                                    value={selectedLeagueId} 
                                    onChange={(e) => setSelectedLeagueId(e.target.value)} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={fetchRecentData} disabled={isFetchingData} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 border rounded-xl px-3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 h-10 shadow-md">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                    Sync Results & Fixtures
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">Select Match Data (Max 8)</p>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 border rounded-2xl p-2 bg-gray-50 custom-scrollbar">
                                {rawMatches.map(m => (
                                    <div key={m.id} onClick={() => toggleMatchSelection(m.id)} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
                                        <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-xs truncate">{m.teamA} vs {m.teamB}</p>
                                            <p className="text-[10px] text-gray-500">{m.date} &bull; {m.time || 'TBA'} &bull; {m.competition}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {m.type === 'result' ? <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded">RESULT</span> : <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">FIXTURE</span>}
                                        </div>
                                    </div>
                                ))}
                                {rawMatches.length === 0 && !isFetchingData && <p className="text-center py-12 text-gray-400 text-xs italic">Sync data to load match records.</p>}
                            </div>
                        </div>

                        {activeTab === 'image' ? (
                            <Button onClick={generateGraphic} disabled={isGeneratingImage || selectedMatchIds.length === 0} className="w-full bg-primary text-white h-12 rounded-2xl shadow-xl font-bold flex justify-center items-center gap-2">
                                {isGeneratingImage ? <Spinner className="w-5 h-5 border-2" /> : <><PhotoIcon className="w-5 h-5" /> Render Social Graphic</>}
                            </Button>
                        ) : (
                             <div className="space-y-4 pt-4 border-t">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target Platform</label>
                                    <select value={platform} onChange={(e) => setPlatform(e.target.value as PlatformType)} className="block w-full px-3 py-2 border rounded-xl text-sm">
                                        <option>Instagram</option><option>Facebook</option><option>Twitter/X</option>
                                    </select>
                                </div>
                                <Button onClick={handleGenerateCaptions} disabled={isGenerating || selectedMatchIds.length === 0} className="w-full bg-indigo-600 text-white h-12 rounded-2xl shadow-xl font-bold flex justify-center items-center gap-2">
                                    {isGenerating ? <Spinner className="w-4 h-4 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Captions</>}
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                <div>
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
                    ) : (
                        <div className="space-y-4">
                            {generatedCaptions.map((cap, i) => (
                                <Card key={i} className="bg-white border-0 shadow-md animate-fade-in">
                                    <CardContent className="p-4 flex justify-between gap-4">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{cap}</p>
                                        <button onClick={() => { navigator.clipboard.writeText(cap); alert("Copied!"); }} className="p-2 h-fit text-gray-400 hover:text-primary"><CopyIcon className="w-4 h-4"/></button>
                                    </CardContent>
                                </Card>
                            ))}
                            {generatedCaptions.length === 0 && <p className="text-center py-20 text-gray-400 italic">Generated captions will appear here.</p>}
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
