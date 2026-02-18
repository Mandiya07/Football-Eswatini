
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { Player, Competition, Team } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import SearchIcon from '../icons/SearchIcon';
import UserIcon from '../icons/UserIcon';
import PencilIcon from '../icons/PencilIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction, setDoc, getDoc } from 'firebase/firestore';
import { removeUndefinedProps, superNormalize, reconcilePlayers } from '../../services/utils';
import TeamRosterModal from '../admin/TeamRosterModal';

const ManageSquad: React.FC<{ clubName: string; competitionId: string }> = ({ clubName, competitionId }) => {
    const [squad, setSquad] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTeamObj, setActiveTeamObj] = useState<Team | null>(null);
    const [activeCompId, setActiveCompId] = useState(competitionId || 'independent-clubs');
    const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);

    const sortSquadByPosition = (players: Player[]): Player[] => {
        const positionOrder: Record<Player['position'], number> = {
            'Goalkeeper': 1, 'Defender': 2, 'Midfielder': 3, 'Forward': 4,
        };
        return [...(players || [])].sort((a, b) => (positionOrder[a.position] || 5) - (positionOrder[b.position] || 5));
    };

    const loadData = async () => {
        setLoading(true);
        const normClubName = superNormalize(clubName);
        try {
            const allComps = await fetchAllCompetitions();
            let teamFound: Team | null = null;
            let targetCompId = competitionId || 'independent-clubs';

            // 1. Try specified competition
            if (allComps[targetCompId]) {
                const team = allComps[targetCompId].teams?.find(t => superNormalize(t.name) === normClubName);
                if (team) { teamFound = team; }
            }

            // 2. Global Fallback Scan (Prevents failures for clubs not yet in a league)
            if (!teamFound) {
                for (const [id, comp] of Object.entries(allComps)) {
                    const team = comp.teams?.find(t => superNormalize(t.name) === normClubName);
                    if (team) {
                        teamFound = team;
                        targetCompId = id;
                        break;
                    }
                }
            }

            if (teamFound) {
                // RECONCILE DATA: Crucial fix to show match events in management suite
                const currentComp = allComps[targetCompId];
                const allMatches = [...(currentComp.fixtures || []), ...(currentComp.results || [])];
                const reconciledTeams = reconcilePlayers(currentComp.teams || [], allMatches);
                const reconciledTeam = reconciledTeams.find(t => superNormalize(t.name) === normClubName);
                
                if (reconciledTeam) {
                    setSquad(sortSquadByPosition(reconciledTeam.players || []));
                    setActiveTeamObj(reconciledTeam);
                } else {
                    setSquad(sortSquadByPosition(teamFound.players || []));
                    setActiveTeamObj(teamFound);
                }
                setActiveCompId(targetCompId);
            } else {
                // Initialize empty squad for new/independent team
                setSquad([]);
                setActiveCompId('independent-clubs');
                setActiveTeamObj({
                    id: Date.now(),
                    name: clubName,
                    crestUrl: '',
                    players: [],
                    stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                    fixtures: [], results: [], staff: []
                });
            }

            // Suggestions from other teams for quick transfer
            const globalList: {player: Player, teamName: string}[] = [];
            Object.values(allComps).forEach(c => {
                c.teams?.forEach(t => {
                    if (superNormalize(t.name) !== normClubName) {
                        t.players?.forEach(p => globalList.push({ player: p, teamName: t.name }));
                    }
                });
            });
            setAllGlobalPlayers(globalList);
        } catch (error) {
            console.error("Load Squad Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const [allGlobalPlayers, setAllGlobalPlayers] = useState<{player: Player, teamName: string}[]>([]);
    const [suggestions, setSuggestions] = useState<{player: Player, teamName: string}[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [clubName, competitionId]);
    
    const [newPlayer, setNewPlayer] = useState({
        name: '', position: 'Forward', number: '', photoUrl: '',
        copiedBio: null as any
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewPlayer({ ...newPlayer, [e.target.name]: e.target.value });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewPlayer(prev => ({ ...prev, name: val }));
        if (val.length > 2) {
            const matches = allGlobalPlayers.filter(item => item.player.name.toLowerCase().includes(val.toLowerCase()));
            setSuggestions(Array.from(new Map(matches.map(item => [item.player.name, item])).values()).slice(0, 5));
            setShowSuggestions(true);
        } else { setShowSuggestions(false); }
    };

    const handleSelectExisting = (item: {player: Player, teamName: string}) => {
        setNewPlayer({ name: item.player.name, position: item.player.position, number: '', photoUrl: item.player.photoUrl, copiedBio: item.player.bio });
        setShowSuggestions(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => { if (typeof reader.result === 'string') setNewPlayer(prev => ({ ...prev, photoUrl: reader.result as string })); };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const updateFirestoreSquad = async (updatedSquad: Player[]) => {
        setIsSubmitting(true);
        const docRef = doc(db, 'competitions', activeCompId);
        const normClubName = superNormalize(clubName);
        
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                
                // CRITICAL: Handle missing document for independent-clubs
                if (!docSnap.exists()) {
                    transaction.set(docRef, {
                        name: "Independent Clubs Hub",
                        teams: [{
                            id: Date.now(),
                            name: clubName,
                            players: updatedSquad,
                            stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                            crestUrl: '', staff: [], fixtures: [], results: []
                        }],
                        fixtures: [], results: []
                    });
                    return;
                }

                const comp = docSnap.data() as Competition;
                let teams = comp.teams || [];
                const teamIndex = teams.findIndex(t => superNormalize(t.name) === normClubName);

                if (teamIndex !== -1) {
                    // Update existing
                    teams[teamIndex] = { ...teams[teamIndex], players: updatedSquad };
                } else {
                    // Provision new team entry in this hub
                    teams.push({
                        id: Date.now(),
                        name: clubName,
                        players: updatedSquad,
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                        crestUrl: '', staff: [], fixtures: [], results: []
                    });
                }

                transaction.update(docRef, { teams: removeUndefinedProps(teams) });
            });
            setSquad(sortSquadByPosition(updatedSquad));
            // Refresh local team object to ensure Edit button works
            await loadData();
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
            name: newPlayer.name.trim(),
            position: newPlayer.position as any,
            number: parseInt(newPlayer.number, 10) || 0,
            photoUrl: newPlayer.photoUrl || '',
            bio: newPlayer.copiedBio || { nationality: 'Eswatini', age: 21, height: '-' },
            stats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0 },
            transferHistory: [],
        };
        await updateFirestoreSquad([...squad, playerToAdd]);
        setNewPlayer({ name: '', position: 'Forward', number: '', photoUrl: '', copiedBio: null });
        setShowAddForm(false);
    };
    
    const handleRemovePlayer = async (playerId: number) => {
        if (window.confirm("Remove player from roster?")) {
            await updateFirestoreSquad(squad.filter(p => p.id !== playerId));
        }
    };

    const handleEditPlayer = (player: Player) => {
        if (!activeTeamObj) {
            alert("Linking portal data... please wait.");
            loadData();
            return;
        }
        setSelectedPlayerForEdit(player);
        setIsEditModalOpen(true);
    };

    const inputClass = "block w-full px-3 py-2.5 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm outline-none";
    
    return (
        <Card className="shadow-lg animate-fade-in border-0 overflow-hidden">
            <CardContent className="p-4 lg:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className="text-xl lg:text-2xl font-bold font-display text-slate-900">Squad Management</h3>
                        <p className="text-xs lg:text-sm text-slate-500">Edit profiles, technical stats, and career history.</p>
                    </div>
                    <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary text-white h-11 px-6 rounded-xl inline-flex items-center gap-2 w-full sm:w-auto">
                        <PlusCircleIcon className="w-5 h-5" /> Quick Add
                    </Button>
                </div>

                {showAddForm && (
                    <form onSubmit={handleAddPlayer} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-8 space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative" ref={searchRef}>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Legal Name</label>
                                <div className="relative">
                                    <input type="text" name="name" value={newPlayer.name} onChange={handleNameChange} placeholder="Search database or type..." required className={`${inputClass} pr-10`} autoComplete="off" />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3"><SearchIcon className="h-4 w-4 text-slate-400" /></div>
                                </div>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-20 w-full bg-white mt-2 border rounded-xl shadow-2xl overflow-hidden">
                                        {suggestions.map((item, idx) => (
                                            <button key={idx} type="button" onClick={() => handleSelectExisting(item)} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 border-b last:border-0 border-slate-50">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">{item.player.photoUrl ? <img src={item.player.photoUrl} className="w-full h-full object-cover"/> : <UserIcon className="w-4 h-4 text-slate-300"/>}</div>
                                                <span className="font-bold text-slate-700">{item.player.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Jersey #</label><input type="number" name="number" value={newPlayer.number} onChange={handleInputChange} required className={inputClass} min="1" max="99" /></div>
                                <div><label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Position</label><select name="position" value={newPlayer.position} onChange={handleInputChange} required className={inputClass}><option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option></select></div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Identity Photo</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" className="bg-green-600 text-white px-10 h-12 rounded-xl shadow-xl font-bold" disabled={isSubmitting}>Save to Roster</Button>
                        </div>
                    </form>
                )}
                
                {loading || isSubmitting ? <div className="flex justify-center py-20"><Spinner /></div> : (
                    <div className="space-y-3">
                        {squad.map(player => (
                            <div key={player.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all group">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner">
                                            {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 text-gray-300"/>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 leading-tight truncate">{player.name}</p>
                                            <p className="text-[10px] font-black text-blue-600 uppercase mt-0.5 tracking-tighter">#{player.number} • {player.position}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-slate-50/50 p-2 sm:p-0 rounded-xl sm:bg-transparent">
                                        <div className="text-center">
                                            <p className="text-xs font-black text-slate-900">{player.stats?.appearances || 0}</p>
                                            <p className="text-[8px] font-black uppercase text-slate-400">App</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-green-600">{player.stats?.goals || 0}</p>
                                            <p className="text-[8px] font-black uppercase text-slate-400">Goals</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-blue-600">{player.stats?.assists || 0}</p>
                                            <p className="text-[8px] font-black uppercase text-slate-400">Ast</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <p className="text-xs font-black text-yellow-600">{player.stats?.yellowCards || 0}</p>
                                                <div className="w-1.5 h-2.5 bg-yellow-400 rounded-sm mx-auto mt-0.5 border border-yellow-500"></div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-red-600">{player.stats?.redCards || 0}</p>
                                                <div className="w-1.5 h-2.5 bg-red-600 rounded-sm mx-auto mt-0.5 border border-red-700"></div>
                                            </div>
                                        </div>
                                        {(player.position === 'Goalkeeper' || player.position === 'Defender') && (
                                            <div className="text-center">
                                                <p className="text-xs font-black text-teal-600">{player.stats?.cleanSheets || 0}</p>
                                                <p className="text-[8px] font-black uppercase text-slate-400">CS</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0">
                                        <Link 
                                            to={`/players/${player.id}`} 
                                            target="_blank" 
                                            className="p-2.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center" 
                                            title="View Public Profile"
                                        >
                                            <UserIcon className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleEditPlayer(player)} className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm" title="Edit Full Technical Profile"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleRemovePlayer(player.id)} className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {squad.length === 0 && <div className="text-center py-20 border-2 border-dashed rounded-[2rem] bg-slate-50"><p className="text-slate-400 font-bold italic">Squad list is currently empty.</p></div>}
                    </div>
                )}
            </CardContent>

            {isEditModalOpen && activeTeamObj && (
                <TeamRosterModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => { setIsEditModalOpen(false); setSelectedPlayerForEdit(null); }} 
                    onSave={loadData} 
                    team={activeTeamObj} 
                    competitionId={activeCompId}
                    initialPlayer={selectedPlayerForEdit}
                />
            )}
        </Card>
    );
};

export default ManageSquad;
