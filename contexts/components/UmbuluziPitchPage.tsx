
import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Logo from './Logo';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';
import TrophyIcon from './icons/TrophyIcon';
import GlobeIcon from './icons/GlobeIcon';
import UsersIcon from './icons/UsersIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import SmartphoneIcon from './icons/SmartphoneIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import { useNavigate } from 'react-router-dom';

const UmbuluziPitchPage: React.FC = () => {
    const navigate = useNavigate();
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12 px-4 print:bg-white print:p-0">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .pitch-card { border: none !important; shadow: none !important; margin: 0 !important; width: 100% !important; }
                    @page { margin: 1.5cm; size: A4; }
                }
            `}</style>

            <div className="container mx-auto max-w-4xl space-y-10">
                
                {/* HUD Header */}
                <div className="flex justify-between items-center no-print">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-all">
                        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>
                    <div className="flex gap-3">
                         <Button onClick={handlePrint} variant="outline" className="h-10 px-4 border-slate-200 text-slate-600 flex items-center gap-2">
                            <DownloadIcon className="w-4 h-4" /> Save as PDF
                        </Button>
                        <a href="mailto:sales@umbuluzi.sz">
                            <Button className="bg-primary text-white h-10 px-6 font-black uppercase tracking-widest text-[10px]">
                                Send Proposal
                            </Button>
                        </a>
                    </div>
                </div>

                {/* THE PROPOSAL CARD */}
                <Card className="shadow-2xl border-0 overflow-hidden rounded-[2.5rem] bg-white pitch-card">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-br from-blue-900 via-[#002B7F] to-blue-800 p-12 text-white relative">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <TrophyIcon className="w-48 h-48" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                <Logo className="h-10 w-auto" />
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Strategic Partnership</p>
                                    <p className="text-sm font-bold">Proposal: PR-2024-UVS</p>
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-display font-black leading-tight mb-4">
                                Fueling the <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-yellow-200 to-accent">Beautiful Game</span>
                            </h1>
                            <p className="text-lg text-blue-100 max-w-xl opacity-90">
                                A Strategic Seed Sponsorship Proposal prepared exclusively for **Umbuluzi Valley Sales**.
                            </p>
                        </div>
                    </div>

                    <CardContent className="p-8 md:p-16 space-y-12">
                        
                        {/* The Letter Body */}
                        <div className="space-y-6 text-gray-800 text-lg leading-relaxed font-serif text-justify">
                            <div className="not-italic font-sans mb-8">
                                <p className="font-bold text-gray-400 mb-2">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="text-sm">To,</p>
                                <p className="font-black text-gray-900 uppercase">The Management Team</p>
                                <p className="font-bold text-primary">Umbuluzi Valley Sales</p>
                                <p className="text-sm text-gray-500">Eswatini</p>
                            </div>

                            <p>Dear Partners at Umbuluzi Valley Sales,</p>

                            <p>
                                At <strong>Football Eswatini</strong>, we have long admired Umbuluzi Valley Sales for its unwavering commitment to providing high-quality, affordable food products to families across the Kingdom. You are a brand that understands the daily needs of our nation—just as we understand its greatest passion: <strong>Football</strong>.
                            </p>

                            <p>
                                I am writing to propose a landmark collaboration that would establish Umbuluzi Valley Sales as our primary <strong>Strategic Seed Sponsor</strong>. As we move to digitize every corner of Eswatini football—from the MTN Premier League to regional school tournaments—we believe your brand is the perfect partner to "Fuel the Game."
                            </p>

                            <h3 className="text-2xl font-display font-black text-primary border-b-2 border-primary/10 pb-2 mt-12 mb-6 uppercase">Why Umbuluzi Valley Sales?</h3>
                            
                            <p>
                                Our digital ecosystem is built on the same foundations as your business: <strong>Quality and Accessibility</strong>. While you ensure every household has access to top-tier nutrition at affordable prices, we ensure every fan has access to top-tier match data, news, and scouting profiles at zero cost to them.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10 not-italic font-sans">
                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4 shadow-md">
                                        <UsersIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <h4 className="font-bold text-blue-900 mb-2">Mass Consumer Reach</h4>
                                    <p className="text-sm text-blue-800/80">With 50,000+ monthly active fans, our platform mirrors your customer base. We reach the decision-makers who buy for their families every week.</p>
                                </div>
                                <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                                    <div className="bg-green-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4 shadow-md">
                                        <SparklesIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <h4 className="font-bold text-green-900 mb-2">Community Legacy</h4>
                                    <p className="text-sm text-green-800/80">By sponsoring the "Seed" phase, Umbuluzi will be credited with the digital birth of regional hubs in Hhohho, Manzini, Lubombo, and Shiselweni.</p>
                                </div>
                            </div>

                            <h3 className="text-2xl font-display font-black text-primary border-b-2 border-primary/10 pb-2 mt-12 mb-6 uppercase">Exclusive Partner Benefits</h3>
                            
                            <p>As our Seed Sponsor, Umbuluzi Valley Sales will enjoy unprecedented digital visibility:</p>
                            
                            <ul className="space-y-4 not-italic font-sans text-sm">
                                {[
                                    { title: "Title Placement:", desc: "Your logo on our 'Match Ticker' and 'Daily AI Briefing'—the highest traffic areas in the app." },
                                    { title: "Freshness Integration:", desc: "Custom 'Fuel of the Week' features highlighting top-performing players, directly associated with your fresh produce range." },
                                    { title: "Marketplace Presence:", desc: "Direct links to your sales channels when fans purchase tickets or merchandise." },
                                    { title: "Contextual Ads:", desc: "Ad-blocker proof banners placed within live commentary feeds and breaking news stories." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <CheckCircleIcon className="w-6 h-6 text-primary flex-shrink-0" />
                                        <div>
                                            <span className="font-bold text-gray-900">{item.title}</span>
                                            <span className="text-gray-600 ml-1">{item.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <p className="pt-8">
                                We are seeking a one-time seed commitment to finalize the technical infrastructure for our <strong>Regional Talent Hubs</strong>. This investment will directly empower thousands of youth players to be seen by national scouts for the first time in history.
                            </p>

                            <p>
                                We would welcome the opportunity to host you for a live demonstration of our platform at your offices. Let's work together to ensure that Eswatini's football is powered by the Kingdom's finest quality products.
                            </p>

                            <p className="mt-12">Yours Sincerely,</p>
                            
                            <div className="pt-4 not-italic font-sans">
                                <p className="font-black text-xl text-primary">Technical & Operations Lead</p>
                                <p className="text-sm text-gray-500 font-bold">Football Eswatini Digital Ecosystem</p>
                            </div>
                        </div>

                        {/* Interactive Stats Banner */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            <div className="relative z-10 flex-1 text-center md:text-left">
                                <h4 className="text-accent font-black uppercase text-xs tracking-widest mb-2">Digital Potential</h4>
                                <p className="text-3xl font-black mb-4">500,000+</p>
                                <p className="text-blue-100 opacity-60 text-sm">Projected Monthly Impressions across the Kingdom's 4 Regional Hubs.</p>
                            </div>
                            <div className="relative z-10 flex-1 border-y md:border-y-0 md:border-x border-white/10 px-8 py-4 text-center">
                                <h4 className="text-accent font-black uppercase text-xs tracking-widest mb-2">Engagement</h4>
                                <p className="text-3xl font-black mb-4">12 Mins</p>
                                <p className="text-blue-100 opacity-60 text-sm">Average session duration per fan during peak MTN Premier League match hours.</p>
                            </div>
                            <div className="relative z-10 flex-1 text-center md:text-right">
                                <ShieldCheckIcon className="w-12 h-12 text-accent mx-auto md:ml-auto mb-4" />
                                <p className="font-bold">Verified Reach</p>
                                <p className="text-blue-100 opacity-60 text-sm">Targeted demographics: Households, Youth, and Regional Communities.</p>
                            </div>
                        </div>

                        <div className="text-center pt-10 border-t border-gray-100 no-print">
                            <p className="text-sm text-gray-500 mb-6 font-medium">Ready to discuss the next generation of Eswatini's digital sports?</p>
                            <Button className="bg-primary text-white h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                                Schedule a Technical Demo
                            </Button>
                        </div>
                    </CardContent>
                    
                    <div className="bg-gray-50 p-6 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        Football Eswatini &copy; 2024 &bull; Digital Infrastructure Department
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default UmbuluziPitchPage;
