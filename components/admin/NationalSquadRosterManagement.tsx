import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Team, Competition } from '../../data/teams';
import { fetchAllCompetitions, handleFirestoreError, OperationType, fetchCups } from '../../services/api';
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
import ConfirmationModal from '../ui/ConfirmationModal';
import { useDataCache } from '../../contexts/DataCacheContext';

const NationalSquadRosterManagement: React.FC = () => {
    const { competitions: allCompsCache } = useDataCache();
    const [allCompsData, setAllCompsData] = useState<Record<string, Competition>>({});
    const [competitions, setCompetitions] = useState<{ id: string, name: string, isCup: boolean }[]>([]);
    const [selectedCompId, setSelectedCompId] = useState('');
    const [isCupSelection, setIsCupSelection] = useState(false);
    
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
            
            // Get cups to handle them too if needed
            const cups = await fetchCups();
            
            // Filter to ONLY national-teams category!
            const compList = Object.entries(allComps)
                .filter(([_, comp]) => comp && comp.categoryId === 'national-teams')
                .map(([id, comp]) => ({ id, name: comp.name || id, isCup: false }));

            const cupList = cups
                .filter(c => c && c.categoryId === 'national-teams')
                .map(c => ({ id: c.id, name: c.name || c.id, isCup: true }));

            const combinedList = [...compList, ...cupList].sort((a, b) => a.name.localeCompare(b.name));
            setCompetitions(combinedList);

            // Determine active competition
            let activeId = selectedCompId;
            let activeItem = combinedList.find(c => c.id === activeId);
            if (!activeItem && combinedList.length > 0) {
                activeItem = combinedList[0];
                activeId = activeItem.id;
                setSelectedCompId(activeId);
                setIsCupSelection(activeItem.isCup);
            }

            if (activeItem) {
                if (activeItem.isCup) {
                    const matchedCup = cups.find(c => c.id === activeId);
                    const teamList = ((matchedCup as any)?.teams || [])
                        .filter((t: any) => t && t.name)
                        .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
                    setTeams(teamList);
                } else if (allComps[activeId]) {
                    const teamList = (allComps[activeId].teams || [])
                        .filter(t => t && t.name)
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    setTeams(teamList);
                } else {
                    setTeams([]);
                }
            } else {
                setTeams([]);
            }
        } catch (error) {
            console.error("Failed to load national competitions data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompId, allCompsCache]);
    
    useEffect(() => {
        loadData();
    }, [selectedCompId]);

    const handleCompChange = (compId: string) => {
        const item = competitions.find(c => c.id === compId);
        if (item) {
            setSelectedCompId(compId);
            setIsCupSelection(item.isCup);
        }
    };

    const handleAddNew = () => {
        if (isCupSelection) {
            alert("Rosters/squads are managed primarily under League structures. For Cup tournaments, please manage through the Cup/Tournament configuration.");
            return;
        }
        setEditingTeam(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (team: Team) => {
        if (isCupSelection) {
            alert("Squad details are managed on Leagues/Squads. Cups serve primarily as tournament structures.");
            return;
        }
        setEditingTeam(team);
        setIsFormModalOpen(true);
    };

    const handleManageRoster = (team: Team) => {
        setRosterTeam(team);
        setIsRosterModalOpen(true);
    };

    const handleManageSchedule = (team: Team) => {
        if (isCupSelection) {
            alert("Schedules for cups are governed by the tournament brackets under Cups management.");
            return;
        }
        setScheduleTeam(team);
        setIsFixturesModalOpen(true);
    };

    const handleDelete = async (teamId: string) => {
        if (isCupSelection) return;
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

    const handleSaveTeam = async (data: any, id?: string) => {
        if (isCupSelection) return;
        setLoading(true);
        setIsFormModalOpen(false);
        setIsSubmitting(true);
        try {
            const compDocRef = doc(db, 'competitions', selectedCompId);
            if (id) {
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const oldTeam = (competition.teams || []).find(t => t.id === id);
                    const oldName = oldTeam?.name || '';
                    const newName = data.name;
                    
                    const updatedCompTeams = (competition.teams || []).map(t => t.id === id ? { ...t, ...data } : t);
                    
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
                        primaryColor: '#002B7F',
                        secondaryColor: '#E0163A',
                        founded: 2026,
                        stadium: 'TBD',
                        city: 'Mbabane',
                        coach: 'TBD'
                    };
                    const updatedCompTeams = [...(competition.teams || []), newTeam];
                    transaction.update(compDocRef, { teams: updatedCompTeams });
                });
            }
            await loadData(true);
        } catch (error) {
            handleFirestoreError(error, id ? OperationType.UPDATE : OperationType.CREATE, id ? `competitions/${selectedCompId}/teams/${id}` : `competitions/${selectedCompId}/teams`);
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    const targetCollection = isCupSelection ? 'cups' : 'competitions';

    return (
        <div className="max-w-full overflow-hidden space-y-6">
            <Card className="shadow-lg border border-slate-100 rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Squad Rosters & Schedules</h3>
                            <p className="text-slate-500 text-xs font-semibold">Select an active national squad or structure to manage its roster, players, and fixtures.</p>
                        </div>
                        {!isCupSelection && selectedCompId && (
                            <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                                <PlusCircleIcon className="w-4 h-4 text-white" /> Add Squad/Team
                            </Button>
                        )}
                    </div>
                    
                    <div className="mb-6 max-w-md">
                        <label htmlFor="comp-select-national-teams" className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Select National Category/Squad</label>
                        <select
                            id="comp-select-national-teams"
                            value={selectedCompId}
                            onChange={(e) => handleCompChange(e.target.value)}
                            className="block w-full px-4 py-3 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm bg-white font-bold"
                        >
                            <option value="" disabled>-- Select National Cohort --</option>
                            {competitions.map(c => (
                                <option key={c.id} value={c.id}>{c.name} {c.isCup ? '(Cup structure)' : '(League/Squad)'}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                        <div className="space-y-3">
                            {teams.map(team => (
                                <div key={team.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-1.5">
                                            {team.crestUrl ? <img src={team.crestUrl} alt={team.name} className="w-10 h-10 object-contain" /> : <UsersIcon className="w-6 h-6 text-gray-300"/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{team.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{team.players?.length || 0} Registered Players</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isCupSelection && (
                                            <button onClick={() => handleManageSchedule(team)} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm" title="Schedule/Matches">
                                                <CalendarIcon className="w-4 h-4 text-white"/>
                                            </button>
                                        )}
                                        <button onClick={() => handleManageRoster(team)} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1 px-3" title="Roster/Players">
                                            <UsersIcon className="w-4 h-4 text-white"/> <span className="text-[10px] font-black uppercase tracking-wider">Roster</span>
                                        </button>
                                        {!isCupSelection && (
                                            <>
                                                <button onClick={() => handleEdit(team)} className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors shadow-sm" title="Edit Metadata">
                                                    <PencilIcon className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => { setConfirmDeleteTeam(team); setShowConfirmModal(true); }} disabled={processingId === team.id} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm" title="Delete">
                                                    {processingId === team.id ? <Spinner className="w-4 h-4 border-red-600 border-2" /> : <TrashIcon className="w-4 h-4" />}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && selectedCompId && (
                                <p className="text-center text-gray-500 py-12 italic border-2 border-dashed rounded-3xl">No squads or roster segments registered for this National Cohort yet.</p>
                            )}
                            {!selectedCompId && (
                                <p className="text-center text-gray-500 py-12 italic border-2 border-dashed rounded-3xl">Please select a National cohort from the menu above to start editing.</p>
                            )}
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

export default NationalSquadRosterManagement;
