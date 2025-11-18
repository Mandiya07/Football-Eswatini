import React, { useState, useEffect } from 'react';
// FIX: Import 'fetchCompetition' which is now correctly exported from the API service.
import { fetchCompetition, handleFirestoreError } from '../../services/api';
import { Player, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps } from '../../services/utils';

const ManageSquad: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [squad, setSquad] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newPlayer, setNewPlayer] = useState({ name: '', position: 'Forward', number: '' });

    // Hardcoded for demonstration. In a real app, this might come from the user's profile or a selector.
    const COMPETITION_ID = 'mtn-premier-league';

    const sortSquadByPosition = (players: Player[]): Player[] => {
        const positionOrder: Record<Player['position'], number> = {
            'Goalkeeper': 1,
            'Defender': 2,
            'Midfielder': 3,
            'Forward': 4,
        };
        return [...players].sort((a, b) => positionOrder[a.position] - positionOrder[b.position]);
    };

    useEffect(() => {
        const loadSquad = async () => {
            setLoading(true);
            const data = await fetchCompetition(COMPETITION_ID);
            if (data?.teams) {
                const team = data.teams.find(t => t.name === clubName);
                setSquad(team ? sortSquadByPosition(team.players) : []);
            }
            setLoading(false);
        };
        loadSquad();
    }, [clubName]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewPlayer({ ...newPlayer, [e.target.name]: e.target.value });
    };

    const updateFirestoreSquad = async (updatedSquad: Player[]) => {
        setIsSubmitting(true);
        const docRef = doc(db, 'competitions', COMPETITION_ID);
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error("Competition document not found!");
                }
                const competition = docSnap.data() as Competition;
                const updatedTeams = competition.teams.map(team =>
                    team.name === clubName
                        ? { ...team, players: updatedSquad }
                        : team
                );
                // CRITICAL: Sanitize the entire teams array payload.
                transaction.update(docRef, { teams: removeUndefinedProps(updatedTeams) });
            });
            // On success, update the local state
            setSquad(sortSquadByPosition(updatedSquad));
        } catch (error) {
            handleFirestoreError(error, 'update squad');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        const playerToAdd: Player = {
            id: Date.now(),
            name: newPlayer.name,
            position: newPlayer.position as any,
            number: parseInt(newPlayer.number, 10),
            photoUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
            bio: { nationality: 'Eswatini', age: 21, height: '1.80m' },
            stats: { appearances: 0, goals: 0, assists: 0 },
            transferHistory: [],
        };
        
        await updateFirestoreSquad([...squad, playerToAdd]);

        setNewPlayer({ name: '', position: 'Forward', number: '' });
        setShowAddForm(false);
    };
    
    const handleRemovePlayer = async (playerId: number) => {
        if (window.confirm("Are you sure you want to remove this player?")) {
            const updatedSquad = squad.filter(p => p.id !== playerId);
            await updateFirestoreSquad(updatedSquad);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
    
    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold font-display">Manage Squad List</h3>
                    <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary text-white hover:bg-primary-dark focus:ring-primary-light inline-flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5" /> Add Player
                    </Button>
                </div>

                {showAddForm && (
                    <form onSubmit={handleAddPlayer} className="p-4 bg-gray-50 border rounded-lg mb-4 space-y-4 animate-fade-in">
                        <h4 className="font-bold">New Player Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" name="name" value={newPlayer.name} onChange={handleInputChange} placeholder="Player Name" required className={inputClass} />
                            <input type="number" name="number" value={newPlayer.number} onChange={handleInputChange} placeholder="Jersey Number" required className={inputClass} min="1" max="99" />
                            <select name="position" value={newPlayer.position} onChange={handleInputChange} required className={inputClass}>
                                <option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
                            </select>
                        </div>
                        <div className="text-right">
                            <Button type="submit" className="bg-green-600 text-white hover:bg-green-700" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Player'}
                            </Button>
                        </div>
                    </form>
                )}
                
                {(loading || isSubmitting) && <div className="flex justify-center p-4"><Spinner /></div>}

                {!loading && !isSubmitting && (
                    <div className="space-y-2">
                        {squad.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-2 bg-white border rounded-md hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="font-semibold">{player.name}</p>
                                        <p className="text-xs text-gray-500">#{player.number} &bull; {player.position}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemovePlayer(player.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50" aria-label={`Remove ${player.name}`}>
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ManageSquad;