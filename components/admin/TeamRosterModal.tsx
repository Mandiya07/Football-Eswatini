
import React, { useState, useEffect, useRef } from 'react';
import { Team, Player, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import UserIcon from '../icons/UserIcon';
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
    
    // Form State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '', 
        position: 'Forward', 
        number: '', 
        photoUrl: '',
        age: '',
        nationality: '',
        height: ''
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPlayers(team.players || []);
    }, [team]);

    const resetForm = () => {
        setFormData({ 
            name: '', 
            position: 'Forward', 
            number: '', 
            photoUrl: '',
            age: '',
            nationality: '',
            height: '' 
        });
        setEditingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const startEditing = (player: Player) => {
        setEditingId(player.id);
        setFormData({
            name: player.name,
            position: player.position,
            number: player.number === 0 ? '' : player.number.toString(), // Show empty string if 0 (no number)
            photoUrl: player.photoUrl || '',
            age: player.bio?.age ? player.bio.age.toString() : '',
            nationality: player.bio?.nationality || '',
            height: player.bio?.height || ''
        });
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
        } catch (error) {
            console.error("Error updating roster:", error);
            alert("Failed to update roster.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSavePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return; // Name is the only strict requirement

        const playerToSave: Player = {
            id: editingId || Date.now(),
            name: formData.name,
            position: formData.position as any,
            number: formData.number ? parseInt(formData.number, 10) : 0, // Default to 0 if no number
            photoUrl: formData.photoUrl, // Can be empty string
            bio: { 
                nationality: formData.nationality || 'Eswatini', 
                age: formData.age ? parseInt(formData.age, 10) : 0, 
                height: formData.height || '-' 
            },
            stats: editingId 
                ? (players.find(p => p.id === editingId)?.stats || { appearances: 0, goals: 0, assists: 0 }) 
                : { appearances: 0, goals: 0, assists: 0 },
            transferHistory: editingId 
                ? (players.find(p => p.id === editingId)?.transferHistory || []) 
                : [],
        };

        let updatedPlayers: Player[];
        if (editingId) {
            updatedPlayers = players.map(p => p.id === editingId ? playerToSave : p);
        } else {
            updatedPlayers = [...players, playerToSave];
        }

        // Sort by number (0s/unknowns at the end usually, or strictly numeric)
        const sortedPlayers = updatedPlayers.sort((a, b) => {
            if (a.number === 0) return 1;
            if (b.number === 0) return -1;
            return a.number - b.number;
        });
        
        await updateFirestore(sortedPlayers);
        resetForm();
    };

    const handleRemovePlayer = async (playerId: number) => {
        if (!window.confirm("Remove this player from the team?")) return;
        const updatedPlayers = players.filter(p => p.id !== playerId);
        await updateFirestore(updatedPlayers);
        if (editingId === playerId) resetForm();
    };

    if (!isOpen) return null;

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold font-display">Manage Roster: {team.name}</h2>
                        <p className="text-sm text-gray-600">Add, edit, or remove players for this team.</p>
                    </div>

                    {/* Add/Edit Player Form */}
                    <form onSubmit={handleSavePlayer} className={`p-4 rounded-lg border mb-6 transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-gray-700">{editingId ? 'Edit Player' : 'Add New Player'}</h4>
                            {editingId && <button type="button" onClick={resetForm} className="text-xs text-red-600 hover:underline">Cancel Edit</button>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Player Name" className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Jersey Number</label>
                                <input type="number" name="number" value={formData.number} onChange={handleInputChange} placeholder="#" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
                                <select name="position" value={formData.position} onChange={handleInputChange} className={inputClass}>
                                    <option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
                                <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} placeholder="e.g. Eswatini" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                                <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Years" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                                <input type="text" name="height" value={formData.height} onChange={handleInputChange} placeholder="e.g. 1.75m" className={inputClass} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Photo (Optional)</label>
                                <div className="flex items-center gap-2">
                                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    {formData.photoUrl && <img src={formData.photoUrl} alt="Preview" className="h-9 w-9 rounded-full object-cover border bg-gray-100"/>}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <Button type="submit" disabled={isSubmitting} className={`${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white h-10 px-4 flex items-center justify-center w-full sm:w-auto ml-auto gap-2`}>
                                {isSubmitting ? <Spinner className="w-4 h-4 border-2"/> : editingId ? 'Update Player' : <><PlusCircleIcon className="w-5 h-5" /> Add Player</>}
                            </Button>
                        </div>
                    </form>

                    {/* Player List */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm mb-2">Current Squad ({players.length})</h4>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                            {players.length > 0 ? players.map(player => (
                                <div key={player.id} className={`flex items-center justify-between p-2 border rounded transition-colors ${editingId === player.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            {player.photoUrl ? (
                                                <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover border" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border">
                                                    <UserIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                            {player.number > 0 && (
                                                <span className="absolute -bottom-1 -right-1 font-mono text-[10px] font-bold text-white bg-gray-600 rounded-full w-5 h-5 flex items-center justify-center border border-white">{player.number}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{player.name}</p>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span>{player.position}</span>
                                                {player.bio?.age > 0 && <span>• {player.bio.age} yrs</span>}
                                                {player.bio?.nationality && <span>• {player.bio.nationality}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEditing(player)} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors" title="Edit Player">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleRemovePlayer(player.id)} className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors" title="Remove Player">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
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
