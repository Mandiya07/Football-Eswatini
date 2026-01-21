
import React from 'react';
import AIDailyBriefing from '../AIDailyBriefing';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import SparklesIcon from '../icons/SparklesIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';

const AdminInsights: React.FC = () => {
    return (
        <div className="space-y-10 animate-fade-in">
            <div>
                <h3 className="text-2xl font-bold font-display text-gray-900 mb-2">Strategy & Insights</h3>
                <p className="text-sm text-gray-500">Internal AI-driven summaries and corporate strategy materials.</p>
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
