
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { Player } from '../data/teams';
import { fetchCompetition } from '../services/api';
import { reconcilePlayers } from '../services/utils';
import UsersPlusIcon from './icons/UsersPlusIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import SparklesIcon from './icons/SparklesIcon';

const MiniFantasy: React.FC = () => {
    const { addXP, isLoggedIn } = useAuth();
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
    const [scoreCalculated, setScoreCalculated] = useState(false);
    const [totalScore, setTotalScore] = useState(0);
    const [fantasyPlayers, setFantasyPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlayers = async () => {
            const data = await fetchCompetition('mtn-premier-league');
            if (data?.teams) {
                // Reconcile players using real match events to get current stats
                const allMatches = [...(data.fixtures || []), ...(data.results || [])];
                const reconciledTeams = reconcilePlayers(data.teams, allMatches);
                
                const allAvailablePlayers: Player[] = [];
                reconciledTeams.forEach(team => {
                    if (team.players) {
                        allAvailablePlayers.push(...team.players.map(p => ({...p, club: team.name})));
                    }
                });
                
                // Pick 12 players who are actually playing (highest appearances) to ensure viable picks
                const topActive = allAvailablePlayers
                    .sort((a, b) => (b.stats?.appearances || 0) - (a.stats?.appearances || 0))
                    .slice(0, 12);
                
                setFantasyPlayers(topActive);
            }
            setLoading(false);
        };
        loadPlayers();
    }, []);

    const handlePlayerToggle = (player: Player) => {
        if (scoreCalculated) return;
        setSelectedPlayers(prev => {
            if (prev.some(p => p.id === player.id)) {
                return prev.filter(p => p.id !== player.id);
            }
            if (prev.length < 3) {
                return [...prev, player];
            }
            return prev;
        });
    };
    
    const calculateScore = async () => {
        // DATA-DRIVEN SCORING:
        // Goals: 6 pts | Assists: 3 pts | Appearances: 1 pt | Clean Sheet: 4 pts
        const score = selectedPlayers.reduce((acc, player) => {
            const p = player.stats || { goals: 0, assists: 0, appearances: 0, cleanSheets: 0 };
            const points = (p.goals * 6) + (p.assists * 3) + (p.appearances * 1) + ((p.cleanSheets || 0) * 4);
            // Add a small "potential" base score (5) so new players still have value
            return acc + points + 5;
        }, 0);
        
        setTotalScore(score);
        setScoreCalculated(true);

        if (isLoggedIn) {
            await addXP(score);
        }
    };

    const handleReset = () => {
        setSelectedPlayers([]);
        setScoreCalculated(false);
        setTotalScore(0);
    }
    
    if (loading) {
        return (
            <Card className="shadow-lg h-full">
                <CardContent className="p-6 flex items-center justify-center h-64">
                    <Spinner />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg h-full flex flex-col overflow-hidden border-0 ring-1 ring-black/5">
            <div className="bg-green-600 p-4 text-white flex items-center gap-2">
                <UsersPlusIcon className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest">Mini-Fantasy</h3>
            </div>
            <CardContent className="p-6 flex-grow flex flex-col">
                {!scoreCalculated ? (
                    <>
                        <div className="mb-4">
                            <p className="text-sm font-bold text-gray-900">Select your Power Trio</p>
                            <p className="text-[11px] text-gray-500">Earn XP based on real season performance data.</p>
                        </div>
                        
                        <div className="space-y-2 mb-6 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                            {fantasyPlayers.length > 0 ? fantasyPlayers.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handlePlayerToggle(player)}
                                    className={`w-full text-left p-2.5 rounded-xl border-2 transition-all flex items-center gap-3 group
                                        ${selectedPlayers.some(p => p.id === player.id) 
                                            ? 'bg-green-50 border-green-500 shadow-inner' 
                                            : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200 group-hover:scale-105 transition-transform">
                                        {player.photoUrl ? (
                                            <img src={player.photoUrl} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-xs font-black text-gray-400">{player.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-xs text-gray-900 truncate">{player.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter truncate">{player.club}</p>
                                            <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1 rounded">G: {player.stats?.goals || 0}</span>
                                        </div>
                                    </div>
                                    {selectedPlayers.some(p => p.id === player.id) ? (
                                        <div className="bg-green-500 rounded-full p-0.5 animate-in zoom-in duration-200">
                                            <CheckCircleIcon className="w-4 h-4 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-100 group-hover:border-green-200"></div>
                                    )}
                                </button>
                            )) : <p className="text-xs text-gray-400 italic text-center py-4">Searching rosters...</p>}
                        </div>

                        <div className="mt-auto">
                            <Button 
                                onClick={calculateScore} 
                                disabled={selectedPlayers.length !== 3} 
                                className="w-full bg-green-600 text-white h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                {selectedPlayers.length === 3 ? 'Confirm Selection' : `Pick ${3 - selectedPlayers.length} More`}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="animate-in zoom-in duration-500 text-center py-4 flex flex-col h-full justify-center">
                        <div className="relative inline-block mx-auto mb-6">
                            <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                            <h4 className="relative font-black text-xs text-green-600 uppercase tracking-[0.3em] mb-2">Technical Efficiency Score</h4>
                            <p className="relative text-7xl font-display font-black text-gray-900 tracking-tighter">
                                +{totalScore}
                            </p>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-center -space-x-3">
                                {selectedPlayers.map(p => (
                                    <img key={p.id} src={p.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-white object-cover" alt="" title={p.name} />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 font-medium px-4">
                                Score reconciled against official MTN Premier League match events.
                            </p>
                        </div>

                        <div className="space-y-3 mt-auto">
                            {isLoggedIn && (
                                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 py-2 rounded-lg border border-blue-100">
                                    <SparklesIcon className="w-3 h-3" /> Fan Rank Increased
                                </div>
                            )}
                            <Button onClick={handleReset} variant="outline" className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-gray-200">
                                Reset Squad
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MiniFantasy;
