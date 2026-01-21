
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import RadioIcon from './icons/RadioIcon';
import Spinner from './ui/Spinner';
import XCircleIcon from './icons/XCircleIcon';
import MicIcon from './icons/MicIcon';
import SparklesIcon from './icons/SparklesIcon';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AIAgentPage: React.FC = () => {
    const { user, isLoggedIn } = useAuth();
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
    const [transcription, setTranscription] = useState<string[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    
    // Live API refs
    const sessionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    if (!isLoggedIn) return <Navigate to="/" replace />;

    const stopSession = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        setStatus('idle');
    }, []);

    const startSession = async () => {
        if (!process.env.API_KEY) return alert("API Key Missing");
        
        setStatus('connecting');
        setTranscription(["[System] Establishing secure encrypted voice link..."]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputNode = audioContextRef.current.createGain();
            outputNode.connect(audioContextRef.current.destination);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('listening');
                        setTranscription(prev => [...prev, "[Agent] Connection secure. How can I assist you with Eswatini football analytics today?"]);
                        
                        // Handle Input
                        const source = audioContextRef.current!.createMediaStreamSource(stream);
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
                            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            setTranscription(prev => [...prev, `[Agent] ${message.serverContent?.outputTranscription?.text}`]);
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            setStatus('speaking');
                            const binaryString = atob(audioData);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                            
                            const dataInt16 = new Int16Array(bytes.buffer);
                            const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = buffer;
                            source.connect(outputNode);
                            
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            
                            sourcesRef.current.add(source);
                            source.onended = () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) setStatus('listening');
                            };
                        }
                    },
                    onerror: (e) => {
                        console.error(e);
                        setStatus('error');
                    },
                    onclose: () => setStatus('idle')
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `You are the Football Eswatini Scout Assistant. 
                    You help users analyze match results, find player stats, and discuss league standings. 
                    Be professional, data-driven, and supportive of local Eswatini football. 
                    If asked about specific teams, reference the current high-performance standards of the MTN Premier League.`
                }
            });

            sessionRef.current = await sessionPromise;
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <div className="bg-slate-950 min-h-screen py-12 px-4 flex flex-col items-center justify-center text-white">
            <div className="max-w-2xl w-full space-y-10 animate-fade-in">
                <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-indigo-600 rounded-[2rem] shadow-2xl animate-float">
                        <RadioIcon className={`w-16 h-16 ${status === 'listening' ? 'text-accent animate-pulse' : 'text-white'}`} />
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tighter uppercase">Elite Voice Scout</h1>
                    <p className="text-gray-400 font-medium">Real-time hands-free football analysis powered by Gemini Live.</p>
                </div>

                <Card className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden min-h-[300px] flex flex-col">
                    <CardContent className="p-8 flex flex-col h-full flex-grow">
                        <div className="flex-grow space-y-4 max-h-[250px] overflow-y-auto no-scrollbar">
                            {transcription.map((t, i) => (
                                <p key={i} className={`text-sm ${t.startsWith('[Agent]') ? 'text-indigo-300 font-bold' : 'text-gray-400 italic'}`}>
                                    {t}
                                </p>
                            ))}
                            {status === 'connecting' && <div className="flex justify-center py-10"><Spinner className="border-t-indigo-500" /></div>}
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-6">
                            {status === 'idle' || status === 'error' ? (
                                <Button onClick={startSession} className="bg-indigo-600 hover:bg-indigo-500 text-white h-16 w-full rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                                    <MicIcon className="w-6 h-6" /> Initialize Audio Link
                                </Button>
                            ) : (
                                <div className="flex gap-4 w-full">
                                    <Button 
                                        onClick={() => setIsMuted(!isMuted)} 
                                        className={`flex-grow h-14 rounded-2xl font-bold uppercase text-xs ${isMuted ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}
                                    >
                                        {isMuted ? 'Unmute' : 'Mute Mic'}
                                    </Button>
                                    <Button onClick={stopSession} className="bg-white text-gray-900 h-14 px-8 rounded-2xl font-bold uppercase text-xs">
                                        End Session
                                    </Button>
                                </div>
                            )}

                            {status === 'listening' && (
                                <div className="flex items-center gap-2 text-accent text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                                    <div className="w-2 h-2 bg-accent rounded-full"></div> Agent is Listening...
                                </div>
                            )}
                             {status === 'speaking' && (
                                <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                                    <SparklesIcon className="w-4 h-4" /> Agent is Responding...
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                        Secure Voice Link Active &bull; No Data Saved Locally
                    </p>
                </div>
            </div>
        </div>
    );
};

const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
);

export default AIAgentPage;
