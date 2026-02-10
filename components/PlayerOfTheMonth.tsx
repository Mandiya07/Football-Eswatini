
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Player } from '../data/teams';
import MedalIcon from './icons/MedalIcon';
import { fetchCompetition } from '../services/api';
import { aggregateGoalsFromEvents } from '../services/utils';
import Spinner from './ui/Spinner';

const PollBar: React.FC<{ label: string; percentage: number; color: string }> = ({ label, percentage, color }) => (
    <div>
        <div className="flex justify-between mb-1 text-sm font-medium">
            <span className="text-gray-700 truncate">{label}</span>
            <span className="text-gray-500">{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
                className={`${color} h-2.5 rounded-full transition-all duration-1000 ease-out`} 
                style={{ width: `${percentage}%` }}>
            </div>
        </div>
    </div>
);

const PlayerOfTheMonth: React.FC = () => {
    const [votedPlayerId, setVotedPlayerId] = useState<number | null>(null);
    const [pollResults, setPollResults] = useState<Record<number, number>>({});
    const [candidates, setCandidates] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCandidates = async () => {
            setLoading(true);
            try {
                const competition = await fetchCompetition('mtn-premier-league');
                if (!competition) throw new Error("League data missing");

                // Use the official stats aggregator to find the REAL top performers (Goals + POTM weighted)
                const realScorers = aggregateGoalsFromEvents(
                    competition.fixtures || [],
                    competition.results || [],
                    competition.teams || []
                );

                // Take the top 3 performers as candidates
                const topPerformers = realScorers.slice(0, 3).map(scorer => {
                    const team = competition.teams?.find(t => t.name === scorer.teamName);
                    const player = team?.players.find(p => p.id === scorer.playerId || p.name === scorer.name);
                    
                    return {
                        ...player,
                        id: scorer.playerId || Math.random(),
                        name: scorer.name,
                        club: scorer.teamName,
                        photoUrl: player?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${scorer.name}`,
                        position: player?.position || 'Forward',
                        stats: {
                            ...player?.stats,
                            goals: scorer.goals,
                            potmWins: scorer.potmWins
                        }
                    } as Player;
                });

                setCandidates(topPerformers);
                
                // Initialize clean results
                const initialResults: Record<number, number> = {};
                topPerformers.forEach((p) => {
                    initialResults[p.id] = 0;
                });
                setPollResults(initialResults);

            } catch (err) {
                console.error("POTM Load Error", err);
            } finally {
                setLoading(false);
            }
        };
        loadCandidates();
    }, []);


    const handleVote = (playerId: number) => {
        if (votedPlayerId) return;
        setVotedPlayerId(playerId);
        setPollResults(prevResults => {
            const currentVotes = prevResults[playerId] || 0;
            return {
                ...prevResults,
                [playerId]: currentVotes + 1,
            };
        });
    };
    
    const totalVotes = useMemo(() => {
        return Object.values(pollResults).reduce((sum: number, votes: number) => sum + votes, 0);
    }, [pollResults]);

    if (loading) {
         return (
            <Card className="shadow-lg h-full">
                <CardContent className="p-6">
                    <div className="h-6 bg-gray-100 rounded w-3/4 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-6 animate-pulse"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse"></div>)}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (candidates.length === 0) return (
        <Card className="shadow-lg h-full opacity-50 grayscale">
            <CardContent className="p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
                <MedalIcon className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="font-bold text-gray-400">POTM Poll Inactive</h3>
                <p className="text-xs text-gray-400 mt-1">Awaiting season performance records...</p>
            </CardContent>
        </Card>
    );

    return (
        <Card className="shadow-lg h-full">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MedalIcon className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-display font-bold text-gray-800">Player of the Month</h3>
                </div>

                {votedPlayerId ? (
                     <div className="space-y-4 animate-fade-in">
                        <p className="text-sm text-gray-500 mb-2 font-medium">Verified Fan Poll:</p>
                        {candidates.map(player => {
                            const percentage = totalVotes > 0 ? ((pollResults[player.id] || 0) / totalVotes) * 100 : 0;
                            return (
                                <PollBar 
                                    key={player.id}
                                    label={player.name}
                                    percentage={percentage}
                                    color="bg-yellow-500"
                                />
                            );
                        })}
                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest pt-4 border-t mt-4">Stats verified by Match Center</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Standout performers based on goals and official MVP awards.</p>
                        <div className="space-y-3">
                            {candidates.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleVote(player.id)}
                                    className="w-full text-left p-3 rounded-xl border-2 border-gray-100 hover:border-yellow-400 hover:bg-yellow-50/50 transition-all duration-300 flex items-center gap-4 group"
                                    aria-label={`Vote for ${player.name}`}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm flex-shrink-0">
                                        {player.photoUrl ? (
                                            <img src={player.photoUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <span className="font-bold text-xs">{player.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{player.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{player.club}</p>
                                            {(player.stats?.potmWins || 0) > 0 && (
                                                <span className="text-[9px] bg-yellow-400 text-yellow-900 px-1.5 rounded font-black flex items-center gap-0.5">
                                                    <MedalIcon className="w-2 h-2" /> {player.stats?.potmWins} MVP
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-black text-xs shadow-sm">+1</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default PlayerOfTheMonth;
