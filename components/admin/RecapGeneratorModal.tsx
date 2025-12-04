
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import Spinner from '../ui/Spinner';
import SparklesIcon from '../icons/SparklesIcon';
import PlayIcon from '../icons/PlayIcon';
import FilmIcon from '../icons/FilmIcon';
import RadioIcon from '../icons/RadioIcon';
import { fetchAllCompetitions } from '../../services/api';

interface MatchSummary {
    id: string;
    home: string;
    away: string;
    scoreA?: number;
    scoreB?: number;
    date: string;
    time?: string;
    competition: string;
    headline?: string;
    teamACrest?: string;
    teamBCrest?: string;
}

interface RecapGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Royalty-free sports intro music placeholder
const AUDIO_SRC = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_07424301e9.mp3?filename=news-room-news-19931.mp3";

const RecapGeneratorModal: React.FC<RecapGeneratorModalProps> = ({ isOpen, onClose }) => {
    // Configuration State
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Config, 2: Loading Assets, 3: Studio
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompIds, setSelectedCompIds] = useState<string[]>([]);
    const [days, setDays] = useState(7);
    const [mode, setMode] = useState<'results' | 'fixtures'>('results');
    
    // Data State
    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState('');
    
    // Assets State
    const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map());
    const [assetsLoaded, setAssetsLoaded] = useState(false);

    // Playback State
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    
    // Load Competitions
    useEffect(() => {
        const loadComps = async () => {
            const all = await fetchAllCompetitions();
            const list = Object.entries(all).map(([id, c]) => ({ id, name: c.name }));
            setCompetitions(list);
            if (list.length > 0) setSelectedCompIds([list[0].id]);
        };
        loadComps();
    }, []);

    const toggleComp = (id: string) => {
        setSelectedCompIds(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    // Helper: Load an image safely (handling CORS)
    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            // CORS Proxy to prevent canvas tainting
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            img.crossOrigin = "anonymous"; 
            
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Failed to load image safely: ${url}. Trying direct load as fallback (might taint canvas).`);
                // If proxy fails, try direct. Note: This might still taint canvas if headers are missing.
                const fallbackImg = new Image();
                fallbackImg.crossOrigin = "anonymous";
                fallbackImg.onload = () => resolve(fallbackImg);
                fallbackImg.onerror = () => resolve(null); // Give up
                fallbackImg.src = url;
            };
            img.src = proxyUrl;
        });
    };

    const handlePrepare = async () => {
        if (selectedCompIds.length === 0) return alert("Please select a league.");
        if (!process.env.API_KEY) return alert("API Key missing.");

        setLoading(true);
        setStatusText("Fetching match data...");
        
        try {
            const allCompsData = await fetchAllCompetitions();
            const rawMatches: MatchSummary[] = [];
            const today = new Date();
            const cutoffDate = new Date();
            
            if (mode === 'results') cutoffDate.setDate(today.getDate() - days);
            else cutoffDate.setDate(today.getDate() + days);

            // 1. Gather Data
            selectedCompIds.forEach(compId => {
                const comp = allCompsData[compId];
                const source = mode === 'results' ? comp.results : comp.fixtures;
                const teamMap = new Map(comp.teams?.map(t => [t.name, t.crestUrl]));

                if (source) {
                    source.forEach(m => {
                        const mDate = new Date(m.fullDate || '');
                        let include = false;
                        if (mode === 'results') {
                            if (mDate >= cutoffDate && mDate <= today) include = true;
                        } else {
                            if (mDate >= today && mDate <= cutoffDate) include = true;
                        }

                        if (include) {
                            rawMatches.push({
                                id: String(m.id),
                                home: m.teamA,
                                away: m.teamB,
                                scoreA: m.scoreA,
                                scoreB: m.scoreB,
                                date: m.fullDate || '',
                                time: m.time,
                                competition: comp.name,
                                teamACrest: teamMap.get(m.teamA),
                                teamBCrest: teamMap.get(m.teamB)
                            });
                        }
                    });
                }
            });

            rawMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const limitedMatches = mode === 'results' ? rawMatches.slice(-10).reverse() : rawMatches.slice(0, 10);

            if (limitedMatches.length === 0) {
                setLoading(false);
                return alert("No matches found for criteria.");
            }

            // 2. Generate Headlines
            setStatusText("Generating AI headlines...");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const processedMatches = await Promise.all(limitedMatches.map(async (match) => {
                try {
                    const prompt = `Write a short, punchy 3-5 word headline for: ${match.home} ${match.scoreA ?? ''}-${match.scoreB ?? ''} ${match.away} (${match.competition}).`;
                    const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                    return { ...match, headline: result.text.trim().replace(/['"]/g, '') };
                } catch (e) {
                    return { ...match, headline: `${match.home} vs ${match.away}` };
                }
            }));

            setMatches(processedMatches);
            setStep(2); // Move to Asset Loading
            
            // 3. Load Assets
            setStatusText("Loading visual assets...");
            const cache = new Map<string, HTMLImageElement>();
            const imageUrls = new Set<string>();
            
            processedMatches.forEach(m => {
                if (m.teamACrest) imageUrls.add(m.teamACrest);
                if (m.teamBCrest) imageUrls.add(m.teamBCrest);
            });

            const promises = Array.from(imageUrls).map(async url => {
                const img = await loadImage(url);
                if (img) cache.set(url, img);
            });

            await Promise.all(promises);
            setImageCache(cache);
            setAssetsLoaded(true);
            
            setLoading(false);
            setStep(3); // Enter Studio

        } catch (e) {
            console.error(e);
            alert("Error preparing recap.");
            setLoading(false);
            setStep(1);
        }
    };

    // --- Canvas Drawing ---

    const drawMatchFrame = (match: MatchSummary, progress: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // 1. Dynamic Background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        // Shift gradient based on progress for animation effect
        gradient.addColorStop(0, '#001e5a');
        gradient.addColorStop(0.5 + (progress * 0.1), '#002B7F');
        gradient.addColorStop(1, '#1a4a9f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Animated Pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 3;
        const offset = progress * 100;
        for(let i = -200; i < width + 200; i+= 60) {
            ctx.beginPath();
            ctx.moveTo(i + offset, 0);
            ctx.lineTo(i - 150 + offset, height);
            ctx.stroke();
        }
        ctx.restore();

        // 2. Animations
        const fadeIn = Math.min(1, progress * 4); 
        const slideUp = (1 - fadeIn) * 30;
        
        // Competition & Date
        ctx.globalAlpha = fadeIn;
        ctx.fillStyle = '#FDB913';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(match.competition.toUpperCase(), width / 2, 60 + slideUp);
        
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '18px Arial';
        ctx.fillText(match.date, width / 2, 90 + slideUp);

        const centerY = height / 2;
        const crestSize = 140;
        const crestY = centerY - 40;

        // Home Team
        ctx.textAlign = 'center';
        if (match.teamACrest && imageCache.has(match.teamACrest)) {
            const img = imageCache.get(match.teamACrest)!;
            const ratio = Math.min(crestSize/img.width, crestSize/img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 15;
            ctx.drawImage(img, (width / 4) - w/2, crestY - h/2 + slideUp, w, h);
            ctx.restore();
        } else {
            // Fallback circle if image failed
            ctx.beginPath();
            ctx.arc(width / 4, crestY + slideUp, 50, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(match.home.charAt(0), width/4, crestY + 15 + slideUp);
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        let homeName = match.home;
        if (homeName.length > 15) homeName = homeName.substring(0, 13) + '..';
        ctx.fillText(homeName, width / 4, crestY + 100 + slideUp);

        // Away Team
        if (match.teamBCrest && imageCache.has(match.teamBCrest)) {
            const img = imageCache.get(match.teamBCrest)!;
            const ratio = Math.min(crestSize/img.width, crestSize/img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 15;
            ctx.drawImage(img, (width * 0.75) - w/2, crestY - h/2 + slideUp, w, h);
            ctx.restore();
        } else {
             ctx.beginPath();
            ctx.arc(width * 0.75, crestY + slideUp, 50, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 40px Arial';
            ctx.fillText(match.away.charAt(0), width * 0.75, crestY + 15 + slideUp);
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        let awayName = match.away;
        if (awayName.length > 15) awayName = awayName.substring(0, 13) + '..';
        ctx.fillText(awayName, width * 0.75, crestY + 100 + slideUp);

        // Score / VS
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.fillRect(width/2 - 70, crestY - 35, 140, 70);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Arial';
        const centerText = mode === 'results' ? `${match.scoreA}-${match.scoreB}` : (match.time || 'VS');
        ctx.fillText(centerText, width/2, crestY + 15);

        // Headline
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'italic bold 32px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        const headline = match.headline || '';
        // wrap text slightly if long
        if (ctx.measureText(headline).width > width - 40) {
             ctx.font = 'italic bold 24px Arial';
        }
        ctx.fillText(headline, width / 2, height - 60 - slideUp);
        ctx.shadowBlur = 0;

        // Branding Footer
        ctx.fillStyle = '#D22730';
        ctx.fillRect(0, height - 10, width, 10);
        
        // Progress Bar (Yellow)
        ctx.fillStyle = '#FDB913';
        ctx.fillRect(0, height - 10, width * progress, 10);
        
        ctx.globalAlpha = 1;
    };

    // --- Animation Loop ---

    const DURATION_PER_SLIDE = 4000; // 4 seconds per match

    const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        
        const totalDuration = DURATION_PER_SLIDE * matches.length;
        const globalProgress = elapsed / totalDuration;
        
        // Determine current slide
        const slideIndex = Math.floor(elapsed / DURATION_PER_SLIDE);
        const slideProgress = (elapsed % DURATION_PER_SLIDE) / DURATION_PER_SLIDE;

        if (slideIndex >= matches.length) {
            // End of sequence
            if (isRecording) {
                stopRecording();
                return;
            } else {
                // Loop for playback
                startTimeRef.current = timestamp;
                requestRef.current = requestAnimationFrame(animate);
                return;
            }
        }

        setCurrentMatchIndex(slideIndex);
        setProgress(globalProgress);

        if (matches[slideIndex]) {
            drawMatchFrame(matches[slideIndex], slideProgress);
        }
        
        requestRef.current = requestAnimationFrame(animate);
    };

    const startPlayback = async (record: boolean = false) => {
        if (isRecording || isPlaying) return;
        
        // Reset
        setCurrentMatchIndex(0);
        setProgress(0);
        startTimeRef.current = 0;

        // Audio Handling
        if (isAudioEnabled && audioRef.current) {
            try {
                audioRef.current.currentTime = 0;
                await audioRef.current.play();
            } catch (e) {
                console.warn("Audio play failed (likely needs interaction first)", e);
            }
        }
        
        if (record) {
            try {
                // Video Stream
                const canvasStream = (canvasRef.current as any)?.captureStream(30);
                if (!canvasStream) throw new Error("Canvas stream capture failed");
                
                const tracks = [...canvasStream.getVideoTracks()];

                // Audio Stream (Try to capture from audio element if supported)
                if (isAudioEnabled && audioRef.current) {
                    // Note: captureStream on media elements is not supported in all browsers (mostly Chrome/Edge)
                    // @ts-ignore
                    if (audioRef.current.captureStream) {
                        // @ts-ignore
                        const audioStream = audioRef.current.captureStream();
                        tracks.push(...audioStream.getAudioTracks());
                    } else if (typeof (audioRef.current as any).mozCaptureStream === 'function') {
                         // Firefox
                         // @ts-ignore
                         const audioStream = (audioRef.current as any).mozCaptureStream();
                         tracks.push(...audioStream.getAudioTracks());
                    } else {
                         console.warn("Browser does not support audio element capture. Video will be silent.");
                         alert("Recording with audio is not fully supported in this browser. Video may be silent.");
                    }
                }
                
                const combinedStream = new MediaStream(tracks);
                const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
                mediaRecorderRef.current = recorder;
                chunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fe-recap-${mode}-${Date.now()}.webm`;
                    a.click();
                    setIsRecording(false);
                    setIsPlaying(false);
                    // Stop audio on record stop
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                    }
                };

                recorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error(err);
                alert("Recording failed. Your browser might not support canvas recording.");
                return;
            }
        } else {
            setIsPlaying(true);
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    const stopPlayback = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (isRecording) stopRecording();
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };
    
    // Initial Draw on Step 3
    useEffect(() => {
        if (step === 3 && matches.length > 0) {
            drawMatchFrame(matches[0], 0);
        }
    }, [step, matches, assetsLoaded]);

    // Stop audio if modal closed
    useEffect(() => {
        if (!isOpen) stopPlayback();
    }, [isOpen]);


    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-4xl bg-gray-900 border-gray-700 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-1.5 rounded-lg"><SparklesIcon className="w-5 h-5 text-white" /></div>
                        <h2 className="text-lg font-bold font-display">AI Recap Studio</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    {step === 1 && (
                         <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block font-bold text-gray-300 mb-2">1. Select Leagues</label>
                                    <div className="bg-gray-800 p-2 rounded border border-gray-600 max-h-60 overflow-y-auto">
                                        {competitions.map(comp => (
                                            <label key={comp.id} className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                                                <input type="checkbox" checked={selectedCompIds.includes(comp.id)} onChange={() => toggleComp(comp.id)} className="h-4 w-4 rounded bg-gray-700 border-gray-500 text-purple-600 focus:ring-purple-500" />
                                                <span className="text-sm">{comp.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block font-bold text-gray-300 mb-2">2. Mode</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setMode('results')} className={`flex-1 py-2 rounded text-sm font-bold ${mode === 'results' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Past Results</button>
                                            <button onClick={() => setMode('fixtures')} className={`flex-1 py-2 rounded text-sm font-bold ${mode === 'fixtures' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Upcoming Fixtures</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-300 mb-2">3. Range ({days} Days)</label>
                                        <input type="range" min="1" max="14" value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-gray-700">
                                <Button onClick={handlePrepare} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-12 text-lg shadow-lg transform hover:scale-105 transition-transform">
                                    {loading ? <div className="flex items-center gap-2"><Spinner className="w-5 h-5 border-2"/> {statusText}</div> : 'Generate Recap'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
                            <Spinner className="w-12 h-12 border-4 border-purple-500" />
                            <p className="mt-4 text-lg font-bold text-purple-300">{statusText}</p>
                            <p className="text-gray-400 text-sm mt-2">Analyzing matches & loading assets...</p>
                         </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center animate-fade-in">
                            {/* Audio Element */}
                            <audio ref={audioRef} src={AUDIO_SRC} loop crossOrigin="anonymous" />

                            {/* Monitor */}
                            <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-gray-700 bg-black mb-6 w-full max-w-[600px] aspect-video">
                                <canvas ref={canvasRef} width={800} height={450} className="w-full h-full object-contain" />
                                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded text-[10px] font-bold animate-pulse flex items-center gap-2">
                                    <div className="w-2 h-2 bg-white rounded-full"></div> LIVE MONITOR
                                </div>
                                {isRecording && (
                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white px-3 py-1 rounded text-[10px] font-mono border border-red-500/50">
                                        REC {Math.round(progress * 100)}%
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex gap-4 items-center w-full justify-center flex-wrap">
                                <Button onClick={() => { stopPlayback(); setStep(1); }} className="bg-gray-700 hover:bg-gray-600 text-white px-4">
                                    Back
                                </Button>
                                
                                {/* Audio Toggle */}
                                <button 
                                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded font-bold transition-colors ${isAudioEnabled ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    disabled={isRecording || isPlaying}
                                    title="Toggle Background Music"
                                >
                                    <RadioIcon className="w-5 h-5" /> {isAudioEnabled ? 'Music ON' : 'Music OFF'}
                                </button>

                                {!isPlaying && !isRecording ? (
                                    <Button onClick={() => startPlayback(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex items-center gap-2">
                                        <PlayIcon className="w-5 h-5" /> Preview
                                    </Button>
                                ) : (
                                    <Button onClick={stopPlayback} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6">
                                        Stop
                                    </Button>
                                )}
                                
                                <Button 
                                    onClick={() => startPlayback(true)} 
                                    disabled={isRecording || isPlaying} 
                                    className={`px-6 flex items-center gap-2 ${isRecording ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                >
                                    {isRecording ? <Spinner className="w-4 h-4 border-2"/> : <FilmIcon className="w-5 h-5" />} 
                                    {isRecording ? 'Recording...' : 'Record Video'}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-6 max-w-md text-center">
                                Note: To prevent security errors, some images may not appear in the recorded video if the source website blocks access. 
                                Audio recording requires browser support (best in Chrome/Edge).
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default RecapGeneratorModal;
