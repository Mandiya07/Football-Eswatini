
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Team, Competition } from '../../data/teams';
import { fetchAllCompetitions, updateDirectoryEntry, fetchDirectoryEntries, addDirectoryEntry, handleFirestoreError, OperationType } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import UsersIcon from '../icons/UsersIcon';
import CalendarIcon from '../icons/CalendarIcon';
import TeamFormModal from './TeamFormModal';
import TeamRosterModal from './TeamRosterModal';
import TeamFixturesModal from './TeamFixturesModal';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import { Region, DirectoryEntity } from '../../data/directory';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useDataCache } from '../../contexts/DataCacheContext';
import { useAuth } from '../../contexts/AuthContext';

const ManageTeams: React.FC = () => {
    const { user } = useAuth();
    const { competitions: allCompsCache } = useDataCache();
    const [allCompsData, setAllCompsData] = useState<Record<string, Competition>>({});
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompId, setSelectedCompId] = useState('');
    
    const isSuperAdmin = user?.role === 'super_admin';
    const managedLeagues = user?.managedLeagues || [];

    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<Team | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isFixturesModalOpen, setIsFixturesModalOpen] = useState(false);
    
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
    const [scheduleTeam, setScheduleTeam] = useState<Team | null>(null);

    const loadData = useCallback(async (refreshOnly: boolean = false) => {
        if (!refreshOnly) setLoading(true);
        try {
            const allComps = allCompsCache;
            setAllCompsData(allComps);
            
            // Defensive mapping and sorting for competitions
            const compList = Object.entries(allComps)
                .filter(([id, comp]) => {
                    if (!comp || !comp.name) return false;
                    if (isSuperAdmin) return true;
                    return managedLeagues.includes(id);
                })
                .map(([id, comp]) => ({ id, name: comp.name! }));

            const sortedList = compList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCompetitions(sortedList);

            // Determine active competition
            let activeId = selectedCompId;
            if (!allComps[activeId] || (!isSuperAdmin && !managedLeagues.includes(activeId))) {
                if (sortedList.length > 0) {
                    activeId = sortedList[0].id;
                    setSelectedCompId(activeId);
                } else {
                    activeId = '';
                    setSelectedCompId('');
                }
            }

            if (allComps[activeId]) {
                const teamList = (allComps[activeId].teams || [])
                    .filter(t => t && t.name)
                    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setTeams(teamList);
            } else {
                setTeams([]);
            }
        } catch (error) {
            handleFirestoreError(error, OperationType.GET, 'competitions');
        } finally {
            setLoading(false);
        }
    }, [selectedCompId, allCompsCache]);
    
    useEffect(() => {
        loadData();
    }, []);

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

    const handleDelete = async (teamId: string) => {
        setProcessingId(teamId);
        setIsSubmitting(true);
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
            
            setConfirmDeleteTeam(null);
            await loadData(true);
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `competitions/${selectedCompId}/teams/${teamId}`);
        } finally {
            setProcessingId(null);
            setIsSubmitting(false);
        }
    };

    const handleSaveTeam = async (data: any, id?: string, addToDir: boolean = false) => {
        setLoading(true);
        setIsFormModalOpen(false);
        setIsSubmitting(true);
        try {
            const compDocRef = doc(db, 'competitions', selectedCompId);
            let savedTeamId = id;
            if (id) {
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const oldTeam = (competition.teams || []).find(t => t.id === id);
                    const oldName = oldTeam?.name || '';
                    const newName = data.name;
                    
                    const updatedCompTeams = (competition.teams || []).map(t => t.id === id ? { ...t, ...data } : t);
                    
                    // If the name changed, update fixtures and results
                    let updatedFixtures = competition.fixtures || [];
                    let updatedResults = competition.results || [];
                    let finalTeams = updatedCompTeams;
                    
                    if (oldName && newName && oldName !== newName) {
                        updatedFixtures = updatedFixtures.map(f => ({
                            ...f,
                            teamA: f.teamA === oldName ? newName : f.teamA,
                            teamB: f.teamB === oldName ? newName : f.teamB
                        }));
                        
                        updatedResults = updatedResults.map(r => ({
                            ...r,
                            teamA: r.teamA === oldName ? newName : r.teamA,
                            teamB: r.teamB === oldName ? newName : r.teamB
                        }));
                        
                        finalTeams = calculateStandings(updatedCompTeams, updatedResults);
                    }
                    
                    transaction.update(compDocRef, removeUndefinedProps({ 
                        teams: finalTeams,
                        fixtures: updatedFixtures,
                        results: updatedResults
                    }));
                });
            } else {
                const newTeamId = String(Date.now());
                savedTeamId = newTeamId;
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    const newTeam: Team = {
                        id: newTeamId,
                        name: data.name,
                        crestUrl: data.crestUrl || '',
                        players: [], fixtures: [], results: [], staff: [],
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                        shortName: data.name.substring(0, 3).toUpperCase(),
                        logo: data.crestUrl || '',
                        primaryColor: '#000000',
                        secondaryColor: '#FFFFFF',
                        founded: 1900,
                        stadium: 'TBD',
                        city: 'TBD',
                        coach: 'TBD'
                    };
                    const updatedCompTeams = [...(competition.teams || []), newTeam];
                    transaction.update(compDocRef, { teams: updatedCompTeams });
                });
            }
            await loadData(true);
            
            if (addToDir && savedTeamId) {
                try {
                    const dirEntries = await fetchDirectoryEntries();
                    // Find an existing entry for this team.
                    const existingEntryId = Object.keys(dirEntries).find(key => {
                        const entry = dirEntries[key];
                        return entry.teamId === savedTeamId && entry.competitionId === selectedCompId;
                    });
                    
                    const dirData: Partial<DirectoryEntity> = {
                        name: data.name,
                        crestUrl: data.crestUrl || '',
                        logo: data.crestUrl || '',
                        contact: data.socialMedia ? { website: data.socialMedia.website } : {}
                    };

                    if (existingEntryId) {
                        await updateDirectoryEntry(existingEntryId, dirData);
                    } else {
                        // Creating a new directory entry for existing team if not found
                        await addDirectoryEntry({
                            name: data.name,
                            type: 'club',
                            description: `Professional football club competing in Eswatini.`,
                            contact: data.socialMedia ? { website: data.socialMedia.website } : {},
                            logo: data.crestUrl || '',
                            crestUrl: data.crestUrl || '',
                            category: 'Club',
                            teamId: savedTeamId,
                            competitionId: selectedCompId,
                            region: 'National'
                        });
                    }
                } catch (dirErr) {
                    console.error("Failed to sync with directory:", dirErr);
                }
            }
        } catch (error) {
            handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, id ? `competitions/${selectedCompId}/teams/${id}` : `competitions/${selectedCompId}/teams`);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold font-display">Manage Teams</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5 text-white" /> Add Team
                        </Button>
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="comp-select-teams" className="block text-sm font-bold text-gray-700 mb-2">Select Competition</label>
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
                                            <p className="text-xs text-gray-500 font-medium">ID: {team.id} &bull; {team.players?.length || 0} Players</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleManageSchedule(team)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" title="Schedule"><CalendarIcon className="w-5 h-5 text-white"/></button>
                                        <button onClick={() => handleManageRoster(team)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" title="Roster"><UsersIcon className="w-5 h-5 text-white"/></button>
                                        <button onClick={() => handleEdit(team)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm" title="Edit"><PencilIcon className="w-5 h-5 text-white"/></button>
                                        <button onClick={() => { setConfirmDeleteTeam(team); setShowConfirmModal(true); }} disabled={processingId === team.id} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm" title="Delete">
                                            {processingId === team.id ? <Spinner className="w-5 h-5 border-white border-2" /> : <TrashIcon className="w-5 h-5 text-white" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && <p className="text-center text-gray-500 py-12 italic border-2 border-dashed rounded-xl">No teams found in this competition.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showConfirmModal && confirmDeleteTeam && (
                <ConfirmationModal
                    isOpen={showConfirmModal}
                    onClose={() => { setShowConfirmModal(false); setConfirmDeleteTeam(null); }}
                    onConfirm={() => handleDelete(confirmDeleteTeam.id)}
                    title="Delete Team"
                    message={`Are you sure you want to delete ${confirmDeleteTeam.name}? Standings will be recalculated. This action cannot be undone.`}
                    confirmText={isSubmitting ? 'Deleting...' : 'Delete'}
                    variant="danger"
                />
            )}
            
            {isFormModalOpen && <TeamFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveTeam} team={editingTeam} competitionId={selectedCompId} />}
            {isRosterModalOpen && rosterTeam && <TeamRosterModal isOpen={isRosterModalOpen} onClose={() => setIsRosterModalOpen(false)} onSave={() => loadData(true)} team={rosterTeam} competitionId={selectedCompId} />}
            {isFixturesModalOpen && scheduleTeam && <TeamFixturesModal isOpen={isFixturesModalOpen} onClose={() => setIsFixturesModalOpen(false)} team={scheduleTeam} competitionId={selectedCompId} />}
        </div>
    );
};
export default ManageTeams;
