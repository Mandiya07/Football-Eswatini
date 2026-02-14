
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../../services/firebase';
/* Added missing 'collection' import */
import { doc, runTransaction, collection } from 'firebase/firestore';
import { Team, Competition } from '../../data/teams';
import { fetchAllCompetitions, updateDirectoryEntry, fetchDirectoryEntries, addDirectoryEntry, deleteDirectoryEntry, handleFirestoreError } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import UsersIcon from '../icons/UsersIcon';
import CalendarIcon from '../icons/CalendarIcon';
/* Added missing 'TrophyIcon' import */
import TrophyIcon from '../icons/TrophyIcon';
import TeamFormModal from '../admin/TeamFormModal';
import TeamRosterModal from '../admin/TeamRosterModal';
import TeamFixturesModal from '../admin/TeamFixturesModal';
import { calculateStandings, removeUndefinedProps, renameTeamInMatches, superNormalize } from '../../services/utils';
import { useAuth } from '../../contexts/AuthContext';

const ManageTeams: React.FC = () => {
    const { user } = useAuth();
    const [allCompsData, setAllCompsData] = useState<Record<string, Competition>>({});
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompId, setSelectedCompId] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isFixturesModalOpen, setIsFixturesModalOpen] = useState(false);
    
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
    const [scheduleTeam, setScheduleTeam] = useState<Team | null>(null);

    const isSuperAdmin = user?.role === 'super_admin';
    const isLeagueAdmin = user?.role === 'league_admin';

    const loadData = useCallback(async (refreshOnly: boolean = false) => {
        if (!refreshOnly) setLoading(true);
        try {
            const allComps = await fetchAllCompetitions();
            setAllCompsData(allComps);
            
            // Filter and sort competitions based on role
            const compList = Object.entries(allComps)
                .filter(([id, comp]) => {
                    if (!comp || !comp.name) return false;
                    if (isSuperAdmin) return true;
                    // Scoping for League Admins
                    return user?.managedLeagues?.includes(id);
                })
                .map(([id, comp]) => ({ id, name: comp.name! }));

            const sortedList = compList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCompetitions(sortedList);

            // Determine active competition
            let activeId = selectedCompId;
            if ((!activeId || !allComps[activeId]) && sortedList.length > 0) {
                activeId = sortedList[0].id;
                setSelectedCompId(activeId);
            }

            if (activeId && allComps[activeId]) {
                const teamList = (allComps[activeId].teams || [])
                    .filter(t => t && t.name)
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setTeams(teamList);
            } else {
                setTeams([]);
            }
        } catch (error) {
            console.error("Failed to load teams data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompId, isSuperAdmin, user?.managedLeagues]);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCompChange = (compId: string) => {
        setSelectedCompId(compId);
        if (allCompsData[compId]) {
            const teamList = (allCompsData[compId].teams || [])
                .filter(t => t && t.name)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setTeams(teamList);
        } else {
            setTeams([]);
        }
    };

    const handleAddNew = () => {
        setEditingTeam(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setIsFormModalOpen(true);
    };

    const handleManageRoster = (team: Team) => {
        setRosterTeam(team);
        setIsRosterModalOpen(true);
    };

    const handleManageSchedule = (team: Team) => {
        setScheduleTeam(team);
        setIsFixturesModalOpen(true);
    };

    const handleDelete = async (teamId: number) => {
        if (!window.confirm("Are you sure you want to delete this team? Standings will be recalculated.")) {
            return;
        }

        setProcessingId(teamId);
        const compDocRef = doc(db, 'competitions', selectedCompId);
        try {
            await runTransaction(db, async (transaction) => {
                const compDocSnap = await transaction.get(compDocRef);
                if (!compDocSnap.exists()) throw new Error("Competition not found");
                const competition = compDocSnap.data() as Competition;

                const teamIndex = (competition.teams || []).findIndex(t => t.id === teamId);
                if (teamIndex === -1) throw new Error("Team not found in competition");
                
                const teamToDelete = competition.teams![teamIndex];
                const targetName = teamToDelete.name.trim();
                
                const updatedCompTeams = [...(competition.teams || [])];
                updatedCompTeams.splice(teamIndex, 1);

                const updatedFixtures = (competition.fixtures || []).filter(f => 
                    f.teamA.trim() !== targetName && f.teamB.trim() !== targetName
                );
                const updatedResults = (competition.results || []).filter(r => 
                    r.teamA.trim() !== targetName && r.teamB.trim() !== targetName
                );
                
                const recalculatedTeams = calculateStandings(updatedCompTeams, updatedResults);
                transaction.update(compDocRef, removeUndefinedProps({ teams: recalculatedTeams, fixtures: updatedFixtures, results: updatedResults }));
            });
            
            await loadData(true);
        } catch (error) {
            console.error("Error deleting team:", error);
            alert("Failed to delete team.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveTeam = async (data: any, id?: number, addToDir: boolean = false) => {
        setLoading(true);
        setIsFormModalOpen(false);
        try {
            const compDocRef = doc(db, 'competitions', selectedCompId);
            const teamName = data.name.trim();

            if (id) {
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const oldTeam = competition.teams.find(t => t.id === id);
                    if (!oldTeam) throw new Error("Team not found");

                    const oldName = oldTeam.name;
                    const nameChanged = superNormalize(oldName) !== superNormalize(teamName);

                    const updatedCompTeams = (competition.teams || []).map(t => t.id === id ? { ...t, ...data } : t);
                    
                    let fixtures = competition.fixtures || [];
                    let results = competition.results || [];

                    if (nameChanged) {
                        fixtures = renameTeamInMatches(fixtures, oldName, teamName);
                        results = renameTeamInMatches(results, oldName, teamName);
                        
                        const dirEntries = await fetchDirectoryEntries();
                        const dirEntry = dirEntries.find(e => e.teamId === id && e.competitionId === selectedCompId);
                        if (dirEntry) {
                            transaction.update(doc(db, 'directory', dirEntry.id), { name: teamName });
                        }
                    }

                    const finalTeams = calculateStandings(updatedCompTeams, results, fixtures);
                    transaction.update(compDocRef, removeUndefinedProps({ 
                        teams: finalTeams, 
                        fixtures, 
                        results 
                    }));
                });
            } else {
                const maxId = teams.reduce((max, team) => Math.max(max, team.id), 0);
                const newTeamId = maxId > 0 ? maxId + 1 : 1;
                
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    const newTeam: Team = {
                        id: newTeamId,
                        name: teamName,
                        crestUrl: data.crestUrl || '',
                        players: [], fixtures: [], results: [], staff: [],
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
                    };
                    const updatedCompTeams = [...(competition.teams || []), newTeam];
                    transaction.update(compDocRef, { teams: updatedCompTeams });

                    if (addToDir) {
                        const newDirRef = doc(collection(db, 'directory'));
                        transaction.set(newDirRef, {
                            name: teamName,
                            category: 'Club',
                            region: competition.region || 'National',
                            crestUrl: data.crestUrl || '',
                            teamId: newTeamId,
                            competitionId: selectedCompId,
                            tier: 'Regional'
                        });
                    }
                });
            }

            await loadData(true);
        } catch (error) {
            console.error("Save team failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (competitions.length === 0 && !loading) {
        return (
            <Card className="shadow-lg border-0 bg-white">
                <CardContent className="p-12 text-center">
                    <TrophyIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-bold">No authorized leagues found.</p>
                    <p className="text-sm text-gray-400 mt-1">If you recently requested a league, please wait for admin approval.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-full overflow-hidden">
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold font-display">Hub Roster Manager</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5 text-white" /> Add New Club
                        </Button>
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="comp-select-teams" className="block text-sm font-bold text-gray-700 mb-2">Target Competition</label>
                        <select
                            id="comp-select-teams"
                            value={selectedCompId}
                            onChange={(e) => handleCompChange(e.target.value)}
                            className="block w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        >
                            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                        <div className="space-y-3">
                            {teams.map(team => (
                                <div key={team.id} className="p-4 bg-white border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 p-1">
                                            {team.crestUrl ? <img src={team.crestUrl} alt={team.name} className="w-10 h-10 object-contain" /> : <UsersIcon className="w-6 h-6 text-gray-300"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{team.name}</p>
                                            <p className="text-xs text-gray-500 font-medium">{team.players?.length || 0} Registered Players</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleManageSchedule(team)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" title="Schedule"><CalendarIcon className="w-5 h-5 text-white"/></button>
                                        <button onClick={() => handleManageRoster(team)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" title="Roster"><UsersIcon className="w-5 h-5 text-white"/></button>
                                        <button onClick={() => handleEdit(team)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" title="Edit"><PencilIcon className="w-4 h-4 text-white"/></button>
                                        <button onClick={() => handleDelete(team.id)} disabled={processingId === team.id} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm" title="Delete">
                                            {processingId === team.id ? <Spinner className="w-5 h-5 border-white border-2" /> : <TrashIcon className="w-5 h-5 text-white" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && <p className="text-center text-gray-500 py-12 italic border-2 border-dashed rounded-xl">No teams registered in this hub yet.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {isFormModalOpen && <TeamFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveTeam} team={editingTeam} competitionId={selectedCompId} />}
            {isRosterModalOpen && rosterTeam && <TeamRosterModal isOpen={isRosterModalOpen} onClose={() => setIsRosterModalOpen(false)} onSave={() => loadData(true)} team={rosterTeam} competitionId={selectedCompId} />}
            {isFixturesModalOpen && scheduleTeam && <TeamFixturesModal isOpen={isFixturesModalOpen} onClose={() => setIsFixturesModalOpen(false)} team={scheduleTeam} competitionId={selectedCompId} />}
        </div>
    );
};
export default ManageTeams;
