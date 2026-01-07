
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import Spinner from '../ui/Spinner';
import SparklesIcon from '../icons/SparklesIcon';
import PlayIcon from '../icons/PlayIcon';
import FilmIcon from '../icons/FilmIcon';
import RadioIcon from '../icons/RadioIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { fetchAllCompetitions, addVideo, handleFirestoreError, fetchDirectoryEntries } from '../../services/api';
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
    const [days, setDays] = useState(7);
    const [mode, setMode] = useState<'results' | 'fixtures'>('results');
    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const loadComps = async () => {
            const all = await fetchAllCompetitions();
            const list = Object.entries(all).map(([id, c]) => ({ id, name: c.name }));
            setCompetitions(list);
            if (list.length > 0) setSelectedCompIds([list[0].id]);
        };
        loadComps();
    }, []);

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous"; 
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        });
    };

    const handlePrepare = async () => {
        if (selectedCompIds.length === 0) return alert("Please select a league.");
        setLoading(true);
        setStatusText("Gathering Directory Assets...");

        try {
            const [allCompsData, dirEntries] = await Promise.all([
                fetchAllCompetitions(),
                fetchDirectoryEntries()
            ]);

            // Construct Directory map with consistent normalization
            const dirMap = new Map<string, DirectoryEntity>();
            dirEntries.forEach(e => {
                if (e.name) dirMap.set(superNormalize(e.name), e);
            });

            const rawMatches: MatchSummary[] = [];
            const cutoffDate = new Date();
            cutoffDate.setDate(new Date().getDate() - days);

            selectedCompIds.forEach(compId => {
                const comp = allCompsData[compId];
                const source = mode === 'results' ? comp.results : comp.fixtures;
                if (source) {
                    source.forEach(m => {
                        const getCrest = (name: string) => {
                            if (!name) return undefined;
                            // PRIMARY: Directory priority (fuzzy matched)
                            const dirEntry = dirMap.get(superNormalize(name));
                            if (dirEntry?.crestUrl) return dirEntry.crestUrl;
                            // SECONDARY: Local team data
                            return comp.teams?.find(t => superNormalize(t.name) === superNormalize(name))?.crestUrl;
                        };

                        rawMatches.push({
                            id: String(m.id),
                            home: m.teamA, away: m.teamB,
                            scoreA: m.scoreA, scoreB: m.scoreB,
                            date: m.fullDate || m.date || '', time: m.time,
                            competition: comp.name,
                            competitionLogoUrl: comp.logoUrl,
                            teamACrest: getCrest(m.teamA),
                            teamBCrest: getCrest(m.teamB)
                        });
                    });
                }
            });

            setMatches(rawMatches.slice(0, 10));
            setStep(2);
            
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
        ctx.fillStyle = '#002B7F';
        ctx.fillRect(0, 0, W, H);

        // Render League Logo at Top
        if (match.competitionLogoUrl && imageCache.has(match.competitionLogoUrl)) {
             const logo = imageCache.get(match.competitionLogoUrl)!;
             const size = 120;
             ctx.drawImage(logo, (W - size)/2, 40, size, size);
        }

        ctx.fillStyle = '#FDB913';
        ctx.font = 'bold 24px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(match.competition.toUpperCase(), W/2, 185);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px "Poppins", sans-serif';
        const centerLine = `${match.home}  ${match.scoreA ?? ''} - ${match.scoreB ?? ''}  ${match.away}`;
        ctx.fillText(centerLine, W/2, H/2 + 20);

        ctx.font = 'normal 18px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(`${match.date} • ${match.venue || 'Match Center'}`, W/2, H - 40);
    };

    useEffect(() => {
        if (step === 3 && matches.length > 0) drawMatchFrame(matches[0]);
    }, [step, matches]);

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl bg-gray-900 border-gray-700 text-white shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-bold font-display uppercase tracking-tight">AI Recap Studio</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-800 rounded-xl border border-gray-700">
                                {competitions.map(c => (
                                    <label key={c.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                                        <input type="checkbox" checked={selectedCompIds.includes(c.id)} onChange={() => setSelectedCompIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="h-5 w-5 rounded text-primary" />
                                        <span className="text-sm font-semibold">{c.name}</span>
                                    </label>
                                ))}
                             </div>
                             <div className="flex justify-end">
                                <Button onClick={handlePrepare} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto px-10 h-12 font-bold shadow-lg">Start Data Sync</Button>
                             </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                            <Spinner className="w-12 h-12 border-4 border-purple-500 mb-4" />
                            <p className="text-purple-300 font-bold uppercase tracking-widest">{statusText}</p>
                         </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center animate-fade-in">
                            <div className="relative border-4 border-gray-700 rounded-2xl overflow-hidden shadow-2xl bg-black w-full max-w-[700px] aspect-video">
                                <canvas ref={canvasRef} width={800} height={450} className="w-full h-full object-contain" />
                            </div>
                            <div className="mt-6 flex gap-4">
                                <Button onClick={() => setStep(1)} className="bg-gray-700 text-white px-6">Reset</Button>
                                <Button className="bg-red-600 text-white px-10 font-bold flex items-center gap-2">
                                    <FilmIcon className="w-5 h-5"/> Render MP4
                                </Button>
                            </div>
                            <p className="mt-4 text-xs text-gray-500">Assets sourced from central Logos & Crests repository.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default RecapGeneratorModal;
