
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
import { superNormalize, findInMap } from '../../services/utils';
import RecapGeneratorModal from './RecapGeneratorModal';
import { DirectoryEntity } from '../../data/directory';

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
    const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fetchRecentData = async () => {
        setIsFetchingData(true);
        try {
            const [allComps, dirEntries, allNews] = await Promise.all([
                fetchAllCompetitions().catch(() => ({})),
                fetchDirectoryEntries().catch(() => []),
                fetchNews().catch(() => [])
            ]);

            // Create a robust directory map for crest lookup
            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14); 
            
            let relevantText = `CONTEXTUAL DATA FOR ${division} (${new Date().toLocaleDateString()}):\n\n`;
            const extractedMatches: SocialMatch[] = [];

            Object.values(allComps).forEach(comp => {
                if (!comp || !comp.name) return;
                
                const compNameNorm = superNormalize(comp.name);
                const divisionNorm = superNormalize(division);
                
                let isRelevant = false;
                if (division === 'MTN Premier League' && compNameNorm.includes('premier')) isRelevant = true;
                else if (division === 'National First Division' && (compNameNorm.includes('firstdivision') || compNameNorm.includes('nfd'))) isRelevant = true;
                else if (division === 'Regional' && (compNameNorm.includes('regional') || compNameNorm.includes('superleague'))) isRelevant = true;
                else if (division === 'International' && (compNameNorm.includes('caf') || compNameNorm.includes('uefa') || compNameNorm.includes('cl'))) isRelevant = true;
                else if (division === 'National Team' && (compNameNorm.includes('sihlangu') || compNameNorm.includes('national'))) isRelevant = true;
                else if (division === 'Womens Football' && (compNameNorm.includes('women') || compNameNorm.includes('ladies'))) isRelevant = true;

                if (isRelevant) {
                    const getCrest = (name: string) => {
                        if (!name) return undefined;
                        // PRIMARY: Directory (Admin Logos & Crests)
                        const dirEntry = dirMap.get(superNormalize(name));
                        if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                        // SECONDARY: Local fallback
                        const team = comp.teams?.find(t => superNormalize(t.name) === superNormalize(name));
                        return team?.crestUrl;
                    };

                    const combined = [...(comp.results || []), ...(comp.fixtures || [])];
                    combined.forEach(m => {
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
                    });
                }
            });

            relevantText += "--- MATCH LISTING ---\n";
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
            let prompt = `You are a social media expert for Football Eswatini. Create distinct captions for ${platform} based on: "${contextData}". Use emojis and #FootballEswatini.`;
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
        bgGrad.addColorStop(1, '#003566');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const topComp = matchesToDraw[0];
        
        // LEAGUE LOGO HERO (TOP)
        if (topComp.competitionLogoUrl && newCache.has(topComp.competitionLogoUrl)) {
            const logo = newCache.get(topComp.competitionLogoUrl)!;
            const logoSize = 180;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 30;
            ctx.drawImage(logo, (W - logoSize) / 2, 80, logoSize, logoSize);
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#FDB913';
        ctx.font = '800 48px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(topComp.competition.toUpperCase(), W / 2, 330);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 96px "Poppins", sans-serif';
        ctx.fillText(topComp.type === 'result' ? 'RESULTS' : 'FIXTURES', W / 2, 450);

        const rowH = (H - 600) / Math.max(1, matchesToDraw.length);
        const startY = 550;

        matchesToDraw.forEach((m, i) => {
            const midY = startY + (i * rowH) + (rowH / 2);
            
            // Score Box
            const boxW = 180, boxH = 90;
            ctx.fillStyle = '#D22730';
            ctx.beginPath();
            ctx.roundRect((W - boxW) / 2, midY - boxH / 2, boxW, boxH, 15);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 50px "Poppins", sans-serif';
            ctx.fillText(m.type === 'result' ? `${m.scoreA}-${m.scoreB}` : 'VS', W/2, midY + 15);

            // Teams
            ctx.font = '800 32px "Inter", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(m.teamA.toUpperCase(), W/2 - boxW/2 - 20, midY + 10);
            if (m.teamACrest && newCache.has(m.teamACrest)) {
                ctx.drawImage(newCache.get(m.teamACrest)!, W/2 - boxW/2 - 350, midY - 40, 80, 80);
            }

            ctx.textAlign = 'left';
            ctx.fillText(m.teamB.toUpperCase(), W/2 + boxW/2 + 20, midY + 10);
            if (m.teamBCrest && newCache.has(m.teamBCrest)) {
                ctx.drawImage(newCache.get(m.teamBCrest)!, W/2 + boxW/2 + 270, midY - 40, 80, 80);
            }
        });

        setIsGeneratingImage(false);
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
                            <h3 className="text-2xl font-bold font-display text-gray-800">Media Generation</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">Target League</label>
                                <select value={division} onChange={(e) => setDivision(e.target.value as DivisionType)} className="block w-full px-3 py-2.5 border rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500">
                                    <option value="MTN Premier League">MTN Premier League</option>
                                    <option value="National First Division">NFD</option>
                                    <option value="Regional">Regional / Super League</option>
                                    <option value="National Team">National Team</option>
                                    <option value="Womens Football">Women's Football</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={fetchRecentData} disabled={isFetchingData} className="w-full bg-gray-100 hover:bg-gray-200 border rounded-xl px-3 py-2.5 text-xs font-bold text-gray-700 flex items-center justify-center gap-2 h-10">
                                    {isFetchingData ? <Spinner className="w-3 h-3 border-2" /> : <RefreshIcon className="w-3 h-3" />}
                                    Sync Data
                                </button>
                            </div>
                        </div>

                        {activeTab === 'image' && (
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase">1. Pick Match Records (Max 8)</p>
                                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2 border rounded-2xl p-2 bg-gray-50">
                                    {rawMatches.map(m => (
                                        <div key={m.id} onClick={() => toggleMatchSelection(m.id)} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 ${selectedMatchIds.includes(m.id) ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
                                            <input type="checkbox" checked={selectedMatchIds.includes(m.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                                            <div className="flex-grow">
                                                <p className="font-bold text-xs">{m.teamA} vs {m.teamB}</p>
                                                <p className="text-[10px] text-gray-500">{m.date} &bull; {m.competition}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={generateGraphic} disabled={isGeneratingImage || selectedMatchIds.length === 0} className="w-full bg-primary text-white h-12 rounded-2xl shadow-xl font-bold">
                                    {isGeneratingImage ? <Spinner className="w-5 h-5 border-2" /> : 'Render Graphic'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div>
                    <h3 className="text-lg font-bold font-display text-gray-800 mb-4">Live Preview</h3>
                    <div className="relative border-4 border-white shadow-2xl rounded-[2rem] overflow-hidden aspect-[4/5] bg-gray-900">
                        <canvas ref={canvasRef} className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            {isRecapModalOpen && (
                <RecapGeneratorModal isOpen={isRecapModalOpen} onClose={() => setIsRecapModalOpen(false)} />
            )}
        </div>
    );
};

export default SocialMediaGenerator;
