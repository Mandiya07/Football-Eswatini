
import React, { useState, useEffect } from 'react';
import { Team, Player, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps } from '../../services/utils';
import Spinner from '../ui/Spinner';

interface TeamRosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void; // Trigger refresh in parent
    team: Team;
    competitionId: string;
}

const TeamRosterModal: React.FC<TeamRosterModalProps> = ({ isOpen, onClose, onSave, team, competitionId }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ name: '', position: 'Forward', number: '', photoUrl: '' });

    useEffect(() => {
        setPlayers(team.players || []);
    }, [team]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewPlayer({ ...newPlayer, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setNewPlayer(prev => ({ ...prev, photoUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const updateFirestore = async (updatedPlayers: Player[]) => {
        setIsSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', competitionId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const competition = docSnap.data() as Competition;
                const updatedTeams = competition.teams.map(t => 
                    t.id === team.id ? { ...t, players: updatedPlayers } : t
                );
                
                transaction.update(docRef, { teams: removeUndefinedProps(updatedTeams) });
            });
            setPlayers(updatedPlayers);
            // Optional: Trigger parent refresh if needed immediately, though local state is updated
        } catch (error) {
            console.error("Error updating roster:", error);
            alert("Failed to update roster.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlayer.name || !newPlayer.number) return;

        const playerToAdd: Player = {
            id: Date.now(),
            name: newPlayer.name,
            position: newPlayer.position as any,
            number: parseInt(newPlayer.number, 10),
            photoUrl: newPlayer.photoUrl || `https://i.pravatar.cc/150?u=${Date.now()}`,
            bio: { nationality: 'Eswatini', age: 20, height: '1.75m' },
            stats: { appearances: 0, goals: 0, assists: 0 },
            transferHistory: [],
        };

        const updatedPlayers = [...players, playerToAdd];
        // Sort by position/number
        const sortedPlayers = updatedPlayers.sort((a, b) => a.number - b.number);
        
        await updateFirestore(sortedPlayers);
        setNewPlayer({ name: '', position: 'Forward', number: '', photoUrl: '' });
    };

    const handleRemovePlayer = async (playerId: number) => {
        if (!window.confirm("Remove this player from the team?")) return;
        const updatedPlayers = players.filter(p => p.id !== playerId);
        await updateFirestore(updatedPlayers);
    };

    if (!isOpen) return null;

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold font-display">Manage Roster: {team.name}</h2>
                        <p className="text-sm text-gray-600">Add or remove players for this team.</p>
                    </div>

                    {/* Add Player Form */}
                    <form onSubmit={handleAddPlayer} className="bg-gray-50 p-4 rounded-lg border mb-6">
                        <h4 className="font-bold text-sm mb-3">Add New Player</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                                <input type="text" name="name" value={newPlayer.name} onChange={handleInputChange} placeholder="Player Name" className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Jersey Number</label>
                                <input type="number" name="number" value={newPlayer.number} onChange={handleInputChange} placeholder="#" className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                                <select name="position" value={newPlayer.position} onChange={handleInputChange} className={inputClass}>
                                    <option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Photo</label>
                                <div className="flex items-center gap-2">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    {newPlayer.photoUrl && <img src={newPlayer.photoUrl} alt="Preview" className="h-9 w-9 rounded-full object-cover border"/>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <Button type="submit" disabled={isSubmitting} className="bg-green-600 text-white hover:bg-green-700 h-10 px-4 flex items-center justify-center w-full sm:w-auto ml-auto gap-2">
                                {isSubmitting ? <Spinner className="w-4 h-4 border-2"/> : <><PlusCircleIcon className="w-5 h-5" /> Add Player</>}
                            </Button>
                        </div>
                    </form>

                    {/* Player List */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm mb-2">Current Squad ({players.length})</h4>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                            {players.length > 0 ? players.map(player => (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-white border rounded hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover border" />
                                            <span className="absolute -bottom-1 -right-1 font-mono text-[10px] font-bold text-white bg-gray-600 rounded-full w-5 h-5 flex items-center justify-center border border-white">{player.number}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{player.name}</p>
                                            <p className="text-xs text-gray-500">{player.position}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemovePlayer(player.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors" title="Remove Player">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : <p className="text-sm text-gray-500 text-center py-4">No players on roster.</p>}
                        </div>
                    </div>

                    <div className="mt-6 text-right border-t pt-4">
                        <Button onClick={() => { onSave(); onClose(); }} className="bg-primary text-white">Done</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamRosterModal;
