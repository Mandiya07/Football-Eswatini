
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import BarChartIcon from '../icons/BarChartIcon';
import UsersIcon from '../icons/UsersIcon';
import NewspaperIcon from '../icons/NewspaperIcon';
import VoteIcon from '../icons/VoteIcon';
import ArrowUpIcon from '../icons/ArrowUpIcon';
import InfoIcon from '../icons/InfoIcon';
import { fetchAllCompetitions, fetchNews } from '../../services/api';
import { superNormalize } from '../../services/utils';
import Spinner from '../ui/Spinner';

const StatCard: React.FC<{ title: string; value: string | number; change: string; Icon: any; color: string }> = ({ title, value, change, Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
            <span className="inline-flex items-center text-xs font-semibold text-green-600 mt-2 bg-green-50 px-2 py-0.5 rounded-full">
                <ArrowUpIcon className="w-3 h-3 mr-1" /> {change}
            </span>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const ClubAnalytics: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [stats, setStats] = useState({
        rosterCount: 0,
        articleCount: 0,
        goalsTotal: 0,
        avgAge: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [allComps, news] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchNews()
                ]);
                
                const normName = superNormalize(clubName);
                
                // Scan ALL hubs for the team entry
                let teamEntry = null;
                for (const comp of Object.values(allComps)) {
                    const match = comp.teams?.find(t => superNormalize(t.name) === normName);
                    if (match) {
                        teamEntry = match;
                        break;
                    }
                }

                const clubArticles = news.filter(n => {
                    const cats = Array.isArray(n.category) ? n.category : [n.category];
                    return cats.some(c => superNormalize(c) === normName || c === 'Club News');
                });

                if (teamEntry) {
                    const players = teamEntry.players || [];
                    const goals = players.reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
                    const ageSum = players.reduce((sum, p) => sum + (p.bio?.age || 0), 0);
                    
                    setStats({
                        rosterCount: players.length,
                        articleCount: clubArticles.length,
                        goalsTotal: goals,
                        avgAge: players.length > 0 ? Math.round(ageSum / players.length) : 0
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [clubName]);

    if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h3 className="text-2xl font-bold font-display text-gray-900">Hub Insights: {clubName}</h3>
                    <p className="text-sm text-gray-500">Real-time performance metrics synced across Eswatini.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Roster" 
                    value={stats.rosterCount} 
                    change="Verified" 
                    Icon={UsersIcon} 
                    color="bg-blue-600" 
                />
                <StatCard 
                    title="Press Posts" 
                    value={stats.articleCount} 
                    change="Live" 
                    Icon={NewspaperIcon} 
                    color="bg-purple-600" 
                />
                <StatCard 
                    title="Total Goals" 
                    value={stats.goalsTotal} 
                    change="Career" 
                    Icon={BarChartIcon} 
                    color="bg-green-600" 
                />
                <StatCard 
                    title="Avg. Player Age" 
                    value={`${stats.avgAge} yrs`} 
                    change="Stable" 
                    Icon={VoteIcon} 
                    color="bg-yellow-500" 
                />
            </div>

            <Card className="shadow-md bg-white border-0 ring-1 ring-black/5">
                <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-50 rounded-xl"><InfoIcon className="w-6 h-6 text-indigo-600" /></div>
                        <div>
                            <h4 className="font-bold text-slate-900">Digital Visibility Engine</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Players with full technical stats and history are prioritized in the **Scout & Talent Directory**. Ensure your independent roster is updated to maximize exposure.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ClubAnalytics;
