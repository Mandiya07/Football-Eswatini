
import React, { useState, useEffect } from 'react';
import { fetchYouthData, handleFirestoreError } from '../../services/api';
import { YouthLeague, RisingStarPlayer } from '../../data/youth';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import XIcon from '../icons/XIcon';

const YouthManagement: React.FC = () => {
    const [leagues, setLeagues] = useState<YouthLeague[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLeagueId, setActiveLeagueId] = useState<string>('');
    const [isEditingLeague, setIsEditingLeague] = useState(false);
    const [editingLeagueDesc, setEditingLeagueDesc] = useState('');

    // Player Modal State
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<RisingStarPlayer | null>(null);
    const [playerFormData, setPlayerFormData] = useState({
        name: '', age: 16, team: '', position: '', photoUrl: '', bio: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchYouthData();
            // Sort order: U20, U17, Schools, U13
            const order = ['u20', 'u17', 'schools', 'u13'];
            const sortedData = [...data].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
            setLeagues(sortedData);
            if (sortedData.length > 0 && !activeLeagueId) {
                setActiveLeagueId(sortedData[0].id);
            }
        } catch(e) {
            console.error("Failed to load youth data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const activeLeague = leagues.find(l => l.id === activeLeagueId);

    const handleSaveLeagueDesc = async () => {
        if (!activeLeague) return;
        try {
            await updateDoc(doc(db, 'youth', activeLeague.id), { description: editingLeagueDesc });
            setIsEditingLeague(false);
            loadData();
        } catch (err) {
            handleFirestoreError(err, 'update youth league');
        }
    };

    const handleAddPlayer = () => {
        setEditingPlayer(null);
        setPlayerFormData({ name: '', age: 16, team: '', position: '', photoUrl: '', bio: '' });
        setIsPlayerModalOpen(true);
    };

    const handleEditPlayer = (player: RisingStarPlayer) => {
        setEditingPlayer(player);
        setPlayerFormData({
            name: player.name, age: player.age, team: player.team, position: player.position, photoUrl: player.photoUrl, bio: player.bio
        });
        setIsPlayerModalOpen(true);
    };

    const handleDeletePlayer = async (playerId: number) => {
        if (!activeLeague || !window.confirm("Delete this rising star?")) return;
        try {
            const updatedStars = (activeLeague.risingStars || []).filter(p => p.id !== playerId);
            await updateDoc(doc(db, 'youth', activeLeague.id), { risingStars: updatedStars });
            loadData();
        } catch (err) {
            handleFirestoreError(err, 'delete youth player');
        }
    };

    const handleSavePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeLeague) return;

        const newPlayer: RisingStarPlayer = {
            id: editingPlayer ? editingPlayer.id : Date.now(),
            ...playerFormData
        };

        let updatedStars = [...(activeLeague.risingStars || [])];
        if (editingPlayer) {
            updatedStars = updatedStars.map(p => p.id === editingPlayer.id ? newPlayer : p);
        } else {
            updatedStars.push(newPlayer);
        }

        try {
            await updateDoc(doc(db, 'youth', activeLeague.id), { risingStars: updatedStars });
            setIsPlayerModalOpen(false);
            loadData();
        } catch (err) {
            handleFirestoreError(err, 'save youth player');
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold font-display">Youth Page Management</h3>
                </div>

                {loading ? <Spinner /> : (
                    <div>
                        {/* League Tabs */}
                        <div className="flex space-x-2 overflow-x-auto pb-4 mb-4">
                            {leagues.map(league => (
                                <button
                                    key={league.id}
                                    onClick={() => { setActiveLeagueId(league.id); setIsEditingLeague(false); }}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeLeagueId === league.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {league.name}
                                </button>
                            ))}
                        </div>

                        {activeLeague && (
                            <div className="space-y-6">
                                {/* Description Editor */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-blue-800">Category Description</h4>
                                        {!isEditingLeague ? (
                                            <Button onClick={() => { setEditingLeagueDesc(activeLeague.description); setIsEditingLeague(true); }} className="text-xs bg-blue-200 text-blue-800 hover:bg-blue-300">Edit Text</Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button onClick={() => setIsEditingLeague(false)} className="text-xs bg-gray-300 text-gray-800">Cancel</Button>
                                                <Button onClick={handleSaveLeagueDesc} className="text-xs bg-green-600 text-white">Save</Button>
                                            </div>
                                        )}
                                    </div>
                                    {isEditingLeague ? (
                                        <textarea 
                                            rows={3} 
                                            className="w-full p-2 border rounded" 
                                            value={editingLeagueDesc} 
                                            onChange={e => setEditingLeagueDesc(e.target.value)} 
                                        />
                                    ) : (
                                        <p className="text-sm text-blue-900">{activeLeague.description}</p>
                                    )}
                                </div>

                                {/* Rising Stars List */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-bold">Rising Stars ({activeLeague.risingStars?.length || 0})</h4>
                                        <Button onClick={handleAddPlayer} className="bg-green-600 text-white text-xs flex items-center gap-1"><PlusCircleIcon className="w-4 h-4"/> Add Star</Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(activeLeague.risingStars || []).map(player => (
                                            <div key={player.id} className="border p-3 rounded-lg flex gap-3 items-start bg-white shadow-sm">
                                                <img src={player.photoUrl} alt={player.name} className="w-16 h-16 object-cover rounded" />
                                                <div className="flex-grow">
                                                    <p className="font-bold text-sm">{player.name}</p>
                                                    <p className="text-xs text-gray-500">{player.position} &bull; {player.team}</p>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => handleEditPlayer(player)} className="p-1 bg-gray-100 rounded hover:bg-blue-100 text-blue-600"><PencilIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeletePlayer(player.id)} className="p-1 bg-gray-100 rounded hover:bg-red-100 text-red-600"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!activeLeague.risingStars || activeLeague.risingStars.length === 0) && <p className="text-sm text-gray-500 italic">No rising stars featured for this category yet.</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Player Modal */}
                {isPlayerModalOpen && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsPlayerModalOpen(false)}>
                         <div className="bg-white w-full max-w-lg rounded-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg">{editingPlayer ? 'Edit Rising Star' : 'Add Rising Star'}</h3>
                                <button onClick={() => setIsPlayerModalOpen(false)}><XIcon className="w-5 h-5 text-gray-500"/></button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSavePlayer} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Name" value={playerFormData.name} onChange={e => setPlayerFormData({...playerFormData, name: e.target.value})} className={inputClass} required />
                                        <input type="number" placeholder="Age" value={playerFormData.age} onChange={e => setPlayerFormData({...playerFormData, age: parseInt(e.target.value)})} className={inputClass} required />
                                    </div>
                                    <input placeholder="Team/Academy" value={playerFormData.team} onChange={e => setPlayerFormData({...playerFormData, team: e.target.value})} className={inputClass} required />
                                    <input placeholder="Position" value={playerFormData.position} onChange={e => setPlayerFormData({...playerFormData, position: e.target.value})} className={inputClass} required />
                                    <input placeholder="Photo URL" value={playerFormData.photoUrl} onChange={e => setPlayerFormData({...playerFormData, photoUrl: e.target.value})} className={inputClass} required />
                                    <textarea placeholder="Bio / Scouting Report" value={playerFormData.bio} onChange={e => setPlayerFormData({...playerFormData, bio: e.target.value})} className={inputClass} rows={3} required />
                                    
                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" className="bg-blue-600 text-white">Save Player</Button>
                                    </div>
                                </form>
                            </div>
                         </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default YouthManagement;
