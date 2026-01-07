
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
import FilmIcon from '../icons/FilmIcon';
import RadioIcon from '../icons/RadioIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import ShareIcon from '../icons/ShareIcon';
import MessageSquareIcon from '../icons/MessageSquareIcon';
import { fetchAllCompetitions, fetchDirectoryEntries } from '../../services/api';
import { superNormalize, findInMap } from '../../services/utils';
import RecapGeneratorModal from './RecapGeneratorModal';
import { DirectoryEntity } from '../../data/directory';
import { Competition } from '../../data/teams';

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
    competition: string;
    competitionLogoUrl?: string;
}

const SocialMediaGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentType>('captions');
    const [platform, setPlatform] = useState<PlatformType>('Instagram');
    const [contextData, setContextData] = useState('');
    const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(false);
    
    // Dynamic League Selection
    const [allLeagues, setAllLeagues] = useState<{ id: string, name: string }[]>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    
    // Image Gen State
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
                .map(([id, c]) => ({ id, name: c.name }))
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

            // Create Directory Source of Truth map
            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const comp = allComps[selectedLeagueId];
            if (!comp) throw new Error("Competition not found");

            const extractedMatches: SocialMatch[] = [];
            const getCrest = (name: string) => {
                if (!name) return undefined;
                // PRIMARY: Directory (Logos & Crests Admin Section)
                const dirEntry = dirMap.get(superNormalize(name));
                if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                // SECONDARY: Local fallback
                const team = comp.teams?.find(t => superNormalize(t.name) === superNormalize(name));
                return team?.crestUrl;
            };

            const combined = [...(comp.results || []), ...(comp.fixtures || [])];
            combined.forEach(m => {
                extractedMatches.push({
                    id: `${selectedLeagueId}-${m.id}`,
                    type: m.status === 'finished' ? 'result' : 'fixture',
                    teamA: m.teamA,
                    teamB: m.teamB,
                    teamACrest: getCrest(m.teamA),
                    teamBCrest: getCrest(m.teamB),
                    scoreA: m.scoreA,
                    scoreB: m.scoreB,
                    date: m.fullDate || m.date || '',
                    fullDate: m.fullDate,
                    time: m.time,
                    competition: comp.name,
                    competitionLogoUrl: comp.logoUrl
                });
            });

            let contextText = `MATCH LIST FOR ${comp.name}:\n`;
            contextText += extractedMatches.map(m => 
                `${m.type.toUpperCase()}: ${m.teamA} ${m.type === 'result' ? m.scoreA + '-' + m.scoreB : 'vs'} ${m.teamB} (${m.date})`
            ).join('\n');

            setContextData(contextText);
            setRawMatches(extractedMatches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            if (extractedMatches.length > 0) setSelectedMatchIds([extractedMatches[0].id]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetchingData(false);
        }
    };

    const handleGenerateCaptions = async () => {
        if (selectedMatchIds.length === 0) return alert("Select matches from the list first.");
        if (!process.env.API_KEY) return alert('API Key missing.');

        setIsGenerating(true);
        try {
            const matchesToSummarize = rawMatches.filter(m => selectedMatchIds.includes(m.id));
            const dataToProcess = matchesToSummarize.map(m => 
                `${m.teamA} ${m.type === 'result' ? m.scoreA + '-' + m.scoreB : 'vs'} ${m.teamB} (${m.date})`
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
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `https://corsproxy.io/?${encodeURIComponent(url)}`;
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

        // Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#000814');
        bgGrad.addColorStop(0.5, '#002B7F');
        bgGrad.addColorStop(1, '#003566');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const topComp = matchesToDraw[0];
        
        if (topComp.competitionLogoUrl && newCache.has(topComp.competitionLogoUrl)) {
            const logo = newCache.get(topComp.competitionLogoUrl)!;
            const logoSize = 220;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 40;
            ctx.drawImage(logo, (W - logoSize) / 2, 80, logoSize, logoSize);
            ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDB913';
        ctx.font = '800 52px "Inter", sans-serif';
        ctx.fillText(topComp.competition.toUpperCase(), W / 2, 360);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 100px "Poppins", sans-serif';
        const mainTitle = topComp.type === 'result' ? 'RESULTS' : 'FIXTURES';
        ctx.fillText(mainTitle, W / 2, 480);

        const rowH = (H - 650) / Math.max(1, matchesToDraw.length);
        const startY = 580;

        matchesToDraw.forEach((m, i) => {
            const midY = startY + (i * rowH) + (rowH / 2);
            
            const boxW = 200, boxH = 100;
            const scoreGrad = ctx.createLinearGradient(0, midY - 50, 0, midY + 50);
            scoreGrad.addColorStop(0, '#D22730');
            scoreGrad.addColorStop(1, '#9e1b22');
            ctx.fillStyle = scoreGrad;
            ctx.beginPath();
            ctx.roundRect((W - boxW) / 2, midY - boxH / 2, boxW, boxH, 20);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 60px "Poppins", sans-serif';
            ctx.textBaseline = 'middle';
            const scoreText = m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : 'VS';
            ctx.fillText(scoreText, W/2, midY + 5);

            ctx.font = '800 36px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(m.teamA.toUpperCase(), W/2 - boxW/2 - 30, midY + 5);
            if (m.teamACrest && newCache.has(m.teamACrest)) {
                ctx.drawImage(newCache.get(m.teamACrest)!, W/2 - boxW/2 - 400, midY - 60, 120, 120);
            }

            ctx.textAlign = 'left';
            ctx.fillText(m.teamB.toUpperCase(), W/2 + boxW/2 + 30, midY + 5);
            if (m.teamBCrest && newCache.has(m.teamBCrest)) {
                ctx.drawImage(newCache.get(m.teamBCrest)!, W/2 + boxW/2 + 280, midY - 60, 120, 120);
            }
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

                        {/* 1. SYNC CONTROL (VISIBLE TO BOTH) */}
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
                                    Sync Recent Data
                                </button>
                            </div>
                        </div>

                        {/* 2. MATCH SELECTION (VISIBLE TO BOTH) */}
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase">1. Pick Synced Match Records (Max 8)</p>
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 border rounded-2xl p-2 bg-gray-50 custom-scrollbar">
                                {rawMatches.map(m => (
                                    <div key={m.id} onClick={() => toggleMatchSelection(m.id)} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
                                        <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-xs truncate">{m.teamA} vs {m.teamB}</p>
                                            <p className="text-[10px] text-gray-500">{m.date} &bull; {m.competition}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {m.type === 'result' ? <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded">RESULT</span> : <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">FIXTURE</span>}
                                        </div>
                                    </div>
                                ))}
                                {rawMatches.length === 0 && !isFetchingData && <p className="text-center py-12 text-gray-400 text-xs italic">Sync data to load match records.</p>}
                                {isFetchingData && <div className="flex justify-center py-12"><Spinner /></div>}
                            </div>
                        </div>

                        {/* 3. TAB SPECIFIC TRIGGER */}
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
                                    {isGenerating ? <Spinner className="w-5 h-5 border-2" /> : <><SparklesIcon className="w-5 h-5" /> Generate Captions</>}
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. PREVIEW AREA */}
                <div>
                    <h3 className="text-lg font-bold font-display text-gray-800 mb-4 flex justify-between items-center">
                        Live Preview
                        {selectedMatchIds.length > 0 && activeTab === 'image' && (
                            <button onClick={downloadGraphic} className="text-blue-600 text-xs font-bold hover:underline">Download PNG</button>
                        )}
                    </h3>
                    {activeTab === 'image' ? (
                        <div className="relative border-4 border-white shadow-2xl rounded-[2rem] overflow-hidden aspect-[4/5] bg-gray-900">
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
