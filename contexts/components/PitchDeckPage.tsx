
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
// Added missing import for ShieldCheckIcon
import ShieldCheckIcon from './icons/ShieldCheckIcon';

const DeckSlide: React.FC<{ children: React.ReactNode; className?: string; id: string }> = ({ children, className = "", id }) => {
    const slideRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!slideRef.current) return;
        setDownloading(true);
        try {
            // Wait a moment for any fonts/images to settle
            await new Promise(resolve => setTimeout(resolve, 100));
            const canvas = await html2canvas(slideRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
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
        <section id={id} className={`min-h-screen flex flex-col justify-center relative snap-start overflow-hidden ${className}`}>
            <div ref={slideRef} className="h-full w-full py-24 px-6 flex items-center justify-center bg-inherit">
                <div className="container mx-auto max-w-6xl w-full">
                    {children}
                </div>
            </div>
            {/* Contextual Download Button for Each Slide */}
            <div className="absolute bottom-8 right-8 no-print z-50">
                <button 
                    onClick={(e) => { e.preventDefault(); handleDownload(); }}
                    disabled={downloading}
                    className="bg-slate-900/50 backdrop-blur-md text-white/70 hover:text-white hover:bg-slate-900/80 p-3 px-5 rounded-full transition-all border border-white/10 flex items-center gap-3 shadow-2xl active:scale-95 disabled:opacity-50"
                >
                    {downloading ? <Spinner className="w-4 h-4 border-white/20 border-t-white" /> : <DownloadIcon className="w-4 h-4" />}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{downloading ? 'Processing...' : 'Export Slide'}</span>
                </button>
            </div>
        </section>
    );
};

const MetricBox: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div className="bg-white/5 border border-white/10 backdrop-blur-sm p-8 rounded-[2rem] text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4">{label}</p>
        <p className="text-5xl md:text-7xl font-display font-black text-white mb-2">{value}</p>
        {sub && <p className="text-xs text-white/50 font-medium">{sub}</p>}
    </div>
);

const FeatureCard: React.FC<{ icon: any; title: string; desc: string; color: string }> = ({ icon: Icon, title, desc, color }) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-start gap-6 hover:shadow-2xl transition-all hover:-translate-y-1">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10`}>
            <Icon className={`w-10 h-10 ${color}`} />
        </div>
        <div>
            <h4 className="font-display font-black text-2xl text-slate-900 mb-3 leading-tight">{title}</h4>
            <p className="text-slate-600 leading-relaxed text-sm">{desc}</p>
        </div>
    </div>
);

