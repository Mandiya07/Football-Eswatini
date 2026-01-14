
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import DownloadIcon from '../icons/DownloadIcon';
import FileTextIcon from '../icons/FileTextIcon';
import ScaleIcon from '../icons/ScaleIcon';
import ShieldIcon from '../icons/ShieldIcon';
import TrophyIcon from '../icons/TrophyIcon';
import WomanIcon from '../icons/WomanIcon';
import GlobeIcon from '../icons/GlobeIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import SparklesIcon from '../icons/SparklesIcon';
import MegaphoneIcon from '../icons/MegaphoneIcon';
import NDAGenerator from './NDAGenerator';

const EWFAProposalView: React.FC = () => {
    return (
        <div className="space-y-12 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in print:p-0 print:border-0 print:shadow-none">
            {/* Cover Section */}
            <div className="overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-900 via-blue-800 to-pink-900 text-white relative print:rounded-none">
                <div className="absolute top-0 right-0 p-12 opacity-10 print:hidden">
                    <WomanIcon className="w-64 h-64" />
                </div>
                <div className="p-12 md:p-20 relative z-10">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest border border-white/20 mb-8 print:border-blue-300 print:text-blue-100">
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
                </div>
            </div>

            {/* Section 1: The Challenge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:block print:space-y-6">
                <div className="md:col-span-1">
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4">The Strategic Opportunity</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Despite the immense talent within the MTN Women's League and Sitsebe SaMhlekazi, digital visibility remains a critical gap. 
                    </p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                    {[
                        { title: "Visibility Gap", desc: "Women's football news is often buried. Fans need a dedicated home." },
                        { title: "Data Modernization", desc: "Real-time tracking of goals, assists, and league standings for women." },
                        { title: "Commercial Potential", desc: "Opening new revenue streams through digital advertising and merchandise." },
                        { title: "Talent Pipeline", desc: "Highlighting youth development and creating digital scouting profiles." }
                    ].map((item, i) => (
                        <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 print:bg-white print:border-gray-200">
                            <h4 className="font-black text-blue-900 mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 2: The Women's Digital Hub */}
            <div className="bg-white border border-gray-100 shadow-xl rounded-[2rem] overflow-hidden print:shadow-none print:border-gray-200">
                <div className="h-2 bg-pink-600"></div>
                <div className="p-10">
                    <div className="flex flex-col md:flex-row items-center gap-10 print:flex-row">
                        <div className="md:w-1/2 space-y-6 print:w-1/2">
                            <div className="bg-pink-100 p-4 rounded-2xl w-fit print:hidden">
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
                        <div className="md:w-1/2 bg-gray-50 rounded-[2rem] p-10 border border-dashed border-gray-300 print:w-1/2 print:bg-white print:border-solid">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Projected Impact (12 Months)</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <p className="text-3xl font-black text-pink-600">400%</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Increase in Exposure</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <p className="text-3xl font-black text-blue-600">15k+</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Active Female Users</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="pt-10 border-t border-gray-200 text-center text-[10px] font-black uppercase text-gray-400 tracking-widest print:block">
                Football Eswatini News Digital Platform &copy; 2024 - Confidential Strategic Document
            </footer>
        </div>
    );
};

const LegalAndContracts: React.FC = () => {
    const [activeDoc, setActiveDoc] = useState<'nda' | 'ewfa'>('nda');

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-lg animate-fade-in no-print">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <ScaleIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-display text-gray-900">Legal & Contracts Hub</h3>
                                <p className="text-sm text-gray-500">Manage and generate official partnership documentation.</p>
                            </div>
                        </div>
                        <Button onClick={handleDownload} className="bg-primary text-white hover:bg-primary-dark flex items-center gap-2 h-11 px-6 shadow-md">
                            <DownloadIcon className="w-5 h-5" /> Download as PDF
                        </Button>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                        <button 
                            onClick={() => setActiveDoc('nda')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeDoc === 'nda' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            NDA Generator
                        </button>
                        <button 
                            onClick={() => setActiveDoc('ewfa')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeDoc === 'ewfa' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            EWFA Partnership Proposal
                        </button>
                    </div>
                </CardContent>
            </Card>

            <div className="print:m-0">
                {activeDoc === 'nda' ? <NDAGenerator /> : <EWFAProposalView />}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                    .container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
                    header, footer, aside { display: none !important; }
                    .bg-eswatini-pattern::before { display: none !important; }
                    .bg-eswatini-pattern { background: white !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};

export default LegalAndContracts;
