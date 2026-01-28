import React, { useState, useEffect } from 'react';
import AIDailyBriefing from '../AIDailyBriefing';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import SparklesIcon from '../icons/SparklesIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import BarChartIcon from '../icons/BarChartIcon';
import { fetchMerchantBalance, MerchantBalance } from '../../services/api';
import Spinner from '../ui/Spinner';

const AdminInsights: React.FC = () => {
    const [balance, setBalance] = useState<MerchantBalance | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await fetchMerchantBalance();
            setBalance(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h3 className="text-2xl font-bold font-display text-gray-900 mb-2">Strategy & Insights</h3>
                    <p className="text-sm text-gray-500">Internal AI-driven summaries and corporate strategy materials.</p>
                </div>
                {loading ? <Spinner className="w-6 h-6"/> : (
                    <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl flex items-center gap-4 shadow-sm">
                        <div className="bg-green-600 p-1.5 rounded-lg"><BarChartIcon className="w-4 h-4 text-white"/></div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-green-600 tracking-widest">Platform Revenue</p>
                            <p className="text-lg font-black text-gray-900">E{balance?.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-4xl">
                <AIDailyBriefing />
            </div>

            <Card className="shadow-lg border-l-4 border-primary bg-slate-900 text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-5 scale-125 transform group-hover:rotate-12 transition-transform duration-1000">
                    <SparklesIcon className="w-48 h-48 text-accent" />
                </div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 rounded-full mb-3 border border-accent/20">
                                <SparklesIcon className="w-3.5 h-3.5 text-accent" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-accent">Internal Roadmap</span>
                            </div>
                            <h2 className="text-2xl font-display font-bold text-white mb-2">Enterprise Pitch Deck</h2>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                Access the latest strategic vision for Football Eswatini. Use this deck for presentations with potential government partners and high-level corporate sponsors.
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Link to="/pitch-deck">
                                <Button className="bg-white text-gray-900 font-bold px-8 h-12 rounded-xl hover:bg-accent transition-all shadow-xl flex items-center gap-2 text-xs uppercase tracking-widest">
                                    View Pitch Deck <ArrowRightIcon className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-6">
                        <h4 className="font-bold text-blue-900 mb-2">AI Content Strategy</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                            The Daily Briefing uses your latest match data and news headlines to synthesize a high-energy summary. If the data seems stale, ensure all recent results are approved in the Data Center.
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="p-6">
                        <h4 className="font-bold text-purple-900 mb-2">Partner Presentations</h4>
                        <p className="text-sm text-purple-800 leading-relaxed">
                            Need customized slides for a specific sponsor? Use the "Export Slide" feature within the Pitch Deck to download high-resolution PNGs for your reports.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminInsights;
