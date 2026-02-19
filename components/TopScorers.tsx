
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { fetchCompetition } from '../services/api';
import Spinner from './ui/Spinner';
import TrophyIcon from './icons/TrophyIcon';
import UserIcon from './icons/UserIcon';
import { aggregateGoalsFromEvents, ScorerRecord } from '../services/utils';

interface TopScorersProps {
    competitionId?: string;
}

const TopScorers: React.FC<TopScorersProps> = ({ competitionId = 'mtn-premier-league' }) => {
    const [scorers, setScorers] = useState<ScorerRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchCompetition(competitionId);
                if (data) {
                    // Pull real data by scanning all match events for goals
                    // This uses the 'competition' mode which ignores career baselines
                    const aggregated = aggregateGoalsFromEvents(
                        data.fixtures || [], 
                        data.results || [], 
                        data.teams || []
                    );
                    setScorers(aggregated.slice(0, 5));
                }
            } catch (err) {
                console.error("Top Scorers Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [competitionId]);

    if (loading) return <div className="flex justify-center p-4"><Spinner className="w-6 h-6" /></div>;
    
    if (scorers.length === 0) return (
        <Card className="shadow-lg border-0 bg-white overflow-hidden rounded-2xl">
            <div className="bg-slate-900 p-4 text-white flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-yellow-400" />
                <h3 className="text-xs font-black uppercase tracking-widest">Golden Boot Race</h3>
            </div>
            <CardContent className="p-8 text-center">
                <p className="text-xs text-gray-400 italic">No goals verified in match logs yet.</p>
            </CardContent>
        </Card>
    );

    return (
        <Card className="shadow-lg border-0 bg-white overflow-hidden rounded-2xl">
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Golden Boot Race</h3>
                </div>
                <span className="text-[8px] font-black uppercase text-accent/60 tracking-widest">Season Only</span>
            </div>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                    {scorers.map((p, i) => (
                        <div key={`${p.playerId}-${i}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-slate-100">
                                        <UserIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-white shadow-sm rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 border border-gray-100">
                                        {i + 1}
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-sm text-gray-900 truncate leading-tight">{p.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {p.crestUrl && <img src={p.crestUrl} className="w-3 h-3 object-contain opacity-80" alt="" />}
                                        <p className="text-[9px] text-gray-500 font-black uppercase truncate tracking-tighter">{p.teamName}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 pl-3">
                                <p className="text-xl font-black text-[#002B7F] leading-none tabular-nums">{p.goals}</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">Goals</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default TopScorers;
