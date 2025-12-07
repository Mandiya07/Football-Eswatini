
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
import UploadIcon from '../icons/UploadIcon';
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
    competitionLogoUrl?: string;
    headline?: string;
    teamACrest?: string;
    teamBCrest?: string;
    venue?: string;
}

interface RecapGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Default fallback audio
const AUDIO_SRC = "https://cdn.pixabay.com/download/audio/2022/03/24/audio_07823f9586.mp3";

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
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [audioError, setAudioError] = useState(false);
    const [customAudioName, setCustomAudioName] = useState<string | null>(null);
    
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const audioInputRef = useRef<HTMLInputElement>(null);
    
    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const audioSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    
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

    // Cleanup on unmount or close
    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
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
                console.warn(`Failed to load image safely: ${url}. Trying direct load as fallback.`);
                const fallbackImg = new Image();
                fallbackImg.crossOrigin = "anonymous";
                fallbackImg.onload = () => resolve(fallbackImg);
                fallbackImg.onerror = () => resolve(null);
                fallbackImg.src = url;
            };
            img.src = proxyUrl;
        });
    };

    // Helper: Load Audio Buffer
    const loadAudio = async (file?: File) => {
        try {
            // Initialize AudioContext if not exists
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            let arrayBuffer: ArrayBuffer;
            
            if (file) {
                arrayBuffer = await file.arrayBuffer();
                setCustomAudioName(file.name);
            } else {
                 if (audioBufferRef.current && !customAudioName) return; // Already loaded default
                 const response = await fetch(AUDIO_SRC);
                 if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                 arrayBuffer = await response.arrayBuffer();
            }

            const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            audioBufferRef.current = decodedBuffer;
            console.log("Audio loaded successfully");
            setAudioError(false);
            setIsAudioEnabled(true);
        } catch (error) {
            console.warn("Failed to load audio.", error);
            setAudioError(true);
            setIsAudioEnabled(false);
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            loadAudio(file);
        }
    };

    const playAudio = async (destination?: MediaStreamAudioDestinationNode) => {
        if (!isAudioEnabled || !audioContextRef.current || !audioBufferRef.current || audioError) return;

        // Ensure context is running (fixes autoplay policy issues)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // Stop any existing source
        stopAudio();

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.loop = true;

        // Connect to destination (recording stream) AND local speakers (if not recording, or if monitoring)
        if (destination) {
            source.connect(destination);
        }
        
        // Always connect to speakers for monitoring
        source.connect(audioContextRef.current.destination);
        
        source.start(0);
        audioSourceNodeRef.current = source;
    };

    const stopAudio = () => {
        if (audioSourceNodeRef.current) {
            try { audioSourceNodeRef.current.stop(); } catch(e) {}
            audioSourceNodeRef.current = null;
        }
    };

    const handlePrepare = async () => {
        if (selectedCompIds.length === 0) return alert("Please select a league.");
        if (!process.env.API_KEY) return alert("API Key missing.");

        setLoading(true);
        setStatusText("Fetching match data...");
        
        // Load default audio if no custom audio set
        if (!customAudioName) {
            loadAudio();
        }

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
                                venue: m.venue,
                                competition: comp.name,
                                competitionLogoUrl: comp.logoUrl, 
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

            // 2. Generate Headlines (Kept for internal use, though hidden in UI now)
            setStatusText("Processing text...");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const processedMatches = await Promise.all(limitedMatches.map(async (match) => {
                try {
                    const prompt = `Write a short, punchy broadcast headline (max 6 words) for this match: ${match.home} vs ${match.away}, Score: ${match.scoreA}-${match.scoreB}.`;
                    const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                    const headline = result.text.trim().replace(/['"]/g, '').replace(/\*\*/g, '');
                    return { ...match, headline };
                } catch (e) {
                    return { ...match, headline: "Matchday Action" };
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
                if (m.competitionLogoUrl) imageUrls.add(m.competitionLogoUrl);
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

    // --- Canvas Drawing Helper ---

    const drawGlassRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.restore();
    };

    // Helper to wrap text and fit it within width
    const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number, x: number, y: number) => {
        ctx.font = `italic bold ${fontSize}px "Inter", sans-serif`;
        const words = text.split(' ');
        let line = '';
        let lineHeight = fontSize * 1.2;
        
        // Check if full text fits first
        if (ctx.measureText(text).width <= maxWidth) {
             ctx.fillText(text, x, y);
             return;
        }

        // If not, we might need to wrap or scale down.
        const lines: string[] = [];
        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        // Adjust Y based on number of lines to keep centered
        const totalHeight = lines.length * lineHeight;
        let startY = y - (totalHeight / 2) + (lineHeight / 2); // approximate centering

        lines.forEach(l => {
            ctx.fillText(l.trim(), x, startY);
            startY += lineHeight;
        });
    };

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
        
        // --- TOP SECTION (League Info) ---
        // Restricted to top 25% area
        const topSectionY = 20; 
        const logoH = 60; 

        // Draw League Logo if available
        if (match.competitionLogoUrl && imageCache.has(match.competitionLogoUrl)) {
             const logo = imageCache.get(match.competitionLogoUrl)!;
             const ratio = logoH / logo.height;
             const logoW = logo.width * ratio;
             
             ctx.globalAlpha = fadeIn;
             ctx.save();
             ctx.shadowColor = 'rgba(0,0,0,0.3)';
             ctx.shadowBlur = 10;
             // Draw centered at top
             ctx.drawImage(logo, (width - logoW) / 2, topSectionY + slideUp, logoW, logoH);
             ctx.restore();
        }

        // Competition Name
        ctx.globalAlpha = fadeIn;
        ctx.fillStyle = '#FDB913';
        ctx.font = 'bold 20px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        // Position below logo space
        const textStartY = match.competitionLogoUrl ? topSectionY + logoH + 20 : topSectionY + 30;
        ctx.fillText(match.competition.toUpperCase(), width / 2, textStartY + slideUp);
        
        // --- CENTER SECTION (Teams & Score) ---
        // Center of the canvas is height / 2. We position elements around there.
        // Approx 55% down the screen
        const centerY = height * 0.55; 
        const crestSize = 100; 
        const crestY = centerY - 30; // Shift crests up relative to center line

        ctx.textAlign = 'center';

        // Home Team Crest
        if (match.teamACrest && imageCache.has(match.teamACrest)) {
            const img = imageCache.get(match.teamACrest)!;
            const ratio = Math.min(crestSize/img.width, crestSize/img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 20;
            ctx.drawImage(img, (width / 4) - w/2, crestY - h/2 + slideUp, w, h);
            ctx.restore();
        } else {
            ctx.beginPath();
            ctx.arc(width / 4, crestY + slideUp, 40, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(match.home.charAt(0), width/4, crestY + 10 + slideUp);
        }
        
        // Home Team Name
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        fitText(ctx, match.home, 180, 20, width / 4, crestY + 90 + slideUp);
        ctx.shadowBlur = 0;

        // Away Team Crest
        if (match.teamBCrest && imageCache.has(match.teamBCrest)) {
            const img = imageCache.get(match.teamBCrest)!;
            const ratio = Math.min(crestSize/img.width, crestSize/img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 20;
            ctx.drawImage(img, (width * 0.75) - w/2, crestY - h/2 + slideUp, w, h);
            ctx.restore();
        } else {
             ctx.beginPath();
            ctx.arc(width * 0.75, crestY + slideUp, 40, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 30px Arial';
            ctx.fillText(match.away.charAt(0), width * 0.75, crestY + 10 + slideUp);
        }

        // Away Team Name
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        fitText(ctx, match.away, 180, 20, width * 0.75, crestY + 90 + slideUp);
        ctx.shadowBlur = 0;


        // --- SCORE BOARD (GLASSY) ---
        const scoreBoxW = 160;
        const scoreBoxH = 80;
        // Draw Glass Background for Score in visual center between crests
        drawGlassRect(ctx, (width - scoreBoxW)/2, crestY - scoreBoxH/2 + slideUp, scoreBoxW, scoreBoxH, 20);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px "Poppins", sans-serif';
        const centerText = mode === 'results' ? `${match.scoreA}-${match.scoreB}` : (match.time || 'VS');
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        // Center text vertically in scorebox
        ctx.fillText(centerText, width/2, crestY + 18 + slideUp);
        ctx.shadowBlur = 0;


        // --- INFO PILL (Date/Venue/Time) ---
        // Moved to bottom area (bottom 25%)
        const infoY = height - 90; 
        const infoBoxW = 450;
        const infoBoxH = 45;
        
        drawGlassRect(ctx, (width - infoBoxW)/2, infoY, infoBoxW, infoBoxH, 22);
        
        ctx.fillStyle = '#FFDD57'; // Gold-ish
        ctx.font = '600 15px "Inter", sans-serif';
        
        const infoParts = [];
        if (match.date) infoParts.push(match.date);
        if (match.time) infoParts.push(match.time); // Always show time if available
        if (match.venue) infoParts.push(match.venue);
        
        ctx.fillText(infoParts.join('  •  '), width/2, infoY + 28);

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
        
        // IMPORTANT: Resume audio context on user gesture
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // Reset
        setCurrentMatchIndex(0);
        setProgress(0);
        startTimeRef.current = 0;
        
        let audioDest: MediaStreamAudioDestinationNode | undefined = undefined;

        if (record) {
            try {
                // Video Stream
                const canvasStream = (canvasRef.current as any)?.captureStream(30);
                if (!canvasStream) throw new Error("Canvas stream capture failed");
                const tracks = [...canvasStream.getVideoTracks()];

                // Audio Stream using Web Audio API
                if (isAudioEnabled && !audioError && audioContextRef.current) {
                    audioDest = audioContextRef.current.createMediaStreamDestination();
                    // Connect audio source to this destination
                    playAudio(audioDest);
                    tracks.push(...audioDest.stream.getAudioTracks());
                } else {
                     playAudio(); // Just play locally if not recording audio or disabled
                }
                
                const combinedStream = new MediaStream(tracks);
                const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9' });
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
                    stopAudio();
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
            playAudio();
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    const stopPlayback = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (isRecording) stopRecording();
        setIsPlaying(false);
        stopAudio();
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
                            <div className="flex gap-4 items-center w-full justify-center flex-wrap bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <Button onClick={() => { stopPlayback(); setStep(1); }} className="bg-gray-700 hover:bg-gray-600 text-white px-4">
                                    Back
                                </Button>
                                
                                {/* Audio Controls */}
                                <div className="flex items-center gap-2 border-l border-r border-gray-600 px-4 mx-2">
                                    <button 
                                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition-colors text-sm ${isAudioEnabled && !audioError ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                        disabled={isRecording || isPlaying || audioError}
                                        title={audioError ? "Audio Failed" : "Toggle Music"}
                                    >
                                        <RadioIcon className="w-4 h-4" /> {isAudioEnabled ? 'ON' : 'OFF'}
                                    </button>
                                    
                                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors">
                                        <UploadIcon className="w-4 h-4" />
                                        <span>{customAudioName ? 'Change Music' : 'Upload Music'}</span>
                                        <input 
                                            type="file" 
                                            accept="audio/*" 
                                            className="hidden" 
                                            ref={audioInputRef}
                                            onChange={handleAudioUpload}
                                        />
                                    </label>
                                    {customAudioName && <span className="text-xs text-green-400 truncate max-w-[100px]" title={customAudioName}>{customAudioName}</span>}
                                </div>

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
                            <p className="text-xs text-gray-500 mt-4 max-w-md text-center">
                                Note: Audio recording relies on browser capabilities. If you hear silence in the exported video, ensure your system audio is not muted.
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default RecapGeneratorModal;
