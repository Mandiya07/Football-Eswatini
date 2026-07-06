import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import FileTextIcon from './icons/FileTextIcon';
import BuildingIcon from './icons/BuildingIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import TrophyIcon from './icons/TrophyIcon';
import SparklesIcon from './icons/SparklesIcon';
import EFAStatsSection from './EFAStatsSection';
import { fetchEFACommunications, fetchEFAEvents, EFACommunication, EFAEvent } from '../services/api';
import Spinner from './ui/Spinner';

const EFAHubPage: React.FC = () => {
    const [communications, setCommunications] = useState<EFACommunication[]>([]);
    const [events, setEvents] = useState<EFAEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [commsData, eventsData] = await Promise.all([
                fetchEFACommunications(),
                fetchEFAEvents()
            ]);
            setCommunications(commsData);
            setEvents(eventsData);
            setLoading(false);
        };
        loadData();
    }, []);

    const renderIcon = (type?: string) => {
        switch(type) {
            case 'shield': return <ShieldCheckIcon className="w-6 h-6" />;
            case 'building': return <BuildingIcon className="w-6 h-6" />;
            case 'megaphone': return <MegaphoneIcon className="w-6 h-6" />;
            default: return <FileTextIcon className="w-6 h-6" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero Branding Section */}
            <div className="bg-[#002B7F] text-white py-16 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <ShieldCheckIcon className="w-64 h-64" />
                </div>
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-white p-4 rounded-3xl shadow-2xl">
                            <ShieldCheckIcon className="w-20 h-20 text-[#002B7F]" />
                        </div>
                        <div>
                            <div className="bg-accent/20 backdrop-blur-md px-4 py-1 rounded-full inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-accent/20 mb-4">
                                <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                                Official App Sponsor
                            </div>
                            <h1 className="text-4xl md:text-6xl font-display font-black leading-tight mb-4">
                                Eswatini Football <br/> Association Hub
                            </h1>
                            <p className="text-xl text-blue-100 max-w-2xl font-medium">
                                Supporting the growth, development, and digital transformation of football in the Kingdom of Eswatini.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <EFAStatsSection />

            <main className="container mx-auto max-w-6xl mt-12 px-4 space-y-20">
                <div className="space-y-12">
                     {/* Public Notices section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <h2 className="text-3xl font-display font-black text-gray-900 flex items-center gap-3">
                                <MegaphoneIcon className="w-8 h-8 text-blue-600" /> Latest EFA Communications
                            </h2>
                            
                            {loading ? (
                                <div className="flex justify-center p-12"><Spinner /></div>
                            ) : communications.length > 0 ? (
                                communications.map((notice, i) => (
                                    <Card key={i} className="hover:shadow-2xl transition-all border-0 shadow-lg overflow-hidden group rounded-[2rem]">
                                        <CardContent className="p-0 flex flex-col md:flex-row">
                                            <div className="bg-blue-50 p-8 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                                {renderIcon(notice.iconType)}
                                            </div>
                                            <div className="p-8 flex-grow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{notice.category}</span>
                                                    <span className="text-xs text-gray-400 font-bold">{notice.date}</span>
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{notice.title}</h3>
                                                <p className="text-gray-600 text-sm leading-relaxed mb-6">{notice.summary}</p>
                                                <Button variant="ghost" className="p-0 h-auto text-blue-600 hover:text-blue-800 font-black flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                    Read Full Document <ArrowRightIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-gray-500">No recent communications available.</p>
                            )}
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-8">
                            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-[2rem] border-0 shadow-2xl overflow-hidden relative">
                                <div className="absolute -bottom-10 -right-10 opacity-20">
                                    <TrophyIcon className="w-40 h-40" />
                                </div>
                                <CardContent className="p-8 relative z-10">
                                    <h3 className="text-2xl font-bold mb-6">Partner With EFA</h3>
                                    <p className="text-blue-100 text-sm mb-8 leading-relaxed">
                                        We are committed to providing the technical backbone for Eswatini football. Together we grow the game.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Corporate Affairs</p>
                                            <p className="text-sm font-bold">ceo@efa.org.sz</p>
                                        </div>
                                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Technical Dept</p>
                                            <p className="text-sm font-bold">technical@efa.org.sz</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-0 shadow-xl p-8 bg-white">
                                <h3 className="text-xl font-black mb-6">Upcoming Events</h3>
                                {loading ? (
                                    <div className="flex justify-center p-6"><Spinner /></div>
                                ) : events.length > 0 ? (
                                    <div className="space-y-6">
                                        {events.map((ev, i) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl font-black text-center min-w-[60px]">
                                                    <span className="block text-xs uppercase tracking-tighter">{ev.date.split(' ')[1]}</span>
                                                    <span className="text-lg">{ev.date.split(' ')[0]}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{ev.event}</p>
                                                    <p className="text-xs text-gray-400 font-medium">{ev.location}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No upcoming events scheduled.</p>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sponsorship Footer Branding */}
            <div className="container mx-auto max-w-6xl mt-20 px-4">
                <Card className="bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-[2.5rem] p-12 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-yellow-400/20 p-4 rounded-full">
                            <SparklesIcon className="w-10 h-10 text-yellow-600" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Proud App Sponsor</h3>
                    <p className="text-gray-600 max-w-xl mx-auto leading-relaxed font-medium">
                        The Eswatini Football Association is proud to sponsor the digital ecosystem, ensuring high-depth soccer data remains free and accessible for every fan in the Kingdom.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default EFAHubPage;
