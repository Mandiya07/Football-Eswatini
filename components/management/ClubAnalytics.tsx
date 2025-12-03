
import React from 'react';
import { Card, CardContent } from '../ui/Card';
import BarChartIcon from '../icons/BarChartIcon';
import UsersIcon from '../icons/UsersIcon';
import NewspaperIcon from '../icons/NewspaperIcon';
import VoteIcon from '../icons/VoteIcon';
import ArrowUpIcon from '../icons/ArrowUpIcon';

const StatCard: React.FC<{ title: string; value: string; change: string; Icon: any; color: string }> = ({ title, value, change, Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
            <span className="inline-flex items-center text-xs font-semibold text-green-600 mt-2 bg-green-50 px-2 py-0.5 rounded-full">
                <ArrowUpIcon className="w-3 h-3 mr-1" /> {change} this month
            </span>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const ClubAnalytics: React.FC<{ clubName: string }> = ({ clubName }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h3 className="text-2xl font-bold font-display text-gray-900">Performance Analytics</h3>
                    <p className="text-sm text-gray-500">Overview of your club's digital footprint for the current month.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100">
                    Plan: <span className="font-bold">Enterprise</span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Profile Visits" 
                    value="12,450" 
                    change="+18%" 
                    Icon={UsersIcon} 
                    color="bg-blue-600" 
                />
                <StatCard 
                    title="News Reads" 
                    value="8,203" 
                    change="+24%" 
                    Icon={NewspaperIcon} 
                    color="bg-purple-600" 
                />
                <StatCard 
                    title="Fan Interactions" 
                    value="3,105" 
                    change="+12%" 
                    Icon={VoteIcon} 
                    color="bg-yellow-500" 
                />
                <StatCard 
                    title="Avg. Engagement" 
                    value="4.5m" 
                    change="+5%" 
                    Icon={BarChartIcon} 
                    color="bg-green-600" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Content Performance */}
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Top Performing Content</h4>
                        <div className="space-y-4">
                            {[
                                { title: "Match Report: 2-1 Victory over Highlanders", views: 2400, type: "Article" },
                                { title: "New Signing Announcement: M. Dlamini", views: 1850, type: "Article" },
                                { title: "Training Session Gallery - Week 4", views: 1200, type: "Gallery" },
                                { title: "Coach's Post-Match Interview", views: 950, type: "Video" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                                        <p className="text-xs text-gray-500">{item.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{item.views.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400">Views</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Squad Popularity */}
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4">Player Scouting Interest (Views)</h4>
                        <div className="space-y-6">
                            {[
                                { name: "Musa Ndlovu", role: "Forward", percent: 85 },
                                { name: "Sipho Dlamini", role: "Midfielder", percent: 65 },
                                { name: "Banele Shongwe", role: "Defender", percent: 45 },
                            ].map((player, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-gray-700">{player.name} <span className="text-gray-400 font-normal">- {player.role}</span></span>
                                        <span className="font-bold text-blue-600">{player.percent}k Views</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${player.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t">
                            <h4 className="text-sm font-bold text-gray-800 mb-2">Audience Insights (Sponsorship Data)</h4>
                            <div className="flex gap-2">
                                <div className="h-4 bg-blue-600 rounded-l-md" style={{width: '40%'}} title="Manzini (40%)"></div>
                                <div className="h-4 bg-blue-400" style={{width: '30%'}} title="Hhohho (30%)"></div>
                                <div className="h-4 bg-blue-300" style={{width: '20%'}} title="Lubombo (20%)"></div>
                                <div className="h-4 bg-gray-300 rounded-r-md" style={{width: '10%'}} title="Shiselweni (10%)"></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>Manzini (40%)</span>
                                <span>Hhohho (30%)</span>
                                <span>Lubombo (20%)</span>
                                <span>Other (10%)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClubAnalytics;
