import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ScoutedPlayer, PlayerPosition } from '../data/scouting';
// FIX: Import 'fetchScoutedPlayers' which is now correctly exported from the API service.
import { fetchScoutedPlayers } from '../services/api';
import { Region } from '../data/directory';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import PlayerDetailView from './PlayerDetailView';
import UserCircleIcon from './icons/UserCircleIcon';
import LockIcon from './icons-scouting/LockIcon';
import Spinner from './ui/Spinner';

const LoginPrompt: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
    <div className="text-center max-w-lg mx-auto p-8">
        <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
                <LockIcon className="w-8 h-8 text-blue-600" />
            </div>
        </div>
        <h2 className="text-2xl font-bold font-display text-gray-800">Exclusive Access Required</h2>
        <p className="text-gray-600 mt-2 mb-6">
            The Scout & Talent Directory is a premium feature available only to registered agents, scouts, and club officials. Please log in to view player profiles.
        </p>
        <Button onClick={onLogin} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
            Log In to Access
        </Button>
    </div>
);


const ScoutingPage: React.FC = () => {
    const { isLoggedIn, openAuthModal } = useAuth();
    const [allPlayers, setAllPlayers] = useState<ScoutedPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState<ScoutedPlayer | null>(null);
    const [filterRegion, setFilterRegion] = useState<Region | 'all'>('all');
    const [filterPosition, setFilterPosition] = useState<PlayerPosition | 'all'>('all');
    const [filterAgeGroup, setFilterAgeGroup] = useState<'all' | 'U-17' | 'U-20' | 'Senior'>('all');

    useEffect(() => {
        if(isLoggedIn) {
            const loadData = async () => {
                setLoading(true);
                const data = await fetchScoutedPlayers();
                setAllPlayers(data);
                setLoading(false);
            };
            loadData();
        }
    }, [isLoggedIn]);


    const filteredPlayers = useMemo(() => {
        return allPlayers.filter(player => {
            const matchesRegion = filterRegion === 'all' || player.region === filterRegion;
            const matchesPosition = filterPosition === 'all' || player.position === filterPosition;
            
            let matchesAgeGroup = true;
            if (filterAgeGroup === 'U-17') {
                matchesAgeGroup = player.age <= 17;
            } else if (filterAgeGroup === 'U-20') {
                matchesAgeGroup = player.age > 17 && player.age <= 20;
            } else if (filterAgeGroup === 'Senior') {
                matchesAgeGroup = player.age > 20;
            }

            return matchesRegion && matchesPosition && matchesAgeGroup;
        });
    }, [filterRegion, filterPosition, filterAgeGroup, allPlayers]);

    useEffect(() => {
        // Automatically select the first player in the filtered list
        if (filteredPlayers.length > 0) {
            setSelectedPlayer(filteredPlayers[0]);
        } else {
            setSelectedPlayer(null);
        }
    }, [filteredPlayers]);


    if (!isLoggedIn) {
        return (
             <div className="bg-gray-50 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                    <LoginPrompt onLogin={openAuthModal} />
                </div>
            </div>
        );
    }

    const inputClass = "block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm";

    return (
        <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-display font-extrabold text-blue-800 mb-2">
                        Scout & Talent Directory
                    </h1>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Discover the next generation of football talent in Eswatini.
                    </p>
                </div>
                
                <Card className="shadow-lg mb-8">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="filter-region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                            <select id="filter-region" value={filterRegion} onChange={e => setFilterRegion(e.target.value as any)} className={inputClass}>
                                <option value="all">All Regions</option>
                                <option value="Hhohho">Hhohho</option>
                                <option value="Manzini">Manzini</option>
                                <option value="Lubombo">Lubombo</option>
                                <option value="Shiselweni">Shiselweni</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="filter-position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                            <select id="filter-position" value={filterPosition} onChange={e => setFilterPosition(e.target.value as any)} className={inputClass}>
                                <option value="all">All Positions</option>
                                <option value="Goalkeeper">Goalkeeper</option>
                                <option value="Defender">Defender</option>
                                <option value="Midfielder">Midfielder</option>
                                <option value="Forward">Forward</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-age" className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                            <select id="filter-age" value={filterAgeGroup} onChange={e => setFilterAgeGroup(e.target.value as any)} className={inputClass}>
                                <option value="all">All Ages</option>
                                <option value="U-17">U-17</option>
                                <option value="U-20">U-20</option>
                                <option value="Senior">Senior</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>
                { loading ? <div className="flex justify-center p-8"><Spinner/></div> : 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 max-h-[80vh] overflow-y-auto space-y-3 pr-2">
                        {filteredPlayers.length > 0 ? filteredPlayers.map(player => (
                            <button
                                key={player.id}
                                onClick={() => setSelectedPlayer(player)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors duration-200 flex items-center gap-4 ${selectedPlayer?.id === player.id ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
                            >
                                <img src={player.photoUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-gray-800">{player.name}</p>
                                    <p className="text-xs text-gray-500">{player.age} yrs &bull; {player.position}</p>
                                </div>
                            </button>
                        )) : (
                            <div className="text-center py-12 text-gray-500">
                                <p className="font-semibold">No players match your criteria.</p>
                                <p className="text-sm">Try broadening your search filters.</p>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        {selectedPlayer ? (
                            <PlayerDetailView key={selectedPlayer.id} player={selectedPlayer} />
                        ) : (
                             <Card className="h-full flex items-center justify-center shadow-lg">
                                <CardContent className="p-8 text-center text-gray-500">
                                    <p>Select a player to view their profile.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
                }
            </div>
        </div>
    );
};

export default ScoutingPage;