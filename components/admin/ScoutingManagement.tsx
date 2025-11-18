import React, { useState, useEffect } from 'react';
import { addScoutedPlayer, deleteScoutedPlayer, fetchScoutedPlayers, updateScoutedPlayer } from '../../services/api';
import { ScoutedPlayer } from '../../data/scouting';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import ScoutingFormModal from './ScoutingFormModal';

const ScoutingManagement: React.FC = () => {
    const [players, setPlayers] = useState<ScoutedPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<ScoutedPlayer | null>(null);

    const loadPlayers = async () => {
        setLoading(true);
        const data = await fetchScoutedPlayers();
        setPlayers(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPlayers();
    }, []);

    const handleAddNew = () => {
        setEditingPlayer(null);
        setIsModalOpen(true);
    };

    const handleEdit = (player: ScoutedPlayer) => {
        setEditingPlayer(player);
        setIsModalOpen(true);
    };

    const handleDelete = async (playerId: string) => {
        if (window.confirm("Delete this scouted player's profile?")) {
            await deleteScoutedPlayer(playerId);
            loadPlayers();
        }
    };

    const handleSave = async (data: Omit<ScoutedPlayer, 'id'>, id?: string) => {
        if (id) {
            await updateScoutedPlayer(id, data);
        } else {
            await addScoutedPlayer(data);
        }
        setIsModalOpen(false);
        loadPlayers();
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold font-display">Scouting Management</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Player
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {players.map(player => (
                                <div key={player.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <img src={player.photoUrl} alt={player.name} className="w-12 h-12 object-cover rounded-full" />
                                        <div>
                                            <p className="font-semibold">{player.name}</p>
                                            <p className="text-xs text-gray-500">{player.age} &bull; {player.position} &bull; {player.region}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Button onClick={() => handleEdit(player)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4" /></Button>
                                        <Button onClick={() => handleDelete(player.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <ScoutingFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} player={editingPlayer} />}
        </>
    );
};

export default ScoutingManagement;
