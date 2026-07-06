import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ShieldIcon from './icons/ShieldIcon';
import TrophyIcon from './icons/TrophyIcon';
import GlobeIcon from './icons/GlobeIcon';
import UsersIcon from './icons/UsersIcon';
import SparklesIcon from './icons/SparklesIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import BarChartIcon from './icons/BarChartIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import DownloadIcon from './icons/DownloadIcon';
import Spinner from './ui/Spinner';
import Logo from './Logo';
import SmartphoneIcon from './icons/SmartphoneIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import { saveCRMLead, CRMLead } from '../services/crm';

const DeckSlide: React.FC<{ children: React.ReactNode; className?: string; id: string }> = ({ children, className = "", id }) => {
    const slideRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!slideRef.current) return;
        setDownloading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 150));
            const canvas = await html2canvas(slideRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#030712'
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Football-Eswatini-Deck-${id}.png`;
            link.click();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Could not export slide. Check browser permissions.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <section id={id} className={`min-h-screen flex flex-col justify-center relative snap-start ${className}`}>
            <div ref={slideRef} className="min-h-screen w-full py-28 px-4 sm:px-6 flex items-center justify-center bg-inherit">
                <div className="container mx-auto max-w-6xl w-full">
                    {children}
                </div>
            </div>
            {/* Contextual Export Button for Each Slide */}
            <div className="absolute bottom-6 right-6 no-print z-50">
                <button 
                    onClick={(e) => { e.preventDefault(); handleDownload(); }}
                    disabled={downloading}
                    className="bg-slate-900/60 backdrop-blur-md text-white/75 hover:text-white hover:bg-slate-900/90 p-2.5 px-4 rounded-full transition-all border border-white/10 flex items-center gap-2.5 shadow-xl active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-wider"
                >
                    {downloading ? <Spinner className="w-3.5 h-3.5 border-white/20 border-t-white" /> : <DownloadIcon className="w-3.5 h-3.5 text-accent" />}
                    <span>{downloading ? 'Exporting...' : 'Export Slide'}</span>
                </button>
            </div>
        </section>
    );
};

const PitchDeckPage: React.FC = () => {
    const [activeSlide, setActiveSlide] = useState('vision');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Slide navigation sequence
    const slideOrder = ['vision', 'problem', 'solution', 'ecosystem', 'tech', 'commercial', 'growth', 'closing'];
    const progress = ((slideOrder.indexOf(activeSlide) + 1) / slideOrder.length) * 100;

    // Slide 3: Live Scoreboard Simulator state
    const [simMinutes, setSimMinutes] = useState(76);
    const [simHomeScore, setSimHomeScore] = useState(1);
    const [simAwayScore, setSimAwayScore] = useState(1);
    const [simEvents, setSimEvents] = useState<Array<{ min: number; txt: string }>>([
        { min: 14, txt: 'Swallows penalty kick saved!' },
        { min: 38, txt: 'Goal Swallows (S. Ndzinisa)' },
        { min: 61, txt: 'Goal Highlanders (P. Mkhontfo)' }
    ]);

    // Live Simulator effect
    useEffect(() => {
        const interval = setInterval(() => {
            setSimMinutes(prev => {
                if (prev >= 90) {
                    // Reset simulator
                    setSimHomeScore(1);
                    setSimAwayScore(1);
                    setSimEvents([
                        { min: 14, txt: 'Swallows penalty kick saved!' },
                        { min: 38, txt: 'Goal Swallows (S. Ndzinisa)' },
                        { min: 61, txt: 'Goal Highlanders (P. Mkhontfo)' }
                    ]);
                    return 76;
                }
                const nextMin = prev + 1;
                // Randomly trigger an action event
                if (nextMin === 82) {
                    setSimHomeScore(2);
                    setSimEvents(evs => [{ min: 82, txt: 'GOAL Swallows! Spectacular bicycle kick!' }, ...evs]);
                } else if (nextMin === 88) {
                    setSimEvents(evs => [{ min: 88, txt: 'Red Card Highlanders (Defensive foul)' }, ...evs]);
                }
                return nextMin;
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Slide 4: Ecosystem Stakeholder Tab Selection
    const [selectedEcosystem, setSelectedEcosystem] = useState<'associations' | 'clubs' | 'fans' | 'brands'>('associations');

    // Slide 5: Tech Latency Simulator State
    const [pingStatus, setPingStatus] = useState<'idle' | 'pinging' | 'completed'>('idle');
    const [latency, setLatency] = useState<number>(0);

    const handlePingTest = () => {
        setPingStatus('pinging');
        setTimeout(() => {
            setLatency(Math.floor(Math.random() * 85) + 110); // 110ms to 195ms
            setPingStatus('completed');
        }, 1200);
    };

    // Slide 6: Revenue / Business Model Calculator State
    const [projectedMAUs, setProjectedMAUs] = useState(60000);
    const [monthlyClubFee, setMonthlyClubFee] = useState(350);

    // Calculated revenues (annualized SZL / Emalangeni)
    const annualAdRev = Math.round(projectedMAUs * 0.40 * 12);
    const annualClubSaaS = Math.round(65 * monthlyClubFee * 12);
    const annualMarketplaceFees = Math.round(projectedMAUs * 0.15 * 12);
    const annualScoutingPremium = Math.round(120 * 250 * 12);
    const grandTotalRevenue = annualAdRev + annualClubSaaS + annualMarketplaceFees + annualScoutingPremium;

    // Slide 7: Growth Timeline Selection
    const [selectedGrowthQuarter, setSelectedGrowthQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q1');

    // Slide 8: Closing Lead Submission Form
    const [leadName, setLeadName] = useState('');
    const [leadOrg, setLeadOrg] = useState('');
    const [leadEmail, setLeadEmail] = useState('');
    const [leadPhone, setLeadPhone] = useState('');
    const [leadRegion, setLeadRegion] = useState<'Hhohho' | 'Manzini' | 'Lubombo' | 'Shiselweni' | 'Other'>('Hhohho');
    const [leadTier, setLeadTier] = useState<'basic' | 'premium' | 'press' | 'advertising'>('premium');
    const [leadNotes, setLeadNotes] = useState('');
    const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leadName || !leadOrg || !leadEmail) {
            alert('Please fill out the required fields.');
            return;
        }

        setFormStatus('submitting');
        const randSuffix = Math.random().toString(36).substring(2, 9);
        const leadId = `pitch-lead-${Date.now()}-${randSuffix}`;

        const newLead: CRMLead = {
            id: leadId,
            clubName: leadOrg,
            contactName: leadName,
            email: leadEmail,
            phone: leadPhone || '+268 7600 0000',
            region: leadRegion,
            status: 'lead',
            subscriptionTier: leadTier,
            dealValue: leadTier === 'premium' ? 350 : leadTier === 'basic' ? 150 : leadTier === 'press' ? 500 : 800,
            notes: leadNotes ? `Strategic Lead from Pitch Deck: ${leadNotes}` : `Automatic Strategic Inquiry registered from Enterprise Pitch Deck. Preferred tier: ${leadTier}.`,
            tasks: [],
            activities: [
                {
                    id: `act-${Date.now()}-${randSuffix}`,
                    type: 'system',
                    description: `Lead registered via Enterprise Strategy Pitch Deck form (Interest: ${leadTier.toUpperCase()})`,
                    timestamp: new Date().toISOString()
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await saveCRMLead(newLead);
            setFormStatus('success');
            // Clean fields
            setLeadName('');
            setLeadOrg('');
            setLeadEmail('');
            setLeadPhone('');
            setLeadNotes('');
        } catch (error) {
            console.error('Failed to register pitch deck lead:', error);
            setFormStatus('error');
        }
    };

    // Track active slide based on scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const sections = container.querySelectorAll('section');
            let current = 'vision';
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top >= -250 && rect.top <= 250) {
                    current = section.id;
                }
            });
            setActiveSlide(current);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSlide = (slideId: string) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const target = container.querySelector(`#${slideId}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSlide(slideId);
        }
    };

    const handlePrev = () => {
        const currentIndex = slideOrder.indexOf(activeSlide);
        if (currentIndex > 0) {
            scrollToSlide(slideOrder[currentIndex - 1]);
        }
    };

    const handleNext = () => {
        const currentIndex = slideOrder.indexOf(activeSlide);
        if (currentIndex < slideOrder.length - 1) {
            scrollToSlide(slideOrder[currentIndex + 1]);
        }
    };

    return (
        <div className="bg-slate-950 text-white h-screen overflow-hidden flex flex-col font-sans">
            <style>{`
                .thin-scrollbar::-webkit-scrollbar { width: 6px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 3px; }
                .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
                .snap-y { scroll-snap-type: y mandatory; }
                .snap-start { scroll-snap-align: start; }
            `}</style>

            {/* STRATEGIC HUD (Navigation & Progress) */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[95%] max-w-5xl no-print">
                <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 px-5 py-3.5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Logo className="h-7 w-auto" />
                        <div className="h-6 w-px bg-white/15 hidden sm:block"></div>
                        <div className="hidden md:flex gap-4 lg:gap-5 text-[9px] font-black uppercase tracking-[0.15em] text-white/50">
                            {slideOrder.map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => scrollToSlide(s)}
                                    className={`transition-all hover:text-white uppercase tracking-widest ${activeSlide === s ? 'text-accent font-black scale-105 border-b-2 border-accent pb-0.5' : 'font-medium'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end gap-1 w-24">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">SLIDE {slideOrder.indexOf(activeSlide) + 1} OF 8</span>
                        </div>
                        
                        {/* Quick Manual Arrows */}
                        <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5 bg-slate-950/40">
                            <button 
                                onClick={handlePrev} 
                                disabled={slideOrder.indexOf(activeSlide) === 0}
                                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                title="Previous Slide"
                            >
                                <ArrowLeftIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={handleNext} 
                                disabled={slideOrder.indexOf(activeSlide) === slideOrder.length - 1}
                                className="p-1.5 rounded hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none transition-all"
                                title="Next Slide"
                            >
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <Button onClick={() => window.history.back()} variant="ghost" className="h-8 text-white/60 hover:text-white hover:bg-white/5 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">
                            Exit
                        </Button>
                    </div>
                </div>
            </div>

            {/* SLIDE CONTAINER */}
            <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y thin-scrollbar scroll-smooth">
                
                {/* 1. VISION */}
                <DeckSlide id="vision" className="bg-slate-950 relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-25 grayscale"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent"></div>
                    
                    <div className="relative z-10 text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
                        <div className="bg-accent/15 backdrop-blur-xl px-5 py-2 rounded-full inline-flex items-center gap-2.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] border border-accent/25 text-accent shadow-xl">
                            <SparklesIcon className="w-4 h-4 animate-pulse text-accent" /> ONE HUB. ONE KINGDOM.
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-display font-black leading-[0.9] tracking-tighter drop-shadow-2xl">
                            THE DIGITAL GATEWAY FOR <br className="hidden sm:block" /> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-300 to-accent">ESWATINI FOOTBALL</span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
                            Connecting professional clubs, regional associations, scouts, players, and passionate fans on a unified, real-time football platform.
                        </p>
                        
                        <div className="pt-4 flex justify-center gap-6">
                            <div className="text-center bg-slate-900/40 backdrop-blur-sm border border-white/5 px-6 py-3 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Total Fans</p>
                                <p className="text-xl sm:text-2xl font-black text-white">700k+</p>
                            </div>
                            <div className="text-center bg-slate-900/40 backdrop-blur-sm border border-white/5 px-6 py-3 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Registered Clubs</p>
                                <p className="text-xl sm:text-2xl font-black text-white">120+</p>
                            </div>
                            <div className="text-center bg-slate-900/40 backdrop-blur-sm border border-white/5 px-6 py-3 rounded-2xl">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Active Leagues</p>
                                <p className="text-xl sm:text-2xl font-black text-white">4 regions</p>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => scrollToSlide('problem')}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 hover:text-white transition-colors uppercase font-black text-[9px] tracking-[0.2em] no-print"
                    >
                        <span>Analyze Problem</span>
                        <div className="w-px h-8 bg-gradient-to-b from-accent to-transparent animate-bounce mt-1"></div>
                    </button>
                </DeckSlide>

                {/* 2. THE PROBLEM */}
                <DeckSlide id="problem" className="bg-slate-900 text-white relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-red-500 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Critical Bottlenecks
                                </h4>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black leading-none tracking-tight">
                                    The Fragmentation of Eswatini Football Data.
                                </h2>
                            </div>
                            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                                Today, matches are played across the Kingdom, but scores are locked in offline group-chats. Regional tables are compiled manually in spreadsheets, and club administrations struggle to showcase their rosters to external markets.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-950/50 border border-red-500/15 rounded-2xl flex gap-4 items-start hover:border-red-500/30 transition-all">
                                    <div className="w-9 h-9 bg-red-950/60 border border-red-500/20 text-red-400 font-bold rounded-lg flex items-center justify-center shrink-0">95%</div>
                                    <div>
                                        <h5 className="font-bold text-white text-sm">Leagues Offline</h5>
                                        <p className="text-xs text-slate-400 mt-1">Youth and Regional leagues have absolutely zero permanent digital records or history.</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-950/50 border border-red-500/15 rounded-2xl flex gap-4 items-start hover:border-red-500/30 transition-all">
                                    <div className="w-9 h-9 bg-red-950/60 border border-red-500/20 text-red-400 font-bold rounded-lg flex items-center justify-center shrink-0">Zero</div>
                                    <div>
                                        <h5 className="font-bold text-white text-sm">Centralized Scouting</h5>
                                        <p className="text-xs text-slate-400 mt-1">No database exists for international agents to discover and audit local talent metrics.</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-950/50 border border-red-500/15 rounded-2xl flex gap-4 items-start hover:border-red-500/30 transition-all">
                                    <div className="w-9 h-9 bg-red-950/60 border border-red-500/20 text-red-400 font-bold rounded-lg flex items-center justify-center shrink-0">Lost</div>
                                    <div>
                                        <h5 className="font-bold text-white text-sm">Sponsor Reach</h5>
                                        <p className="text-xs text-slate-400 mt-1">Local brands cannot purchase target-focused, verified soccer ads.</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-950/50 border border-red-500/15 rounded-2xl flex gap-4 items-start hover:border-red-500/30 transition-all">
                                    <div className="w-9 h-9 bg-red-950/60 border border-red-500/20 text-red-400 font-bold rounded-lg flex items-center justify-center shrink-0">Manual</div>
                                    <div>
                                        <h5 className="font-bold text-white text-sm">Roster Sheets</h5>
                                        <p className="text-xs text-slate-400 mt-1">Registration forms are typed and checked manually, creating high administrative overhead.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 relative">
                            <div className="aspect-[4/5] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl relative border border-white/5">
                                <img src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200" className="w-full h-full object-cover opacity-40 grayscale" alt="Football pitch outline" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                                
                                <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md border border-red-500/30 p-6 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">STATUS CONSTRAINTS</span>
                                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                                    </div>
                                    <p className="font-bold text-sm text-white">Manual operations hold back a premier football nation from realizing its true monetization value.</p>
                                    <p className="text-[10px] text-slate-400 leading-normal">Our research shows 84% of local football supporters actively seek live scores on their phones but rely on personal WhatsApp notifications.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 3. THE SOLUTION */}
                <DeckSlide id="solution" className="bg-slate-950 text-white relative">
                    <div className="text-center mb-12 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Strategic Vision</h4>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white tracking-tight">The Unified Football Platform</h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-sm">We provide an all-in-one ecosystem serving different layers of Eswatini football.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Interactive Match Ticker Simulation */}
                        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-6">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live Simulation (Platform Demo)</span>
                                </div>
                                <span className="bg-white/10 text-[9px] font-mono text-white/80 px-2 py-0.5 rounded font-black uppercase">MTN Premier</span>
                            </div>

                            <div className="text-center space-y-3 py-2">
                                <p className="text-[9px] font-black uppercase text-accent tracking-[0.25em]">Mbabane Derby Live Match Center</p>
                                <div className="flex items-center justify-around gap-4">
                                    <div className="text-center w-1/3">
                                        <p className="font-black text-white text-base truncate">M. Swallows</p>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Home</span>
                                    </div>
                                    <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-white/10 flex items-center justify-center gap-3">
                                        <span className="text-3xl font-black font-mono text-accent">{simHomeScore}</span>
                                        <span className="text-xs text-white/30 font-bold">:</span>
                                        <span className="text-3xl font-black font-mono text-accent">{simAwayScore}</span>
                                    </div>
                                    <div className="text-center w-1/3">
                                        <p className="font-black text-white text-base truncate">Highlanders</p>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Away</span>
                                    </div>
                                </div>
                                <p className="text-xs font-mono font-black text-accent bg-accent/10 py-1 px-3 rounded-md w-fit mx-auto animate-pulse">{simMinutes}' Match Time</p>
                            </div>

                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                                <p className="text-[8px] font-black uppercase text-white/30 tracking-widest border-b border-white/5 pb-1">Match Events Log</p>
                                {simEvents.map((evt, idx) => (
                                    <div key={idx} className="flex gap-2 text-[10px] items-start border-b border-white/5 pb-1.5 last:border-none">
                                        <span className="text-accent font-bold font-mono shrink-0">{evt.min}'</span>
                                        <span className="text-slate-300 font-medium">{evt.txt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mb-4">
                                    <SmartphoneIcon className="w-6 h-6" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-2">Interactive Match Center</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Real-time match scoring, automatic standings generation, customized player-of-the-match voting, and responsive team-sheets.
                                </p>
                            </div>
                            
                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
                                <div className="p-3 bg-green-500/10 text-green-400 rounded-xl w-fit mb-4">
                                    <BriefcaseIcon className="w-6 h-6" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-2">Self-Managed Portals</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Every club and administrator receives dedicated portals to publish official press releases, edit squads, upload kits, and edit rosters.
                                </p>
                            </div>

                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
                                <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl w-fit mb-4">
                                    <TrophyIcon className="w-6 h-6" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-2">Comprehensive Coverage</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Not just the elite: we aggregate regional division tables, women’s matches, grassroots talent pools, and school championships under one umbrella.
                                </p>
                            </div>

                            <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl w-fit mb-4">
                                    <ShieldIcon className="w-6 h-6" />
                                </div>
                                <h4 className="font-black text-white text-lg mb-2">Verified Talent Scouts</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Verified statistics database containing historical charts, squad logs, match videos, and scouting scores for local talent export.
                                </p>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 4. THE ECOSYSTEM */}
                <DeckSlide id="ecosystem" className="bg-slate-900 text-white relative">
                    <div className="absolute top-12 left-12 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
                        <div className="lg:w-1/2 space-y-6 sm:space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Value Propositions</h4>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black leading-none tracking-tight">
                                    Seamless Integration of the Football Value Chain.
                                </h2>
                            </div>
                            <p className="text-base text-slate-300 leading-relaxed">
                                Football Eswatini acts as a highly integrated bridge that connects leagues, sports authorities, commercial sponsors, and fans on one reliable real-time network.
                            </p>

                            {/* Ecosystem Tabs */}
                            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
                                {[
                                    { id: 'associations', label: 'Associations' },
                                    { id: 'clubs', label: 'Football Clubs' },
                                    { id: 'fans', label: 'Supporters & Fans' },
                                    { id: 'brands', label: 'Commercial Brands' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedEcosystem(tab.id as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedEcosystem === tab.id ? 'bg-accent text-primary-dark shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Active Tab Card */}
                            <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/15 min-h-[160px] flex flex-col justify-between">
                                {selectedEcosystem === 'associations' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent">GOVERNANCE & AUDIT CONTROL</p>
                                        <h5 className="font-black text-white text-lg">Centralize League Administration</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed">Automatically recalculate standings upon match confirmation. Distribute official notices, track regional referees, and monitor regulatory compliance from a single dashboard.</p>
                                    </div>
                                )}
                                {selectedEcosystem === 'clubs' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent">DIGITAL ENTERPRISE PORTALS</p>
                                        <h5 className="font-black text-white text-lg">Monetize and Professionalize</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed">Give clubs their own branded domain/page. Sell matchday tickets directly, advertise club jerseys, control player profiles, and coordinate roster announcements cleanly.</p>
                                    </div>
                                )}
                                {selectedEcosystem === 'fans' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent">HIGH-FREQUENCY ENGAGEMENT</p>
                                        <h5 className="font-black text-white text-lg">Unprecedented Match Day Discovery</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed">Live scoring notifications, audio podcast channels, match prediction games, squad fantasy selections, and regional stadium maps for easier matchday planning.</p>
                                    </div>
                                )}
                                {selectedEcosystem === 'brands' && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-accent">HYPER-TARGETED COMMERCE</p>
                                        <h5 className="font-black text-white text-lg">Direct Reach without Ad Blocker Noise</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed">Inject non-obtrusive corporate banner ads directly into high-traffic live match centers. Align brand sponsorship metrics with verified user impressions.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Visual Right column */}
                        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                            <div className="bg-slate-950 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between gap-6 hover:border-accent/30 transition-all group aspect-square">
                                <GlobeIcon className="w-10 h-10 text-accent group-hover:scale-110 transition-transform" />
                                <div>
                                    <h5 className="font-black text-white text-base">Regional Hubs</h5>
                                    <p className="text-[11px] text-slate-400 mt-1">Connecting Lubombo, Manzini, Hhohho, and Shiselweni under one digital domain.</p>
                                </div>
                            </div>
                            <div className="bg-slate-950 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between gap-6 hover:border-accent/30 transition-all group aspect-square mt-8">
                                <UsersIcon className="w-10 h-10 text-accent group-hover:scale-110 transition-transform" />
                                <div>
                                    <h5 className="font-black text-white text-base">Youth Pipe</h5>
                                    <p className="text-[11px] text-slate-400 mt-1">Nurturing grassroots football by registering Under-13, 15, and 17 team rosters.</p>
                                </div>
                            </div>
                            <div className="bg-slate-950 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between gap-6 hover:border-accent/30 transition-all group aspect-square -mt-8">
                                <ShieldCheckIcon className="w-10 h-10 text-accent group-hover:scale-110 transition-transform" />
                                <div>
                                    <h5 className="font-black text-white text-base">Verified Stats</h5>
                                    <p className="text-[11px] text-slate-400 mt-1">Official matches tracked, scored, and audited by licensed local referees.</p>
                                </div>
                            </div>
                            <div className="bg-slate-950 border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between gap-6 hover:border-accent/30 transition-all group aspect-square">
                                <TrophyIcon className="w-10 h-10 text-accent group-hover:scale-110 transition-transform" />
                                <div>
                                    <h5 className="font-black text-white text-base">Elite Premier</h5>
                                    <p className="text-[11px] text-slate-400 mt-1">Full coverage of MTN Premier league, Cups, and national team squads.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 5. TECH ENGINE */}
                <DeckSlide id="tech" className="bg-slate-950 text-white relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06),transparent_50%)]"></div>
                    <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                        <div className="lg:w-5/12">
                            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Database Engine Panel</span>
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"></span> ONLINE
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                            <span>Active Sync Target:</span>
                                            <span className="text-white">Firestore Realtime</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                            <span>Collection Schema:</span>
                                            <span className="text-accent">crm_leads & fixtures</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                            <span>State Management:</span>
                                            <span className="text-white">React Context API</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 font-black">
                                            <span>Query Load Processing</span>
                                            <span>94.8% SLA</span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent w-[94.8%]"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Dynamic Latency Check</p>
                                        {latency > 0 ? (
                                            <p className="text-xl font-mono font-black text-accent">{latency}ms</p>
                                        ) : (
                                            <p className="text-xs text-slate-500 font-medium italic">Pending trigger...</p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handlePingTest}
                                        disabled={pingStatus === 'pinging'}
                                        className="bg-accent hover:bg-yellow-400 text-primary-dark font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {pingStatus === 'pinging' ? 'Testing...' : 'Ping Database'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-7/12 space-y-6 sm:space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Server & Architecture</h4>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black leading-none tracking-tight">
                                    Highly Responsive Architecture.
                                </h2>
                            </div>
                            <p className="text-base text-slate-300 leading-relaxed">
                                Our modern full-stack web infrastructure operates on server-side modules paired with lightning-fast React views. Built to scale easily across high-concurrency matchdays.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                                    <h5 className="font-black text-white text-sm mb-1 uppercase tracking-wider text-accent">Real-Time WebSockets</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed">Changes in scores are propagated to all active screens in milliseconds, ensuring high immersion.</p>
                                </div>
                                <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                                    <h5 className="font-black text-white text-sm mb-1 uppercase tracking-wider text-accent">Static Optimization</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed">Images, league crests, and assets are fully optimized to decrease network consumption on mobile browsers.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 6. COMMERCIAL */}
                <DeckSlide id="commercial" className="bg-slate-900 text-white relative">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-6 space-y-6 sm:space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Revenue Strategy & Modeling</h4>
                                <h2 className="text-4xl sm:text-5xl font-display font-black leading-none tracking-tight">
                                    Diversified Monetization Streams.
                                </h2>
                            </div>
                            
                            <p className="text-sm sm:text-base text-slate-300">
                                Drag the sliders below to simulate the projected Year 1 Gross Revenue based on audience reach and club SaaS fees!
                            </p>

                            {/* Sliders Container */}
                            <div className="space-y-5 bg-slate-950 p-6 rounded-2xl border border-white/10 shadow-inner">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-300">Projected Monthly Active Fans (MAUs)</span>
                                        <span className="font-black text-accent font-mono">{(projectedMAUs / 1000).toFixed(0)}k</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="10000" 
                                        max="150000" 
                                        step="5000"
                                        value={projectedMAUs}
                                        onChange={(e) => setProjectedMAUs(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-300">Club Portal Monthly Fee (SZL)</span>
                                        <span className="font-black text-accent font-mono">E{monthlyClubFee}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="100" 
                                        max="1000" 
                                        step="50"
                                        value={monthlyClubFee}
                                        onChange={(e) => setMonthlyClubFee(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Ad Revenue</p>
                                    <p className="text-sm font-black text-white mt-1">E{annualAdRev.toLocaleString()}</p>
                                </div>
                                <div className="text-center p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Club SaaS</p>
                                    <p className="text-sm font-black text-white mt-1">E{annualClubSaaS.toLocaleString()}</p>
                                </div>
                                <div className="text-center p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Marketplace Fees</p>
                                    <p className="text-sm font-black text-white mt-1">E{annualMarketplaceFees.toLocaleString()}</p>
                                </div>
                                <div className="text-center p-3.5 bg-slate-950/40 border border-white/5 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Scouting Licenses</p>
                                    <p className="text-sm font-black text-white mt-1">E{annualScoutingPremium.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Calculator Output Chart */}
                        <div className="lg:col-span-6 bg-slate-950 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden flex flex-col justify-between h-full min-h-[400px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>
                            
                            <div className="space-y-2 border-b border-white/10 pb-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">YEAR 1 FINANCIAL PROJECTIONS</span>
                                <h3 className="text-4xl font-display font-black text-white">E{grandTotalRevenue.toLocaleString()}</h3>
                                <p className="text-[10px] text-slate-400 font-medium">Estimated Gross Annual Income (Emalangeni)</p>
                            </div>

                            <div className="space-y-5 my-6">
                                {[
                                    { label: 'Sponsorship & Direct Ad Slots', val: annualAdRev, pct: ((annualAdRev / grandTotalRevenue) * 100).toFixed(0), color: 'bg-blue-500' },
                                    { label: 'Club Subscription Fees', val: annualClubSaaS, pct: ((annualClubSaaS / grandTotalRevenue) * 100).toFixed(0), color: 'bg-emerald-500' },
                                    { label: 'Merchandising & Ticket Commissions', val: annualMarketplaceFees, pct: ((annualMarketplaceFees / grandTotalRevenue) * 100).toFixed(0), color: 'bg-yellow-500' },
                                    { label: 'Agent & Scout Data Licenses', val: annualScoutingPremium, pct: ((annualScoutingPremium / grandTotalRevenue) * 100).toFixed(0), color: 'bg-purple-500' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-300">{item.label}</span>
                                            <span className="text-white font-mono">E{item.val.toLocaleString()} ({item.pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} transition-all duration-300`} style={{ width: `${item.pct}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[9px] text-slate-500 leading-normal italic text-center">
                                Calculations based on actual conversion rates across active Southern African sports news systems.
                            </p>
                        </div>
                    </div>
                </DeckSlide>

                {/* 7. GROWTH & REACH */}
                <DeckSlide id="growth" className="bg-slate-950 text-white relative">
                    <div className="text-center mb-12 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Growth Path</h4>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-white tracking-tight">The Growth Trajectory.</h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">Click each quarter below to explore the strategic digital milestone details.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Left column: growth curve simulator */}
                        <div className="lg:col-span-7 bg-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-6">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Estimated Audience Trajectory (Year 1)</span>
                                <span className="bg-accent/15 text-accent text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">Active MAUs</span>
                            </div>

                            {/* Simulated chart bars */}
                            <div className="h-44 flex items-end justify-between gap-4 pt-4 border-b border-white/10 pb-2">
                                {[
                                    { q: 'q1', val: 15, label: 'Q1 Launch', height: 'h-[20%]', color: selectedGrowthQuarter === 'q1' ? 'bg-accent' : 'bg-accent/30' },
                                    { q: 'q2', val: 35, label: 'Q2 Regional', height: 'h-[45%]', color: selectedGrowthQuarter === 'q2' ? 'bg-accent' : 'bg-accent/30' },
                                    { q: 'q3', val: 55, label: 'Q3 Cup peak', height: 'h-[70%]', color: selectedGrowthQuarter === 'q3' ? 'bg-accent' : 'bg-accent/30' },
                                    { q: 'q4', val: 80, label: 'Q4 Premium', height: 'h-[100%]', color: selectedGrowthQuarter === 'q4' ? 'bg-accent' : 'bg-accent/30' }
                                ].map((item, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setSelectedGrowthQuarter(item.q as any)}
                                        className="flex-1 flex flex-col justify-end items-center h-full group focus:outline-none"
                                    >
                                        <div className="text-[10px] font-mono font-black text-accent opacity-0 group-hover:opacity-100 mb-1 transition-opacity">{item.val}k</div>
                                        <div className={`w-full ${item.height} ${item.color} rounded-t-lg transition-all duration-300 group-hover:bg-accent shadow-lg shadow-accent/5`}></div>
                                        <span className="text-[10px] font-bold text-slate-400 mt-2">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div className="p-3 bg-slate-950/50 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Projected MAUs</p>
                                    <p className="text-lg font-black text-white mt-1">80k+</p>
                                </div>
                                <div className="p-3 bg-slate-950/50 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Club Onboarding</p>
                                    <p className="text-lg font-black text-white mt-1">100%</p>
                                </div>
                                <div className="p-3 bg-slate-950/50 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Regional Impress.</p>
                                    <p className="text-lg font-black text-white mt-1">2.4M</p>
                                </div>
                                <div className="p-3 bg-slate-950/50 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-slate-400">Avg. Duration</p>
                                    <p className="text-lg font-black text-white mt-1">12min</p>
                                </div>
                            </div>
                        </div>

                        {/* Right column: growth details */}
                        <div className="lg:col-span-5 bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] min-h-[300px] flex flex-col justify-between">
                            {selectedGrowthQuarter === 'q1' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">PHASE 1 (LAUNCH)</span>
                                        <span className="text-[10px] font-mono text-white/40">Months 1-3</span>
                                    </div>
                                    <h4 className="text-2xl font-display font-black text-white leading-tight">Mobile Launch & MTN Elite Setup</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Release the central interactive match center. Partner with the top 16 Premier League clubs to verify official squad players, set up press logins, and begin live text reporting.
                                    </p>
                                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Set up core database & CRM synchronization</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Launch club profile editor access</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Capture first 15k active users</li>
                                    </ul>
                                </div>
                            )}

                            {selectedGrowthQuarter === 'q2' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">PHASE 2 (EXPANSION)</span>
                                        <span className="text-[10px] font-mono text-white/40">Months 4-6</span>
                                    </div>
                                    <h4 className="text-2xl font-display font-black text-white leading-tight">Regional Super League Saturation</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Integrate the four regional association boards (Lubombo, Shiselweni, Hhohho, Manzini). Onboard over 40 lower-division teams to provide automatic standings compilation.
                                    </p>
                                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Activate region-focused page filters</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Integrate local referee match submission logs</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Reach 35k monthly active users</li>
                                    </ul>
                                </div>
                            )}

                            {selectedGrowthQuarter === 'q3' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">PHASE 3 (PEAK CONVERSION)</span>
                                        <span className="text-[10px] font-mono text-white/40">Months 7-9</span>
                                    </div>
                                    <h4 className="text-2xl font-display font-black text-white leading-tight">Merchandising & Ticket Gateway Launch</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Deploy the official e-commerce ticket store and replica jersey marketplace. Take micro-commissions from every match day ticket sold directly on-platform.
                                    </p>
                                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Deploy secure DeltaPay seed pitch systems</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Launch club replica gear storefront portals</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Hit 55k monthly active supporters</li>
                                    </ul>
                                </div>
                            )}

                            {selectedGrowthQuarter === 'q4' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">PHASE 4 (SCALABILITY)</span>
                                        <span className="text-[10px] font-mono text-white/40">Months 10-12</span>
                                    </div>
                                    <h4 className="text-2xl font-display font-black text-white leading-tight">Global Scouting Premium</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Launch premium licenses for foreign scouts. Distribute verified player metrics, historic ratings charts, video highlights, and transfer availability logs.
                                    </p>
                                    <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Launch official agent metrics subscription</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Establish school championship data channels</li>
                                        <li className="flex items-center gap-2 font-medium"><CheckCircleIcon className="w-3.5 h-3.5 text-accent" /> Fully saturate target of 80k active fans</li>
                                    </ul>
                                </div>
                            )}

                            <p className="text-[9px] text-slate-500 font-bold tracking-wider border-t border-white/5 pt-3">
                                CLICK GRAPH BARS TO TOGGLE THROUGH QUARTER PATHWAYS
                            </p>
                        </div>
                    </div>
                </DeckSlide>

                {/* 8. CLOSING */}
                <DeckSlide id="closing" className="bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto w-full">
                        {/* Closing statements */}
                        <div className="lg:col-span-5 space-y-6 text-left">
                            <Logo className="h-16 w-auto" />
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black leading-none tracking-tighter text-white">
                                LET'S SCORE <br /> THE FUTURE.
                            </h2>
                            <p className="text-base text-slate-300 leading-relaxed">
                                We are looking for forward-thinking brand sponsors, corporate partners, and regional stakeholders to expand our digital footprint across the Kingdom of Eswatini.
                            </p>
                            <div className="space-y-3.5">
                                <div className="flex items-center gap-3 font-bold text-sm text-slate-300">
                                    <CheckCircleIcon className="w-5 h-5 text-accent shrink-0" />
                                    <span>Direct connection into the official admin CRM dashboard</span>
                                </div>
                                <div className="flex items-center gap-3 font-bold text-sm text-slate-300">
                                    <CheckCircleIcon className="w-5 h-5 text-accent shrink-0" />
                                    <span>Verified sponsorship opportunities on live pages</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive CRM submission form */}
                        <div className="lg:col-span-7">
                            <div className="bg-slate-950 border border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-2xl relative">
                                {formStatus === 'success' ? (
                                    <div className="text-center py-12 space-y-6">
                                        <div className="w-16 h-16 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center mx-auto text-accent shadow-xl">
                                            <CheckCircleIcon className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-white">Inquiry Registered!</h4>
                                            <p className="text-xs text-slate-300 max-w-md mx-auto">
                                                Thank you! Your strategic partner request has been successfully integrated into our administrator Sales CRM pipeline.
                                            </p>
                                        </div>
                                        <Button 
                                            onClick={() => setFormStatus('idle')}
                                            className="bg-accent text-primary-dark font-black uppercase tracking-wider text-xs px-6 py-2.5 rounded-xl"
                                        >
                                            Submit Another Inquiry
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-black text-white text-lg">Schedule Strategic Session</h4>
                                                <p className="text-[10px] text-slate-400">Directly sync your inquiry into our admin database</p>
                                            </div>
                                            <span className="bg-accent/15 border border-accent/25 text-accent text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">
                                                CRM Connected
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contact Name *</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={leadName}
                                                    onChange={(e) => setLeadName(e.target.value)}
                                                    placeholder="Sipho Dlamini"
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Organization / Club *</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={leadOrg}
                                                    onChange={(e) => setLeadOrg(e.target.value)}
                                                    placeholder="Eswatini Sports Corp."
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Email Address *</label>
                                                <input 
                                                    type="email" 
                                                    required
                                                    value={leadEmail}
                                                    onChange={(e) => setLeadEmail(e.target.value)}
                                                    placeholder="sipho@sports.sz"
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Phone Number</label>
                                                <input 
                                                    type="text" 
                                                    value={leadPhone}
                                                    onChange={(e) => setLeadPhone(e.target.value)}
                                                    placeholder="+268 7600 0000"
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Region</label>
                                                <select
                                                    value={leadRegion}
                                                    onChange={(e) => setLeadRegion(e.target.value as any)}
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                                                >
                                                    <option value="Hhohho">Hhohho</option>
                                                    <option value="Manzini">Manzini</option>
                                                    <option value="Lubombo">Lubombo</option>
                                                    <option value="Shiselweni">Shiselweni</option>
                                                    <option value="Other">Other Region</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Interest Tier</label>
                                                <select
                                                    value={leadTier}
                                                    onChange={(e) => setLeadTier(e.target.value as any)}
                                                    className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-accent"
                                                >
                                                    <option value="premium">Premium Club Portal (E350/mo)</option>
                                                    <option value="basic">Basic Club Portal (E150/mo)</option>
                                                    <option value="press">Press Portal (E500/mo)</option>
                                                    <option value="advertising">Corporate Sponsor (E800/mo)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Brief Note / Question</label>
                                            <textarea 
                                                value={leadNotes}
                                                onChange={(e) => setLeadNotes(e.target.value)}
                                                rows={2}
                                                placeholder="Interested in regional advertising spots or scheduling a live demo..."
                                                className="w-full bg-slate-900 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent resize-none"
                                            />
                                        </div>

                                        {formStatus === 'error' && (
                                            <p className="text-red-400 text-[11px] font-bold">Failed to register inquiry. Please try again.</p>
                                        )}

                                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                            <Button 
                                                type="submit" 
                                                disabled={formStatus === 'submitting'}
                                                className="bg-accent hover:bg-yellow-400 text-primary-dark font-black uppercase tracking-wider text-xs px-6 py-3 rounded-xl flex-1 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                {formStatus === 'submitting' ? (
                                                    <>
                                                        <Spinner className="w-3.5 h-3.5 border-primary-dark/20 border-t-primary-dark" />
                                                        <span>Syncing Lead...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheckIcon className="w-4 h-4 text-primary-dark" />
                                                        <span>Register Partnership Request</span>
                                                    </>
                                                )}
                                            </Button>
                                            
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                onClick={() => window.history.back()} 
                                                className="text-white hover:bg-white/5 font-black uppercase tracking-wider text-xs px-6 py-3 rounded-xl border border-white/10"
                                            >
                                                Back to Hub
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </DeckSlide>
            </div>
        </div>
    );
};

export default PitchDeckPage;
