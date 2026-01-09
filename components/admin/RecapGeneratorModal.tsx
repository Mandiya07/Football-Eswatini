
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import Spinner from '../ui/Spinner';
import SparklesIcon from '../icons/SparklesIcon';
import FilmIcon from '../icons/FilmIcon';
import RefreshIcon from '../icons/RefreshIcon';
import MusicIcon from '../icons/RadioIcon'; 
import { fetchAllCompetitions, fetchDirectoryEntries } from '../../services/api';
import { superNormalize, findInMap } from '../../services/utils';
import { DirectoryEntity } from '../../data/directory';

interface MatchSummary {
    id: string;
    home: string;
    away: string;
    scoreA?: number;
    scoreB?: number;
    date: string;
    time?: string;
    competition: string;
    competitionLogoUrl?: string;
    teamACrest?: string;
    teamBCrest?: string;
    venue?: string;
}

interface RecapGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RecapGeneratorModal: React.FC<RecapGeneratorModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
    const [mode, setMode] = useState<'results' | 'fixtures'>('results');
    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const loadComps = async () => {
            const all = await fetchAllCompetitions();
            const list = Object.entries(all)
                .map(([id, c]) => ({ id, name: c.name }))
                .sort((a, b) => a.name.localeCompare(b.name));
            setCompetitions(list);
            if (list.length > 0) setSelectedCompIds([list[0].id]);
        };
        loadComps();
    }, []);

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            if (!url) return resolve(null);
            const img = new Image();
            img.crossOrigin = "anonymous"; 
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            // Detecting Base64 strings to bypass proxy
            if (url.startsWith('data:')) {
                img.src = url;
            } else {
                img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            }
        });
    };

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handlePrepare = async () => {
        if (selectedCompIds.length === 0) return alert("Please select a league.");
        setLoading(true);
        setStep(2);
        setStatusText("Gathering Assets from Repository...");

        try {
            const [allCompsData, dirEntries] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries()
            ]);

            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const rawMatches: MatchSummary[] = [];
            selectedCompIds.forEach(compId => {
                const comp = allCompsData[compId];
                if (!comp) return;
                
                const source = mode === 'results' ? comp.results : comp.fixtures;
                if (source) {
                    source.forEach(m => {
                        const getCrest = (name: string) => {
                            if (!name) return undefined;
                            // Priority: Directory (High-Res from Logos & Crests Page)
                            const dirEntry = findInMap(name, dirMap);
                            if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                            // Fallback: Team list within competition
                            return comp.teams?.find(t => superNormalize(t.name) === superNormalize(name))?.crestUrl;
                        };

                        rawMatches.push({
                            id: String(m.id),
                            home: m.teamA, away: m.teamB,
                            scoreA: m.scoreA, scoreB: m.scoreB,
                            date: m.fullDate || m.date || '', time: m.time,
                            competition: comp.displayName || comp.name,
                            competitionLogoUrl: comp.logoUrl,
                            teamACrest: getCrest(m.teamA),
                            teamBCrest: getCrest(m.teamB),
                            venue: m.venue
                        });
                    });
                }
            });

            setMatches(rawMatches.slice(0, 10));
            
            const cache = new Map<string, HTMLImageElement>();
            const imageUrls = new Set<string>();
            rawMatches.forEach(m => {
                if (m.teamACrest) imageUrls.add(m.teamACrest);
                if (m.teamBCrest) imageUrls.add(m.teamBCrest);
                if (m.competitionLogoUrl) imageUrls.add(m.competitionLogoUrl);
            });

            await Promise.all(Array.from(imageUrls).map(async url => {
                const img = await loadImage(url);
                if (img) cache.set(url, img);
            }));

            setImageCache(cache);
            setLoading(false);
            setStep(3);
        } catch (e) {
            console.error(e);
            setLoading(false);
            setStep(1);
        }
    };

    const drawMatchFrame = (match: MatchSummary) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width, H = canvas.height;
        
        // Background Gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#001E5A');
        grad.addColorStop(1, '#002B7F');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Grid overlay
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }

        // Header: Competition Logo
        if (match.competitionLogoUrl && imageCache.has(match.competitionLogoUrl)) {
             const logo = imageCache.get(match.competitionLogoUrl)!;
             const size = 150;
             ctx.drawImage(logo, (W - size)/2, 30, size, size);
        }

        ctx.fillStyle = '#FDB913';
        ctx.font = 'bold 28px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((match.competition || '').toUpperCase(), W/2, 210);

        // Team Crests (Large)
        if (match.teamACrest && imageCache.has(match.teamACrest)) {
            ctx.drawImage(imageCache.get(match.teamACrest)!, W/2 - 340, H/2 - 130, 240, 240);
        }
        if (match.teamBCrest && imageCache.has(match.teamBCrest)) {
            ctx.drawImage(imageCache.get(match.teamBCrest)!, W/2 + 100, H/2 - 130, 240, 240);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 100px "Poppins", sans-serif';
        const resultLine = mode === 'results' ? `${match.scoreA ?? 0} - ${match.scoreB ?? 0}` : 'VS';
        ctx.fillText(resultLine, W/2, H/2 + 20);

        ctx.font = 'bold 42px "Inter", sans-serif';
        ctx.fillText(match.home.toUpperCase(), W/2 - 220, H/2 + 180);
        ctx.fillText(match.away.toUpperCase(), W/2 + 220, H/2 + 180);

        ctx.font = '600 24px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`${match.date} • ${match.venue || 'Mavuso Sports Centre'}`, W/2, H - 60);
    };

    useEffect(() => {
        if (step === 3 && matches.length > 0) drawMatchFrame(matches[0]);
    }, [step, matches]);

    return (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 p-2 rounded-xl"><SparklesIcon className="w-6 h-6 text-purple-400" /></div>
                        <h2 className="text-xl font-black font-display uppercase tracking-tight">AI Recap Studio</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => setMode('results')} className={`p-6 rounded-2xl border-2 transition-all text-left ${mode === 'results' ? 'bg-purple-600 border-purple-400 shadow-xl' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Type</p>
                                    <h4 className="text-xl font-bold">Match Results</h4>
                                </button>
                                <button onClick={() => setMode('fixtures')} className={`p-6 rounded-2xl border-2 transition-all text-left ${mode === 'fixtures' ? 'bg-purple-600 border-purple-400 shadow-xl' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Type</p>
                                    <h4 className="text-xl font-bold">Upcoming Fixtures</h4>
                                </button>
                             </div>

                             <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-3">Target Competitions</label>
                                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 bg-slate-800 rounded-2xl border border-slate-700 custom-scrollbar">
                                    {competitions.map(c => (
                                        <label key={c.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors">
                                            <input type="checkbox" checked={selectedCompIds.includes(c.id)} onChange={() => setSelectedCompIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500" />
                                            <span className="text-sm font-bold truncate">{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-3">Background Music (Optional)</label>
                                <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <MusicIcon className="w-6 h-6 text-purple-400" />
                                    <input type="file" accept="audio/*" onChange={handleAudioChange} className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" />
                                    {audioFile && <span className="text-xs text-green-400 font-bold">{audioFile.name}</span>}
                                </div>
                             </div>

                             <div className="flex justify-end pt-4">
                                <Button onClick={handlePrepare} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto px-12 h-14 text-lg font-black shadow-2xl rounded-2xl gap-2">
                                    Continue <RefreshIcon className="w-5 h-5"/>
                                </Button>
                             </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="flex flex-col items-center justify-center h-[400px] animate-fade-in text-center">
                            <div className="relative mb-6">
                                <Spinner className="w-20 h-20 border-4 border-purple-500" />
                                <SparklesIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-400 animate-pulse" />
                            </div>
                            <p className="text-purple-300 font-black uppercase tracking-[0.3em]">{statusText}</p>
                            <p className="text-slate-500 text-sm mt-4">Sourcing high-res logos from Repository & Directory...</p>
                         </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center animate-fade-in">
                            <div className="relative border-8 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black w-full max-w-[800px] aspect-video">
                                <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                                <Button onClick={() => setStep(1)} className="bg-slate-700 text-white px-8 h-12 rounded-xl font-bold">Back to Configuration</Button>
                                <Button className="bg-purple-600 text-white px-12 font-black h-12 rounded-xl shadow-xl flex items-center gap-2">
                                    <FilmIcon className="w-5 h-5"/> Export High-Res MP4
                                </Button>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-[800px]">
                                <Card className="bg-slate-800 border-slate-700 p-4">
                                    <p className="text-xs font-black uppercase text-purple-400 mb-2">Visual Fidelity</p>
                                    <p className="text-sm">Using Directory vector crests for edge-to-edge sharpness.</p>
                                </Card>
                                <Card className="bg-slate-800 border-slate-700 p-4">
                                    <p className="text-xs font-black uppercase text-purple-400 mb-2">Dynamic Branding</p>
                                    <p className="text-sm">League identifiers merged with match metadata.</p>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default RecapGeneratorModal;
