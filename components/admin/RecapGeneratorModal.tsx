import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import Spinner from '../ui/Spinner';
import SparklesIcon from '../icons/SparklesIcon';
import FilmIcon from '../icons/FilmIcon';
import RefreshIcon from '../icons/RefreshIcon';
import { fetchAllCompetitions, fetchDirectoryEntries } from '../../services/api';
import { superNormalize, findInMap } from '../../services/utils';
import { DirectoryEntity } from '../../data/directory';
import DownloadIcon from '../icons/DownloadIcon';

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
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
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
            if (url.startsWith('data:')) {
                img.src = url;
            } else {
                img.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            }
        });
    };

    const handlePrepare = async () => {
        if (selectedCompIds.length === 0) return alert("Please select a league.");
        setLoading(true);
        setStep(2);
        setStatusText("Gathering Assets...");

        try {
            const [allCompsData, dirEntries] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries()
            ]);

            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const startTs = new Date(startDate).getTime();
            const endTs = new Date(endDate).getTime();

            const rawMatches: MatchSummary[] = [];
            selectedCompIds.forEach(compId => {
                const comp = allCompsData[compId];
                if (!comp) return;
                
                const source = mode === 'results' ? comp.results : comp.fixtures;
                if (source) {
                    source.forEach(m => {
                        const mDate = new Date(m.fullDate || m.date).getTime();
                        if (mDate >= startTs && mDate <= (endTs + 86400000)) {
                            const getCrest = (name: string) => {
                                if (!name) return undefined;
                                const dirEntry = findInMap(name, dirMap);
                                if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                                return comp.teams?.find(t => superNormalize(t.name) === superNormalize(name))?.crestUrl;
                            };

                            rawMatches.push({
                                id: String(m.id),
                                home: m.teamA, away: m.teamB,
                                scoreA: m.scoreA, scoreB: m.scoreB,
                                date: m.fullDate || m.date || '', 
                                time: m.time,
                                competition: comp.displayName || comp.name,
                                competitionLogoUrl: comp.logoUrl,
                                teamACrest: getCrest(m.teamA),
                                teamBCrest: getCrest(m.teamB),
                                venue: m.venue
                            });
                        }
                    });
                }
            });

            if (rawMatches.length === 0) {
                alert("No matches found in the selected date range.");
                setLoading(false);
                setStep(1);
                return;
            }

            setMatches(rawMatches.slice(0, 15));
            
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

    const drawMatchFrame = useCallback((match: MatchSummary) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width, H = canvas.height;
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#001E5A');
        grad.addColorStop(1, '#002B7F');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }

        if (match.competitionLogoUrl && imageCache.has(match.competitionLogoUrl)) {
             const logo = imageCache.get(match.competitionLogoUrl)!;
             const size = 150;
             ctx.drawImage(logo, (W - size)/2, 30, size, size);
        }

        ctx.fillStyle = '#FDB913';
        ctx.font = 'bold 28px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((match.competition || '').toUpperCase(), W/2, 210);

        if (match.teamACrest && imageCache.has(match.teamACrest)) {
            ctx.drawImage(imageCache.get(match.teamACrest)!, W/2 - 440, H/2 - 130, 240, 240);
        }
        if (match.teamBCrest && imageCache.has(match.teamBCrest)) {
            ctx.drawImage(imageCache.get(match.teamBCrest)!, W/2 + 200, H/2 - 130, 240, 240);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 100px "Poppins", sans-serif';
        const mainLine = mode === 'results' ? `${match.scoreA ?? 0} - ${match.scoreB ?? 0}` : match.time || '15:00';
        ctx.fillText(mainLine, W/2, H/2 + 20);

        ctx.font = 'bold 36px "Inter", sans-serif';
        ctx.fillText(match.home, W/2 - 300, H/2 + 180, 280);
        ctx.fillText(match.away, W/2 + 300, H/2 + 180, 280);

        ctx.font = '600 24px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`${match.date} • ${match.venue || 'Mavuso Centre'}`, W/2, H - 60);
    }, [imageCache, mode]);

    const handleExportVideo = async () => {
        if (!canvasRef.current || matches.length === 0) return;
        setIsExporting(true);
        
        const canvas = canvasRef.current;
        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            bitsPerSecond: 5000000 // 5Mbps
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Recap-${mode}-${new Date().toISOString().split('T')[0]}.webm`;
            a.click();
            setIsExporting(false);
            URL.revokeObjectURL(url);
        };

        mediaRecorder.start();

        // Record each match frame for 2.5 seconds
        for (let i = 0; i < matches.length; i++) {
            setCurrentFrameIndex(i);
            drawMatchFrame(matches[i]);
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        mediaRecorder.stop();
    };

    useEffect(() => {
        if (step === 3 && matches.length > 0 && !isExporting) {
            const timer = setInterval(() => {
                setCurrentFrameIndex(prev => (prev + 1) % matches.length);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [step, matches.length, isExporting]);

    useEffect(() => {
        if (step === 3 && matches[currentFrameIndex]) {
            drawMatchFrame(matches[currentFrameIndex]);
        }
    }, [step, currentFrameIndex, drawMatchFrame, matches]);

    return (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden rounded-[2rem]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600/20 p-2 rounded-xl"><SparklesIcon className="w-6 h-6 text-purple-400" /></div>
                        <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">AI Recap Studio</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => setMode('results')} className={`p-6 rounded-2xl border-2 transition-all text-left ${mode === 'results' ? 'bg-purple-600 border-purple-400 shadow-xl' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <h4 className="text-xl font-bold">Recap Results</h4>
                                </button>
                                <button onClick={() => setMode('fixtures')} className={`p-6 rounded-2xl border-2 transition-all text-left ${mode === 'fixtures' ? 'bg-purple-600 border-purple-400 shadow-xl' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                    <h4 className="text-xl font-bold">Preview Fixtures</h4>
                                </button>
                             </div>

                             <div className="grid grid-cols-2 gap-4 bg-slate-800 p-4 rounded-xl">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Start Date</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">End Date</label>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none" />
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-black uppercase text-slate-500 tracking-widest mb-3">Target Competitions</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-800 rounded-2xl border border-slate-700">
                                    {competitions.map(c => (
                                        <label key={c.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-700 transition-colors">
                                            <input type="checkbox" checked={selectedCompIds.includes(c.id)} onChange={() => setSelectedCompIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500" />
                                            <span className="text-sm font-bold truncate">{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                             </div>

                             <div className="flex justify-end pt-4">
                                <Button onClick={handlePrepare} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto px-12 h-14 text-lg font-black shadow-2xl rounded-2xl gap-2">
                                    Generate Draft <RefreshIcon className="w-5 h-5"/>
                                </Button>
                             </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="flex flex-col items-center justify-center h-[400px] animate-fade-in text-center">
                            <Spinner className="w-16 h-16 border-4 border-purple-500 mb-6" />
                            <p className="text-purple-300 font-black uppercase tracking-[0.3em]">{statusText}</p>
                         </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center animate-fade-in space-y-8">
                            <div className="w-full max-w-[700px] aspect-video relative border-8 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl bg-black">
                                <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full object-contain" />
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                                    {matches.map((_, i) => (
                                        <div key={i} className={`h-1 rounded-full transition-all ${i === currentFrameIndex ? 'w-8 bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'w-2 bg-white/20'}`}></div>
                                    ))}
                                </div>
                                {isExporting && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
                                        <Spinner className="w-12 h-12 border-white mb-4" />
                                        <p className="font-bold text-white uppercase tracking-widest animate-pulse">Encoding Video...</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pb-6">
                                <Button onClick={() => setStep(1)} disabled={isExporting} className="bg-slate-700 text-white px-8 h-12 rounded-xl font-bold">Configure</Button>
                                <Button onClick={handleExportVideo} disabled={isExporting} className="bg-purple-600 text-white px-12 font-black h-12 rounded-xl shadow-xl flex items-center gap-2">
                                    {isExporting ? <Spinner className="w-5 h-5 border-white" /> : <><FilmIcon className="w-5 h-5"/> Export Recap Video</>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default RecapGeneratorModal;