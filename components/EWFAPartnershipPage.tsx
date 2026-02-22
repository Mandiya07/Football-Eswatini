
import React from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ShieldIcon from './icons/ShieldIcon';
import TrophyIcon from './icons/TrophyIcon';
import WomanIcon from './icons/WomanIcon';
import GlobeIcon from './icons/GlobeIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import SparklesIcon from './icons/SparklesIcon';
import DownloadIcon from './icons/DownloadIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';

const EWFAPartnershipPage: React.FC = () => {
    return (
        <div className="bg-gray-100 min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-5xl">
                
                {/* Header Controls */}
                <div className="flex justify-between items-center mb-10 no-print">
                    <button onClick={() => window.history.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
                        <ArrowLeftIcon className="w-4 h-4"/> Back
                    </button>
                    <button onClick={() => window.print()} className="bg-white border p-2.5 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2 text-sm font-bold text-gray-700">
                        <DownloadIcon className="w-5 h-5 text-blue-600"/> Save as PDF / Print
                    </button>
                </div>

                <div className="space-y-12">
                    {/* Cover Section */}
                    <Card className="shadow-2xl border-0 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-900 via-blue-800 to-pink-900 text-white relative">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <WomanIcon className="w-64 h-64" />
                        </div>
                        <CardContent className="p-12 md:p-20 relative z-10">
                            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-white/20 mb-8">
                                <SparklesIcon className="w-4 h-4 text-yellow-300"/> Strategic Partnership Proposal
                            </div>
                            <h1 className="text-4xl md:text-7xl font-display font-black leading-tight mb-6">
                                Elevating Women's <br/> Football in Eswatini
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl leading-relaxed mb-10">
                                A proposal to the Eswatini Women’s Football Association (EWFA) for digital integration, professionalization, and commercial growth.
                            </p>
                            <div className="flex flex-wrap gap-4 border-t border-white/10 pt-10">
                                <div>
                                    <p className="text-xs font-black uppercase text-blue-300 tracking-widest mb-1">Prepared For</p>
                                    <p className="font-bold">The EWFA Executive Committee</p>
                                </div>
                                <div className="ml-0 md:ml-12">
                                    <p className="text-xs font-black uppercase text-blue-300 tracking-widest mb-1">Date</p>
                                    <p className="font-bold">November 2024</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 1: The Challenge */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <h2 className="text-3xl font-display font-black text-gray-900 mb-4">The Strategic Opportunity</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Despite the immense talent within the MTN Women's League and Sitsebe SaMhlekazi, digital visibility remains a critical gap. 
                            </p>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: "Visibility Gap", desc: "Women's football news is often buried. Fans need a dedicated home." },
                                { title: "Data Modernization", desc: "Real-time tracking of goals, assists, and league standings for women." },
                                { title: "Commercial Potential", desc: "Opening new revenue streams through digital advertising and merchandise." },
                                { title: "Talent Pipeline", desc: "Highlighting youth development and creating digital scouting profiles." }
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h4 className="font-black text-blue-900 mb-2">{item.title}</h4>
                                    <p className="text-sm text-gray-600">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: The Women's Digital Hub */}
                    <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-[2rem]">
                        <div className="h-2 bg-pink-600"></div>
                        <CardContent className="p-10">
                            <div className="flex flex-col md:flex-row items-center gap-10">
                                <div className="md:w-1/2 space-y-6">
                                    <div className="bg-pink-100 p-4 rounded-2xl w-fit">
                                        <WomanIcon className="w-10 h-10 text-pink-600" />
                                    </div>
                                    <h3 className="text-3xl font-display font-black text-gray-900">A Dedicated <span className="text-pink-600">Women's Hub</span></h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        We propose the creation of a high-depth "Women's Football" landing page within the Football Eswatini app. This is not just a sub-category; it is a full-featured ecosystem.
                                    </p>
                                    <ul className="space-y-4">
                                        {[
                                            "Real-time Scores & Logs for the Women's Elite League",
                                            "National Team (Sitsebe) Official Match Center",
                                            "Interactive 'Woman of the Match' Fan Voting",
                                            "Digital Scouting Hub for Girls Academy Development"
                                        ].map((li, i) => (
                                            <li key={i} className="flex items-center gap-3">
                                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                                <span className="font-bold text-gray-800">{li}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="md:w-1/2 bg-gray-50 rounded-[2rem] p-10 border border-dashed border-gray-300">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Projected Impact (12 Months)</p>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                                <p className="text-3xl font-black text-pink-600">400%</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Increase in Exposure</p>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl shadow-sm">
                                                <p className="text-3xl font-black text-blue-600">15k+</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Active Female Users</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Commercial & Sponsorship */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-slate-900 text-white p-8 rounded-[2rem] border-0">
                            <CardContent className="p-0">
                                <MegaphoneIcon className="w-12 h-12 text-yellow-400 mb-6" />
                                <h3 className="text-2xl font-bold mb-4">Commercial Empowerment</h3>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                    We will provide every Women's League club with an **Enterprise Management Portal**, allowing them to manage their own news and merchandise.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center text-yellow-400">E</div>
                                        <div>
                                            <p className="font-bold text-sm">Merchandise Integration</p>
                                            <p className="text-xs text-slate-400">Clubs can sell replicas & scarfs directly to fans in the app.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center text-blue-400">S</div>
                                        <div>
                                            <p className="font-bold text-sm">Sponsorship Slots</p>
                                            <p className="text-xs text-slate-400">Dedicated ad space for EWFA partners in high-traffic zones.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-lg">
                            <CardContent className="p-0">
                                <GlobeIcon className="w-12 h-12 text-blue-600 mb-6" />
                                <h3 className="text-2xl font-bold mb-4 text-gray-900">National Pride Hub</h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    A permanent, high-quality showcase for the Senior National Team and youth squads.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-800">Sitsebe SaMhlekazi historical archive.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-800">Live coverage of international friendly games.</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-800">Exclusive video content: Training & Interviews.</span>
                                    </li>
                                </ul>
                                <Button className="w-full mt-8 bg-blue-600 text-white font-bold h-12">Download Full Tech Specs</Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center py-12">
                        <h2 className="text-3xl font-display font-black text-gray-900 mb-4">Let's Build the Future Together</h2>
                        <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
                            Football Eswatini is ready to commit technical resources to make this hub a reality. We invite the EWFA to a formal demonstration of the platform.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a href="mailto:partnerships@footballeswatini.com" className="w-full sm:w-auto">
                                <Button className="bg-primary text-white h-14 px-12 text-lg font-black shadow-xl hover:scale-105 transition-all">
                                    Request Official Meeting
                                </Button>
                            </a>
                            <Button variant="outline" onClick={() => window.location.href = '#/contact'} className="h-14 px-12 text-lg font-bold border-gray-300">
                                Contact Development Team
                            </Button>
                        </div>
                    </div>
                </div>

                <footer className="mt-20 pt-10 border-t border-gray-200 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Football Eswatini Digital Platform &copy; 2024
                </footer>
            </div>
        </div>
    );
};

export default EWFAPartnershipPage;