const PitchDeckPage: React.FC = () => {
    const [activeSlide, setActiveSlide] = useState('vision');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Track active slide based on scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const sections = container.querySelectorAll('section');
            let current = 'vision';
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top >= -100 && rect.top <= 100) {
                    current = section.id;
                }
            });
            setActiveSlide(current);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const slideOrder = ['vision', 'problem', 'solution', 'ecosystem', 'tech', 'commercial', 'growth', 'closing'];
    const progress = ((slideOrder.indexOf(activeSlide) + 1) / slideOrder.length) * 100;

    return (
        <div className="bg-black text-white h-screen overflow-hidden">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .snap-y { scroll-snap-type: y mandatory; }
                .snap-start { scroll-snap-align: start; }
            `}</style>

            {/* STRATEGIC HUD (Navigation & Progress) */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-4xl no-print">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <Logo className="h-8 w-auto" />
                        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
                        <div className="hidden lg:flex gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                            {slideOrder.map(s => (
                                <a 
                                    key={s} 
                                    href={`#${s}`} 
                                    className={`transition-all hover:text-white ${activeSlide === s ? 'text-accent scale-110' : ''}`}
                                >
                                    {s}
                                </a>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end gap-1.5 w-32">
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-accent transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Strategy Deck v1.0</span>
                        </div>
                        <Button onClick={() => window.history.back()} variant="ghost" className="h-10 text-white/60 hover:text-white hover:bg-white/5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10">
                            Exit
                        </Button>
                    </div>
                </div>
            </div>

            {/* SLIDE CONTAINER */}
            <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y no-scrollbar">
                
                {/* 1. VISION */}
                <DeckSlide id="vision" className="bg-slate-950 relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                    
                    <div className="relative z-10 text-center space-y-8">
                        <div className="bg-blue-600/30 backdrop-blur-xl px-6 py-2 rounded-full inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] border border-white/20 text-blue-300 shadow-2xl">
                            <SparklesIcon className="w-4 h-4 text-accent animate-pulse" /> Eswatini Digital Transformation
                        </div>
                        <h1 className="text-6xl md:text-[10rem] font-display font-black leading-[0.85] tracking-tighter mb-8 drop-shadow-2xl">
                            ONE HUB. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-200 to-accent">ONE KINGDOM.</span>
                        </h1>
                        <p className="text-xl md:text-3xl text-gray-400 max-w-4xl mx-auto font-medium leading-relaxed italic">
                            Building the world-class digital gateway for football in Eswatini.
                        </p>
                    </div>
                    
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce opacity-20">
                         <div className="w-px h-16 bg-gradient-to-b from-white to-transparent"></div>
                    </div>
                </DeckSlide>

                {/* 2. THE PROBLEM */}
                <DeckSlide id="problem" className="bg-white text-slate-900">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-red-600">The Problem</h4>
                                <h2 className="text-5xl md:text-7xl font-display font-black leading-[1.1] tracking-tight">Data <br/> Fragmentation.</h2>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
                                Eswatini football exists in a pre-digital era. Results are shared via WhatsApp, rosters live in physical notebooks, and commercial potential is lost to inefficiency.
                            </p>
                            <div className="space-y-6">
                                {[
                                    { text: "95% of Youth & Women's leagues have zero digital footprint.", color: "text-red-600" },
                                    { text: "Scouts have no centralized database to track local talent.", color: "text-red-600" },
                                    { text: "Clubs lack direct digital monetization channels.", color: "text-red-600" }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-5 p-6 bg-red-50 rounded-3xl border border-red-100 shadow-sm transform hover:scale-102 transition-all">
                                        <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">!</div>
                                        <p className={`font-bold text-lg ${item.color}`}>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-slate-900 rounded-[3rem] overflow-hidden rotate-3 shadow-2xl relative">
                                <img src="https://images.unsplash.com/photo-1517466787929-bc90951d64b8?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover opacity-60" alt=""/>
                                <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="p-8 bg-red-600 text-white font-black text-3xl uppercase tracking-tighter -rotate-12 shadow-2xl">OUTDATED SYSTEM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 3. THE SOLUTION */}
                <DeckSlide id="solution" className="bg-slate-900">
                    <div className="text-center mb-16 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-accent">The Solution</h4>
                        <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tight">The Unified Platform</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <FeatureCard 
                            icon={SmartphoneIcon} 
                            title="Interactive Hub" 
                            desc="Real-time match centers, live tickers, and fan engagement tools designed for high-frequency mobile usage." 
                            color="text-blue-600"
                        />
                         <FeatureCard 
                            icon={BriefcaseIcon} 
                            title="Managed Portals" 
                            desc="Dedicated admin suites for every club and league to manage their own rosters, news, and official identities." 
                            color="text-green-600"
                        />
                         <FeatureCard 
                            icon={TrophyIcon} 
                            title="Total Coverage" 
                            desc="Centralizing every tier: MTN Premier League, Regional Super Leagues, Women's Football, and Schools." 
                            color="text-yellow-600"
                        />
                    </div>
                </DeckSlide>

                {/* 4. THE ECOSYSTEM */}
                <DeckSlide id="ecosystem" className="bg-primary text-white">
                    <div className="flex flex-col md:flex-row gap-20 items-center">
                        <div className="md:w-1/2 space-y-10">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-accent">Strategic Impact</h4>
                                <h2 className="text-5xl md:text-7xl font-display font-black leading-tight tracking-tight">Connecting <br/> Stakeholders.</h2>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { title: "For Associations", desc: "Governance, compliance, and automated standings recalculation." },
                                    { title: "For Clubs", desc: "Digital professionalization and commercial independence." },
                                    { title: "For Fans", desc: "Unprecedented access to live data and community activities." },
                                    { title: "For Brands", desc: "Hyper-targeted advertising in a zero-distraction environment." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                        <CheckCircleIcon className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                                        <div>
                                            <p className="font-black text-lg">{item.title}</p>
                                            <p className="text-sm text-blue-100/70">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:w-1/2 grid grid-cols-2 gap-4">
                            <div className="bg-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transform hover:scale-105 transition-all aspect-square border border-white/10 shadow-2xl">
                                <GlobeIcon className="w-12 h-12 text-accent" />
                                <p className="font-black text-center text-xs uppercase tracking-widest">Regional Hubs</p>
                            </div>
                            <div className="bg-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transform hover:scale-105 transition-all aspect-square border border-white/10 shadow-2xl mt-12">
                                <UsersIcon className="w-12 h-12 text-accent" />
                                <p className="font-black text-center text-xs uppercase tracking-widest">Youth Pipeline</p>
                            </div>
                            <div className="bg-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transform hover:scale-105 transition-all aspect-square border border-white/10 shadow-2xl -mt-12">
                                <ShieldCheckIcon className="w-12 h-12 text-accent" />
                                <p className="font-black text-center text-xs uppercase tracking-widest">Verified Stats</p>
                            </div>
                            <div className="bg-white/10 p-10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transform hover:scale-105 transition-all aspect-square border border-white/10 shadow-2xl">
                                <TrophyIcon className="w-12 h-12 text-accent" />
                                <p className="font-black text-center text-xs uppercase tracking-widest">Premier Elite</p>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 5. TECH ENGINE */}
                <DeckSlide id="tech" className="bg-slate-50 text-slate-900">
                    <div className="flex flex-col md:flex-row items-center gap-20">
                        <div className="md:w-5/12">
                             <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 group-hover:scale-125 transition-transform duration-1000"><Logo className="w-64 h-auto" /></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="bg-accent/20 p-3 rounded-2xl w-fit"><BarChartIcon className="w-10 h-10 text-accent" /></div>
                                    <h3 className="text-3xl font-black text-white">Live Data Engine</h3>
                                    <div className="space-y-3">
                                        <div className="h-1.5 bg-white/10 rounded-full w-full"></div>
                                        <div className="h-1.5 bg-white/20 rounded-full w-4/5"></div>
                                        <div className="h-1.5 bg-accent/40 rounded-full w-3/5"></div>
                                    </div>
                                    <div className="pt-4 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Processing Latency</span>
                                        <span className="text-xl font-bold text-accent">&lt; 200ms</span>
                                    </div>
                                </div>
                             </div>
                        </div>
                        <div className="md:w-7/12 space-y-8">
                             <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-blue-600">The Technology</h4>
                                <h2 className="text-5xl md:text-7xl font-display font-black leading-tight tracking-tight text-slate-900">Built for Scale.</h2>
                            </div>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Our backend architecture is built on top of Firestore, ensuring real-time synchronization of match data across thousands of devices simultaneously.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                    <p className="font-black text-blue-600 mb-2 uppercase text-xs tracking-widest">Automation</p>
                                    <p className="text-sm font-medium text-slate-700">standing recalculation is instant. No more manual table updates.</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                    <p className="font-black text-purple-600 mb-2 uppercase text-xs tracking-widest">Integrations</p>
                                    <p className="text-sm font-medium text-slate-700">Bi-directional sync with global sports APIs and local payment gateways.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 6. COMMERCIAL */}
                <DeckSlide id="commercial" className="bg-slate-900">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-accent">Revenue Strategy</h4>
                                <h2 className="text-5xl md:text-7xl font-display font-black text-white leading-tight tracking-tight">The Business <br/> of Football.</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><MegaphoneIcon className="w-6 h-6 text-white"/></div>
                                    <h4 className="font-black text-white text-xl">Direct Advertising</h4>
                                    <p className="text-sm text-slate-400">Hard-coded, ad-blocker proof placements in high-engagement match center zones.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><BriefcaseIcon className="w-6 h-6 text-white"/></div>
                                    <h4 className="font-black text-white text-xl">SaaS for Clubs</h4>
                                    <p className="text-sm text-slate-400">Subscription-based management portals for clubs to control their digital identity.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-green-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><GlobeIcon className="w-6 h-6 text-white"/></div>
                                    <h4 className="font-black text-white text-xl">Marketplace Hub</h4>
                                    <p className="text-sm text-slate-400">Unified ticketing and merchandise fees from every transaction in the Kingdom.</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-accent w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><UsersIcon className="w-6 h-6 text-primary-dark"/></div>
                                    <h4 className="font-black text-white text-xl">Scouting Premium</h4>
                                    <p className="text-sm text-slate-400">Tiered access for international agents to verified player data and video highlights.</p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-5 bg-white/5 border border-white/10 p-12 rounded-[3rem] backdrop-blur-xl relative overflow-hidden">
                             <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>
                             <h4 className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-10 border-b border-white/10 pb-4">Revenue Breakdown (Year 1)</h4>
                             <div className="space-y-8">
                                {[
                                    { label: 'Sponsorship & Ads', val: '45%', color: 'bg-blue-500' },
                                    { label: 'Club Subscriptions', val: '30%', color: 'bg-purple-500' },
                                    { label: 'Transaction Fees', val: '15%', color: 'bg-green-500' },
                                    { label: 'Data Licensing', val: '10%', color: 'bg-accent' },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-sm text-blue-100">{item.label}</span>
                                            <span className="font-black text-accent">{item.val}</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: item.val }}></div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </DeckSlide>

                {/* 7. GROWTH & REACH */}
                <DeckSlide id="growth" className="bg-slate-950">
                    <div className="text-center mb-16 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-accent">Audience Potential</h4>
                        <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-tight">The Numbers.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricBox label="Projected Active Fans" value="50k+" sub="Monthly Active Users" />
                        <MetricBox label="Partner Inventory" value="100+" sub="Clubs & Academies Linked" />
                        <MetricBox label="Peak Traffic" value="2.4M" sub="Annual Page Impressions" />
                        <MetricBox label="Conversion" value="12min" sub="Avg. Session Duration" />
                    </div>
                    <div className="mt-16 text-center max-w-2xl mx-auto">
                        <p className="text-gray-500 font-medium leading-relaxed italic">
                            By centralizing the fan experience, we are creating a digital asset that grows every time a whistle blows in any region of Eswatini.
                        </p>
                    </div>
                </DeckSlide>

                {/* 8. CLOSING */}
                <DeckSlide id="closing" className="bg-primary relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                     <div className="relative z-10 text-center space-y-12">
                        <Logo className="h-20 w-auto mx-auto mb-12 drop-shadow-xl" />
                        <h2 className="text-5xl md:text-8xl font-display font-black text-white leading-tight tracking-tighter">
                            LET'S SCORE <br/> THE FUTURE.
                        </h2>
                        <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto font-medium opacity-80">
                            We are seeking visionary partners to scale this digital infrastructure across the entire Eswatini football landscape.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-10">
                            <Button className="bg-accent text-primary-dark h-16 px-12 rounded-2xl font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all text-sm">
                                Schedule Strategic Session
                            </Button>
                            <Button variant="ghost" onClick={() => window.history.back()} className="text-white h-16 px-12 rounded-2xl font-black uppercase tracking-widest border-2 border-white/20 hover:bg-white/10 text-sm">
                                Back to Hub
                            </Button>
                        </div>

                        <div className="pt-20">
                            <div className="inline-flex flex-col items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Official Technical Proposal</p>
                                <p className="text-[9px] font-bold text-white/20">FOOTBALL ESWATINI NEWS &bull; 2024-2025</p>
                            </div>
                        </div>
                     </div>
                </DeckSlide>
            </div>
        </div>
    );
};

export default PitchDeckPage;
