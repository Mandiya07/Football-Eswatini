
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllCompetitions, fetchStandaloneMatches, handleFirestoreError, fetchDirectoryEntries } from '../../services/api';
import { Player, Competition, Team, CompetitionFixture } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import SearchIcon from '../icons/SearchIcon';
import UserIcon from '../icons/UserIcon';
import UsersIcon from '../icons/UsersIcon';
import PencilIcon from '../icons/PencilIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, superNormalize, reconcilePlayers, findInMap } from '../../services/utils';
import TeamRosterModal from '../admin/TeamRosterModal';

const ManageSquad: React.FC<{ clubName: string; competitionId: string }> = ({ clubName, competitionId }) => {
    const [squad, setSquad] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTeamObj, setActiveTeamObj] = useState<Team | null>(null);
    const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState<Player | null>(null);
    const [allGlobalPlayers, setAllGlobalPlayers] = useState<{player: Player, teamName: string}[]>([]);
    const [suggestions, setSuggestions] = useState<{player: Player, teamName: string}[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const sortSquadByPosition = (players: Player[]): Player[] => {
        const positionOrder: Record<string, number> = {
            'Goalkeeper': 1, 'Defender': 2, 'Midfielder': 3, 'Forward': 4,
        };
        // Fix: Changed posOrder to positionOrder to resolve the crash
        return [...(players || [])].sort((a, b) => (positionOrder[a.position] || 5) - (positionOrder[b.position] || 5));
    };

    /**
     * AUTHORITATIVE RECONCILIATION LOADER
     * Exact parity with TeamProfilePage logic to ensure 100% data correspondence.
     * 1. Resolves global identity via Directory.
     * 2. Locates all hub instances of the team.
     * 3. Aggregates match events from every corner of the database.
     * 4. Derives verified technical statistics.
     */
    const loadData = useCallback(async () => {
        setLoading(true);
        const normClubName = superNormalize(clubName);
        
        try {
            const [directoryEntries, allCompetitionsData, standaloneMatches] = await Promise.all([
                fetchDirectoryEntries(),
                fetchAllCompetitions(),
                fetchStandaloneMatches(clubName)
            ]);

            // 1. Identify the canonical Team ID from the global directory
            const dirEntry = findInMap(clubName, new Map(directoryEntries.map(e => [e.name.toLowerCase(), e])));
            const teamId = dirEntry?.teamId;

            // 2. Discover all aliases/instances of this team across all hubs (League, Cup, etc.)
            const teamVersions: Team[] = [];
            Object.entries(allCompetitionsData).forEach(([compId, comp]) => {
                const teamMatch = comp.teams?.find(t => 
                    superNormalize(t.name) === normClubName || 
                    (teamId && String(t.id) === String(teamId))
                );
                if (teamMatch) teamVersions.push(teamMatch);
            });

            // 3. Aggregate every single match record involving these aliases from all hubs
            const masterMatchList: CompetitionFixture[] = [...standaloneMatches];
            const teamAliases = new Set(teamVersions.map(t => superNormalize(t.name)));
            
            Object.values(allCompetitionsData).forEach(hub => {
                const hubMatches = [...(hub.fixtures || []), ...(hub.results || [])].filter(m => 
                    teamAliases.has(superNormalize(m.teamA)) || teamAliases.has(superNormalize(m.teamB))
                );
                masterMatchList.push(...hubMatches);
            });

            // 4. Run Technical Reconciliation (Event Log -> Technical Stats)
            // This recalculates goals, apps, and cards from the ground up
            const reconciledTeams = reconcilePlayers(teamVersions, masterMatchList);
            const masterTeam = reconciledTeams.find(t => teamAliases.has(superNormalize(t.name))) || reconciledTeams[0];
            
            if (masterTeam) {
                setSquad(sortSquadByPosition(masterTeam.players || []));
                setActiveTeamObj(masterTeam);
            }

            // 5. Update global suggestions for "Add Existing Player"
            const globalList: {player: Player, teamName: string}[] = [];
            Object.values(allCompetitionsData).forEach(c => {
                c.teams?.forEach(t => {
                    if (!teamAliases.has(superNormalize(t.name))) {
                        t.players?.forEach(p => globalList.push({ player: p, teamName: t.name }));
                    }
                });
            });
            setAllGlobalPlayers(globalList);
        } catch (error) {
            console.error("Management Suite Parity Load Error:", error);
        } finally {
            setLoading(false);
        }
    }, [clubName]);

    useEffect(() => {
        loadData();
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [loadData]);
    
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

    const updateFirestoreSquad = async (updatedSquad: Player[]) => {
        setIsSubmitting(true);
        const docRef = doc(db, 'competitions', competitionId);
        const normClubName = superNormalize(clubName);
        
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) return;
                const comp = docSnap.data() as Competition;
                let teams = comp.teams || [];
                const teamIndex = teams.findIndex(t => superNormalize(t.name) === normClubName);
                if (teamIndex !== -1) {
                    // Strip volatile calculated properties before DB persistence
                    // These are re-generated dynamically from match events on load
                    const cleanedSquad = updatedSquad.map(({ isDiscovered, stats, ...p }: any) => p);
                    teams[teamIndex] = { ...teams[teamIndex], players: cleanedSquad };
                }
                transaction.update(docRef, { teams: removeUndefinedProps(teams) });
            });
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
            baseStats: { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, cleanSheets: 0 },
            transferHistory: [],
        };
        await updateFirestoreSquad([...squad, playerToAdd]);
        setNewPlayer({ name: '', position: 'Forward', number: '', photoUrl: '', copiedBio: null });
        setShowAddForm(false);
    };
    
    const handleRemovePlayer = async (playerId: number) => {
        if (window.confirm("Remove player from roster? Historical match records are preserved but the profile link will be broken.")) {
            await updateFirestoreSquad(squad.filter(p => p.id !== playerId));
        }
    };

    const handleEditPlayer = (player: Player) => {
        setSelectedPlayerForEdit(player);
        setIsEditModalOpen(true);
    };

    const inputClass = "block w-full px-4 py-3 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm outline-none transition-all bg-white";
    
    return (
        <Card className="shadow-lg animate-fade-in border-0 overflow-hidden rounded-[2rem]">
            <CardContent className="p-6 lg:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                    <div>
                        <h3 className="text-2xl lg:text-3xl font-black font-display text-slate-900 tracking-tight">Technical Suite</h3>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cross-Hub Match Data Sync Active</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary text-white h-12 px-8 rounded-2xl inline-flex items-center gap-2 w-full sm:w-auto shadow-xl hover:scale-105 active:scale-95 transition-all">
                        <PlusCircleIcon className="w-5 h-5" /> Add Profile
                    </Button>
                </div>

                {showAddForm && (
                    <form onSubmit={handleAddPlayer} className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] mb-10 space-y-6 animate-fade-in shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="relative" ref={searchRef}>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Legal Identity</label>
                                <div className="relative">
                                    <input type="text" name="name" value={newPlayer.name} onChange={handleNameChange} placeholder="Search global database..." required className={`${inputClass} pr-12`} autoComplete="off" />
                                    <div className="absolute inset-y-0 right-4 flex items-center"><SearchIcon className="h-5 w-5 text-slate-300" /></div>
                                </div>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-20 w-full bg-white mt-3 border border-slate-100 rounded-[1.5rem] shadow-2xl overflow-hidden">
                                        <div className="px-4 py-2 bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-50 tracking-widest">Database Match Found</div>
                                        {suggestions.map((item, idx) => (
                                            <button key={idx} type="button" onClick={() => handleSelectExisting(item)} className="w-full text-left px-5 py-4 text-sm hover:bg-slate-50 flex items-center gap-4 border-b last:border-0 border-slate-50 transition-colors">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white shadow-sm">{item.player.photoUrl ? <img src={item.player.photoUrl} className="w-full h-full object-cover"/> : <UserIcon className="w-5 h-5 text-slate-300"/>}</div>
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{item.player.name}</span>
                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{item.teamName}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-[0.2em]">Jersey #</label><input type="number" name="number" value={newPlayer.number} onChange={handleInputChange} required className={inputClass} min="1" max="99" /></div>
                                <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-[0.2em]">Position</label><select name="position" value={newPlayer.position} onChange={handleInputChange} required className={inputClass}><option>Forward</option><option>Midfielder</option><option>Defender</option><option>Goalkeeper</option></select></div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" className="bg-green-600 text-white px-12 h-14 rounded-2xl shadow-xl font-black uppercase tracking-widest text-[10px]" disabled={isSubmitting}>Commit to Roster</Button>
                        </div>
                    </form>
                )}
                
                {loading || isSubmitting ? <div className="flex justify-center py-24"><Spinner /></div> : (
                    <div className="space-y-4">
                        {squad.map(player => (
                            <div key={player.id} className="p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-xl transition-all group hover:border-primary/20">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5 min-w-0">
                                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-50 flex-shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            {player.photoUrl ? <img src={player.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-8 h-8 text-gray-300"/>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3">
                                                <p className="font-black text-slate-900 text-lg leading-tight truncate">{player.name}</p>
                                                {(player as any).isDiscovered && (
                                                    <div className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full border border-purple-100 shadow-sm animate-in zoom-in duration-500">
                                                        <SparklesIcon className="w-3 h-3"/>
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Match Record Discovery</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase mt-1 tracking-widest">#{player.number || '??'} • {player.position}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-6 bg-slate-50 p-4 rounded-2xl lg:bg-transparent lg:p-0">
                                        <div className="text-center min-w-[40px]">
                                            <p className="text-lg font-black text-slate-900 tabular-nums">{player.stats?.appearances || 0}</p>
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Matches</p>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
                                        <div className="text-center min-w-[40px]">
                                            <p className="text-lg font-black text-green-600 tabular-nums">{player.stats?.goals || 0}</p>
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Goals</p>
                                        </div>
                                        <div className="text-center min-w-[40px]">
                                            <p className="text-lg font-black text-blue-600 tabular-nums">{player.stats?.assists || 0}</p>
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Assists</p>
                                        </div>
                                        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                                            <div className="text-center">
                                                <p className="text-sm font-black text-yellow-600">{player.stats?.yellowCards || 0}</p>
                                                <div className="w-2 h-3 bg-yellow-400 rounded-sm mx-auto mt-1 shadow-sm border border-yellow-500"></div>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-red-600">{player.stats?.redCards || 0}</p>
                                                <div className="w-2 h-3 bg-red-600 rounded-sm mx-auto mt-1 shadow-sm border border-red-700"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                                        <Link to={`/players/${player.id}`} target="_blank" className="p-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center flex-1 lg:flex-none"><UserIcon className="w-5 h-5" /></Link>
                                        <button onClick={() => handleEditPlayer(player)} className="p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm flex-1 lg:flex-none"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleRemovePlayer(player.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm flex-1 lg:flex-none"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {squad.length === 0 && (
                            <div className="text-center py-32 border-4 border-dashed rounded-[3.5rem] bg-slate-50 flex flex-col items-center justify-center">
                                <UsersIcon className="w-20 h-20 text-slate-200 mb-6" />
                                <p className="text-slate-400 font-bold text-lg">Digital Roster Empty</p>
                                <p className="text-slate-400 text-sm max-w-xs mt-2 italic text-center">Add players manually or wait for match records to sync.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            {isEditModalOpen && activeTeamObj && (
                <TeamRosterModal 
                    isOpen={isEditModalOpen} 
                    onClose={() => { setIsEditModalOpen(false); setSelectedPlayerForEdit(null); }} 
                    onSave={loadData} 
                    team={activeTeamObj} 
                    competitionId={competitionId}
                    initialPlayer={selectedPlayerForEdit}
                />
            )}
        </Card>
    );
};

export default ManageSquad;
