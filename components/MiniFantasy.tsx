import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import { Player } from '../data/teams';
import { fetchCompetition } from '../services/api';
import UsersPlusIcon from './icons/UsersPlusIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';

const MiniFantasy: React.FC = () => {
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
    const [scoreCalculated, setScoreCalculated] = useState(false);
    const [totalScore, setTotalScore] = useState(0);
    const [fantasyPlayers, setFantasyPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlayers = async () => {
            const data = await fetchCompetition('mtn-premier-league');
            if (data?.teams) {
                // Collect a random selection of players across different teams
                const allAvailablePlayers: Player[] = [];
                data.teams.forEach(team => {
                    if (team.players && team.players.length > 0) {
                        // Take top 2 players from each team to populate the picker
                        allAvailablePlayers.push(...team.players.slice(0, 2).map(p => ({...p, club: team.name})));
                    }
                });
                // Shuffle and pick 10
                setFantasyPlayers(allAvailablePlayers.sort(() => 0.5 - Math.random()).slice(0, 10));
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
    
    const calculateScore = () => {
        const score = selectedPlayers.reduce((acc, player) => {
            let points = Math.floor(Math.random() * 15) + 5; // Simulating points
            return acc + points;
        }, 0);
        setTotalScore(score);
        setScoreCalculated(true);
    };

    const handleReset = () => {
        setSelectedPlayers([]);
        setScoreCalculated(false);
        setTotalScore(0);
    }
    
    if (loading) {
        return (
            <Card className="shadow-lg h-full">
                <CardContent className="p-6 flex items-center justify-center">
                    <Spinner />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-lg h-full">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <UsersPlusIcon className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-display font-bold text-gray-800">Mini-Fantasy</h3>
                </div>
                
                {!scoreCalculated ? (
                    <>
                        <p className="text-sm text-gray-500 mb-4">Pick your 3-player squad for the gameweek.</p>
                        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {fantasyPlayers.length > 0 ? fantasyPlayers.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handlePlayerToggle(player)}
                                    className={`w-full text-left p-2 rounded-md border-2 transition-colors flex items-center gap-3
                                        ${selectedPlayers.some(p => p.id === player.id) ? 'bg-green-100 border-green-400' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border">
                                        {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-[10px]">{player.name.charAt(0)}</span>}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-xs truncate">{player.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{player.club} &bull; {player.position}</p>
                                    </div>
                                    {selectedPlayers.some(p => p.id === player.id) && <CheckCircleIcon className="w-5 h-5 text-green-600 ml-auto flex-shrink-0" />}
                                </button>
                            )) : <p className="text-xs text-gray-400 italic text-center py-4">Loading players...</p>}
                        </div>
                        <Button 
                            onClick={calculateScore} 
                            disabled={selectedPlayers.length !== 3} 
                            className="w-full bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 font-bold"
                        >
                            Confirm Squad ({selectedPlayers.length}/3)
                        </Button>
                    </>
                ) : (
                    <div className="animate-fade-in text-center py-4">
                        <h4 className="font-bold font-display text-lg mb-4">Total Squad XP</h4>
                        <p className="text-7xl font-black text-green-600 font-display">+{totalScore}</p>
                        <p className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-6">Gameweek Points</p>
                        <Button onClick={handleReset} className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs font-bold px-6">
                            New Gameweek Pick
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MiniFantasy;