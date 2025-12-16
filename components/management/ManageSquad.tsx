
import React, { useState, useEffect, useRef } from 'react';
// FIX: Import 'fetchCompetition' which is now correctly exported from the API service.
import { fetchCompetition, fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { Player, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import SearchIcon from '../icons/SearchIcon';
import UserIcon from '../icons/UserIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps } from '../../services/utils';

const ManageSquad: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [squad, setSquad] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Form State
    const [newPlayer, setNewPlayer] = useState<{
        name: string;
        position: string;
        number: string;
        photoUrl: string;
        copiedBio: { nationality: string; age: number; height: string } | null;
    }>({ 
        name: '', 
        position: 'Forward', 
        number: '', 
        photoUrl: '', 
        copiedBio: null 
    });

    // Search/Link State
    const [allGlobalPlayers, setAllGlobalPlayers] = useState<{player: Player, teamName: string}[]>([]);
    const [suggestions, setSuggestions] = useState<{player: Player, teamName: string}[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

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
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Load Squad
                const compData = await fetchCompetition(COMPETITION_ID);
                if (compData?.teams) {
                    const team = compData.teams.find(t => t.name === clubName);
                    setSquad(team ? sortSquadByPosition(team.players) : []);
                }

                // 2. Load Global Players for Search
                const allComps = await fetchAllCompetitions();
                const globalList: {player: Player, teamName: string}[] = [];
                Object.values(allComps).forEach(c => {
                    c.teams?.forEach(t => {
                        // Exclude players already in this club to avoid duplicates in search
                        if (t.name !== clubName) {
                            t.players?.forEach(p => {
                                globalList.push({ player: p, teamName: t.name });
                            });
                        }
                    });
                });
                setAllGlobalPlayers(globalList);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();

        // Click outside handler for suggestions
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [clubName]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewPlayer({ ...newPlayer, [e.target.name]: e.target.value });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewPlayer(prev => ({ ...prev, name: val }));
        
        if (val.length > 2) {
            const matches = allGlobalPlayers.filter(item => 
                item.player.name.toLowerCase().includes(val.toLowerCase())
            );
            // Deduplicate by name
            const uniqueMatches = Array.from(new Map(matches.map(item => [item.player.name, item])).values());
            setSuggestions(uniqueMatches.slice(0, 5));
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSelectExisting = (item: {player: Player, teamName: string}) => {
        setNewPlayer({
            name: item.player.name,
            position: item.player.position,
            number: '', // Reset number as it is team specific
            photoUrl: item.player.photoUrl,
            copiedBio: item.player.bio // Copy existing bio data
        });
        setShowSuggestions(false);
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
            photoUrl: newPlayer.photoUrl || `https://i.pravatar.cc/150?u=${Date.now()}`,
            bio: newPlayer.copiedBio || { nationality: 'Eswatini', age: 21, height: '1.80m' },
            stats: { appearances: 0, goals: 0, assists: 0 },
            transferHistory: [],
        };
        
        await updateFirestoreSquad([...squad, playerToAdd]);

        setNewPlayer({ name: '', position: 'Forward', number: '', photoUrl: '', copiedBio: null });
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
                    <form onSubmit={handleAddPlayer} className="p-4 bg-gray-50 border rounded-lg mb-4 space-y-4 animate-fade-in relative">
                        <h4 className="font-bold">New Player Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative" ref={searchRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={newPlayer.name} 
                                        onChange={handleNameChange} 
                                        placeholder="Player Name (Search to link)" 
                                        required 
                                        className={`${inputClass} pr-10`}
                                        autoComplete="off"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <SearchIcon className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        <div className="text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50 border-b">
                                            Found in Database (Click to Link)
                                        </div>
                                        {suggestions.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSelectExisting(item)}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
                                            >
                                                {item.player.photoUrl ? (
                                                    <img src={item.player.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover"/>
                                                ) : (
                                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                                                        <UserIcon className="w-3 h-3"/>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-medium text-gray-900">{item.player.name}</span>
                                                    <span className="text-xs text-gray-500 ml-1">({item.teamName})</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
                                <input type="number" name="number" value={newPlayer.number} onChange={handleInputChange} placeholder="Jersey Number" required className={inputClass} min="1" max="99" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <select name="position" value={newPlayer.position} onChange={handleInputChange} required className={inputClass}>
                                    <option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                <div className="flex items-center gap-2">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                    {newPlayer.photoUrl && <img src={newPlayer.photoUrl} alt="Preview" className="h-9 w-9 rounded-full object-cover border bg-gray-100"/>}
                                </div>
                            </div>
                        </div>

                        {newPlayer.copiedBio && (
                            <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 border border-blue-200 flex items-center gap-2">
                                <span className="font-bold">Info Linked:</span> 
                                Using existing profile data (Age: {newPlayer.copiedBio.age}, Height: {newPlayer.copiedBio.height}). 
                                Stats will reset for new team.
                            </div>
                        )}

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
                                    <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
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
