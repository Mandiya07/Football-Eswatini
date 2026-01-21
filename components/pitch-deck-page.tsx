
import React, { useState } from 'react';
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

const DeckSlide: React.FC<{ children: React.ReactNode; className?: string; id: string }> = ({ children, className = "", id }) => {
    const slideRef = React.useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!slideRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(slideRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#000000'
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `FE-PitchDeck-${id}.png`;
            link.click();
        } catch (error) {
            console.error(error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <section id={id} className={`min-h-screen flex flex-col justify-center relative snap-start border-b border-gray-100 ${className}`}>
            <div ref={slideRef} className="h-full w-full py-20 px-4 flex items-center justify-center">
                <div className="container mx-auto max-w-6xl w-full">
                    {children}
                </div>
            </div>
            {/* Contextual Download Button for Each Slide */}
            <div className="absolute bottom-6 right-6 no-print">
                <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="bg-white/10 backdrop-blur-md text-white/60 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all border border-white/10 flex items-center gap-2"
                >
                    {downloading ? <Spinner className="w-4 h-4 border-white/20 border-t-white" /> : <DownloadIcon className="w-5 h-5" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{downloading ? 'Saving...' : 'Save Slide'}</span>
                </button>
            </div>
        </section>
    );
};

const FeatureNode: React.FC<{ icon: any; title: string; desc: string; color: string }> = ({ icon: Icon, title, desc, color }) => (
    <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
            <Icon className={`w-8 h-8 ${color}`} />
        </div>
        <div>
            <h4 className="font-bold text-xl text-gray-900 mb-1">{title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

const PitchDeckPage: React.FC = () => {
    return (
        <div className="bg-white overflow-hidden scroll-smooth snap-y snap-mandatory h-screen overflow-y-auto no-scrollbar">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes float { 
                    0% { transform: translateY(0px); } 
                    50% { transform: translateY(-20px); } 
                    100% { transform: translateY(0px); } 
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
            `}</style>

            {/* FIXED NAV - HUD STYLE */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-fit no-print">
                <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-8">
                    <Logo className="h-6 w-auto" />
                    <div className="hidden md:flex gap-6 text-[10px] font-black uppercase tracking-widest text-white/50">
                        <a href="#vision" className="hover:text-white transition-colors">Vision</a>
                        <a href="#ecosystem" className="hover:text-white transition-colors">Ecosystem</a>
                        <a href="#data" className="hover:text-white transition-colors">Data</a>
                        <a href="#commercial" className="hover:text-white transition-colors">Commercial</a>
                    </div>
                    <Button onClick={() => window.history.back()} variant="outline" className="h-8 border-white/20 text-white hover:bg-white/10 text-[10px] uppercase font-black">
                        Exit Deck
                    </Button>
                </div>
            </div>

            {/* SLIDE 1: COVER */}
            <DeckSlide id="vision" className="bg-slate-950 text-white relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                
                <div className="relative z-10 text-center">
                    <div className="bg-blue-600/20 backdrop-blur-md px-4 py-1 rounded-full inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-white/10 mb-8 text-blue-400">
                        <SparklesIcon className="w-4 h-4" /> The Future of Football in Eswatini
                    </div>
                    <h1 className="text-5xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8">
                        DIGITIZING <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-300 to-accent">THE PASSION</span>
                    </h1>
                    <p className="text-xl md:text-3xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed mb-12 italic">
                        "Unifying the Kingdom through a world-class digital sports infrastructure."
                    </p>
                    <div className="flex justify-center gap-4">
                        <a href="#ecosystem">
                            <Button className="bg-accent text-primary-dark h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                                Explore Ecosystem
                            </Button>
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Scroll Down</p>
                    <div className="w-0.5 h-10 bg-gradient-to-b from-white/20 to-transparent"></div>
                </div>
            </DeckSlide>

            {/* SLIDE 2: THE CHALLENGE */}
            <DeckSlide id="challenge" className="bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-display font-black text-gray-900 mb-8 leading-tight">
                            The Fragmentation <br/> Problem.
                        </h2>
                        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                            Currently, Eswatini football data is scattered across social media groups, physical notebooks, and word of mouth. Fans struggle to find scores, scouts can't track talent, and sponsors lack real metrics.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">!</div>
                                <p className="text-red-900 font-bold">90% of regional matches are not tracked digitally.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">!</div>
                                <p className="text-red-900 font-bold">Zero centralized platform for youth & women's stats.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 rotate-2">
                             <img src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=800&q=80" className="rounded-2xl w-full h-80 object-cover" />
                        </div>
                        <div className="absolute -bottom-10 -left-10 bg-primary text-white p-8 rounded-3xl shadow-2xl -rotate-3 max-w-xs">
                            <p className="text-2xl font-black mb-2">Our Solution</p>
                            <p className="text-sm opacity-80">A high-depth, interactive mobile-first platform that centralizes every level of play.</p>
                        </div>
                    </div>
                </div>
            </DeckSlide>

            {/* SLIDE 3: THE ECOSYSTEM */}
            <DeckSlide id="ecosystem" className="bg-primary-dark text-white">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-6xl font-display font-black mb-4">Total Football Ecosystem</h2>
                    <p className="text-blue-200 text-lg">Connecting every stakeholder in the sport.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                        <TrophyIcon className="w-12 h-12 text-accent mb-6" />
                        <h3 className="text-xl font-bold mb-3">Elite Tier</h3>
                        <p className="text-sm text-blue-100 opacity-70">Official match centers for Premier League and National Teams (Sihlangu & Sitsebe).</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                        <GlobeIcon className="w-12 h-12 text-blue-400 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Regional Hubs</h3>
                        <p className="text-sm text-blue-100 opacity-70">Dedicated spaces for Hhohho, Manzini, Lubombo, and Shiselweni super leagues.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                        <UsersIcon className="w-12 h-12 text-green-400 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Grassroots</h3>
                        <p className="text-sm text-blue-100 opacity-70">School tournaments, U-17 championships, and community festival tracking.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                        <SparklesIcon className="w-12 h-12 text-purple-400 mb-6" />
                        <h3 className="text-xl font-bold mb-3">Commercial</h3>
                        <p className="text-sm text-blue-100 opacity-70">Unified marketplace for club merchandise and match ticketing.</p>
                    </div>
                </div>
            </DeckSlide>

            {/* SLIDE 4: THE DATA ENGINE */}
            <DeckSlide id="data" className="bg-white">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="md:w-1/2">
                        <div className="bg-blue-600 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="bg-white/20 p-2 rounded-lg w-fit"><BarChartIcon className="w-8 h-8 text-white"/></div>
                                <h3 className="text-3xl font-black text-white">Live Data Engine</h3>
                                <div className="space-y-2">
                                    <div className="h-2 bg-white/20 rounded w-full"></div>
                                    <div className="h-2 bg-white/40 rounded w-3/4"></div>
                                    <div className="h-2 bg-white/20 rounded w-5/6"></div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-[10px] font-black uppercase text-white/60">Real-time Recalculation</span>
                                    <span className="text-2xl font-black text-accent">99.8% Accuracy</span>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform"><Logo className="w-48 h-auto" /></div>
                        </div>
                    </div>
                    <div className="md:w-1/2">
                        <h2 className="text-4xl md:text-6xl font-display font-black text-gray-900 mb-6">Built for Accuracy.</h2>
                        <p className="text-gray-600 text-lg mb-8">
                            Our proprietary algorithm recalculates league standings and player statistics instantly when results are submitted through the secure official portal.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                <span className="font-bold text-gray-800">Advanced Tie-Breaker Logic (GD, GS, AW)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                <span className="font-bold text-gray-800">Multi-Admin Verification Pipeline</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                                <span className="font-bold text-gray-800">Scout-Ready Historical Performance Logs</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </DeckSlide>

            {/* SLIDE 5: COMMERCIAL VALUE */}
            <DeckSlide id="commercial" className="bg-slate-900 text-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10">
                        <h2 className="text-4xl md:text-6xl font-display font-black text-white">Commercial Value.</h2>
                        <div className="space-y-6">
                            <FeatureNode 
                                icon={MegaphoneIcon} 
                                title="Contextual Advertising" 
                                desc="High-traffic banners in live match tickers and news articles that bypass traditional ad-blockers." 
                                color="text-yellow-400" 
                            />
                            <FeatureNode 
                                icon={ShieldIcon} 
                                title="Enterprise Club Portals" 
                                desc="Subscription-based management tools for clubs to monetize their own fan base through gear and tickets." 
                                color="text-blue-400" 
                            />
                            <FeatureNode 
                                icon={GlobeIcon} 
                                title="Global Scouting Market" 
                                desc="Direct revenue from premium scouting access and verified player data archives." 
                                color="text-green-400" 
                            />
                        </div>
                    </div>
                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 backdrop-blur-sm text-center">
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-6">Projected Reach (Year 1)</p>
                        <div className="space-y-8">
                            <div><p className="text-6xl font-black">50k+</p><p className="text-sm opacity-50 font-bold uppercase mt-1">Monthly Active Fans</p></div>
                            <div><p className="text-6xl font-black">100%</p><p className="text-sm opacity-50 font-bold uppercase mt-1">League Integration</p></div>
                        </div>
                    </div>
                </div>
            </DeckSlide>

            {/* SLIDE 6: CLOSING */}
            <DeckSlide id="closing" className="bg-primary text-white text-center">
                <Logo className="h-24 w-auto mx-auto mb-10" />
                <h2 className="text-4xl md:text-7xl font-display font-black mb-6">Join the Digital Revolution.</h2>
                <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                    We are seeking strategic partners to scale this infrastructure across all four regions of the Kingdom.
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-20">
                    <Button className="bg-accent text-primary-dark px-10 py-4 h-auto text-lg font-black rounded-2xl shadow-2xl hover:scale-105 transition-transform">
                        Schedule a Demo
                    </Button>
                    <Button variant="outline" className="border-white text-white px-10 py-4 h-auto text-lg font-bold rounded-2xl hover:bg-white/10">
                        Request Tech Audit
                    </Button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    Football Eswatini Digital Platform &copy; 2024 &bull; Designed for Excellence
                </p>
            </DeckSlide>
        </div>
    );
};

export default PitchDeckPage;
