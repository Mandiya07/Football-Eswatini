
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Player } from '../data/teams';
import MedalIcon from './icons/MedalIcon';
// FIX: Import 'fetchCompetition' which is now correctly exported from the API service.
import { fetchCompetition } from '../services/api';

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
    const [pollResults, setPollResults] = useState<Record<number, number>>({
        102: 45, // Mthunzi Mkhontfo
        202: 35, // Felix Badenhorst
        103: 20, // Njabulo Tfwala
    });
    const [candidates, setCandidates] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCandidates = async () => {
            const competition = await fetchCompetition('mtn-premier-league');
            const allTeams = competition?.teams || [];
            const players: Player[] = [];
            const playerIds = [102, 202, 103]; // Mthunzi Mkhontfo, Felix Badenhorst, Njabulo Tfwala

            for (const team of allTeams) {
                for (const player of team.players) {
                    if (playerIds.includes(player.id)) {
                        players.push(player);
                    }
                }
            }
            // Ensure consistent order
            setCandidates(players.sort((a, b) => playerIds.indexOf(a.id) - playerIds.indexOf(b.id)));
            setLoading(false);
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
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6 animate-pulse"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>)}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (candidates.length === 0 && !loading) return null;

    return (
        <Card className="shadow-lg h-full">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MedalIcon className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-display font-bold text-gray-800">Player of the Month</h3>
                </div>

                {votedPlayerId ? (
                     <div className="space-y-4 animate-fade-in">
                        <p className="text-sm text-gray-500 mb-2">Here are the current standings:</p>
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
                        <p className="text-xs text-center text-gray-500 pt-2">Thanks for your vote!</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-4">Cast your vote for the standout performer.</p>
                        <div className="space-y-3">
                            {candidates.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleVote(player.id)}
                                    className="w-full text-left p-3 rounded-lg border-2 border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 transition-colors duration-200 flex items-center gap-4"
                                    aria-label={`Vote for ${player.name}`}
                                >
                                    <img src={player.photoUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <p className="font-bold text-gray-800">{player.name}</p>
                                        <p className="text-xs text-gray-500">{player.position} &bull; {player.stats.goals} Goals</p>
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