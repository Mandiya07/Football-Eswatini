
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Team, Competition } from '../../data/teams';
import { fetchAllCompetitions } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import TeamFormModal from './TeamFormModal';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';

const ManageTeams: React.FC = () => {
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompId, setSelectedCompId] = useState('mtn-premier-league');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const allComps = await fetchAllCompetitions();
            const compList = Object.entries(allComps).map(([id, comp]) => ({ id, name: comp.name }));
            setCompetitions(compList);

            if (selectedCompId && allComps[selectedCompId]) {
                setTeams((allComps[selectedCompId].teams || []).sort((a,b) => a.name.localeCompare(b.name)));
            } else if (compList.length > 0) {
                const firstCompId = compList[0].id;
                setSelectedCompId(firstCompId);
                setTeams((allComps[firstCompId].teams || []).sort((a,b) => a.name.localeCompare(b.name)));
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        loadData();
    }, []);

    const handleCompChange = async (compId: string) => {
        setSelectedCompId(compId);
        setLoading(true);
        try {
            const allComps = await fetchAllCompetitions();
            if (allComps[compId]) {
                 setTeams((allComps[compId].teams || []).sort((a,b) => a.name.localeCompare(b.name)));
            } else {
                setTeams([]);
            }
        } catch (error) {
             console.error("Failed to load teams for new competition:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingTeam(null);
        setIsModalOpen(true);
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setIsModalOpen(true);
    };

    const handleDelete = async (teamId: number) => {
        if (!window.confirm("Are you sure you want to delete this team? This will also remove them from any associated fixtures and results, and standings will be recalculated.")) {
            return;
        }

        setDeletingId(teamId);
        const compDocRef = doc(db, 'competitions', selectedCompId);
        try {
            await runTransaction(db, async (transaction) => {
                const compDocSnap = await transaction.get(compDocRef);
                if (!compDocSnap.exists()) throw new Error("Competition not found");
                const competition = compDocSnap.data() as Competition;

                const targetId = String(teamId).trim();
                
                const teamIndex = (competition.teams || []).findIndex(t => String(t.id).trim() === targetId);
                
                if (teamIndex === -1) throw new Error("Team not found in competition");
                
                const teamToDelete = competition.teams![teamIndex];
                const targetName = teamToDelete.name.trim();
                
                // 1. Remove team from list
                const updatedCompTeams = [...(competition.teams || [])];
                updatedCompTeams.splice(teamIndex, 1);

                // 2. Filter out fixtures and results involving the deleted team
                // Robustly check names with trim() to avoid ghost matches staying behind
                const updatedFixtures = (competition.fixtures || []).filter(f => 
                    f.teamA.trim() !== targetName && f.teamB.trim() !== targetName
                );
                const updatedResults = (competition.results || []).filter(r => 
                    r.teamA.trim() !== targetName && r.teamB.trim() !== targetName
                );
                
                // 3. Recalculate standings
                const recalculatedTeams = calculateStandings(updatedCompTeams, updatedResults);

                transaction.update(compDocRef, removeUndefinedProps({ teams: recalculatedTeams, fixtures: updatedFixtures, results: updatedResults }));
            });
            
            await loadData();

        } catch (error) {
            console.error("Error deleting team:", error);
            alert("Failed to delete team. " + (error as Error).message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSave = async (data: Omit<Team, 'id' | 'stats' | 'players' | 'fixtures' | 'results' | 'staff'>, id?: number) => {
        setLoading(true);
        setIsModalOpen(false);
        
        try {
            const compDocRef = doc(db, 'competitions', selectedCompId);
    
            if (id) { // --- EDITING ---
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const targetId = String(id).trim();
                    const oldTeam = competition.teams?.find(t => String(t.id).trim() === targetId);
                    if (!oldTeam) throw new Error("Original team not found in competition for update");
    
                    const updatedCompTeams = (competition.teams || []).map(t => 
                        String(t.id).trim() === targetId ? { ...t, ...data } : t
                    );
    
                    if (oldTeam.name !== data.name) {
                        const oldName = oldTeam.name.trim();
                        const newName = data.name.trim();
                        const renameInMatches = (matches: any[]) => (matches || []).map(f => {
                            if (f.teamA.trim() === oldName) return { ...f, teamA: newName };
                            if (f.teamB.trim() === oldName) return { ...f, teamB: newName };
                            return f;
                        });
                        const updatedFixtures = renameInMatches(competition.fixtures);
                        const updatedResults = renameInMatches(competition.results);
                        transaction.update(compDocRef, removeUndefinedProps({ teams: updatedCompTeams, fixtures: updatedFixtures, results: updatedResults }));
                    } else {
                        transaction.update(compDocRef, removeUndefinedProps({ teams: updatedCompTeams }));
                    }
                });
            } else { // --- ADDING ---
                const allComps = await fetchAllCompetitions();
                const allTeams = Object.values(allComps).flatMap(comp => comp.teams || []);
                const maxId = allTeams.reduce((max, team) => Math.max(max, team.id), 0);
                const newTeamId = maxId > 0 ? maxId + 1 : 1;
    
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const newTeam: Team = {
                        id: newTeamId,
                        name: data.name,
                        crestUrl: data.crestUrl,
                        players: [], fixtures: [], results: [], staff: [],
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
                    };
                    
                    const updatedCompTeams = [...(competition.teams || []), newTeam];
                    transaction.update(compDocRef, removeUndefinedProps({ teams: updatedCompTeams }));
                });
            }
            await loadData();
        } catch (error) {
            console.error("Error saving team:", error);
            alert("Failed to save team. " + (error as Error).message);
            setLoading(false);
        }
    };


    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold font-display">Manage Teams</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Team
                        </Button>
                    </div>
                    
                    <div className="mb-4">
                        <label htmlFor="comp-select-teams" className="block text-sm font-medium text-gray-700 mb-1">Select Competition</label>
                        <select
                            id="comp-select-teams"
                            value={selectedCompId}
                            onChange={(e) => handleCompChange(e.target.value)}
                            className="block w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {teams.map(team => (
                                <div key={team.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <img src={team.crestUrl} alt={team.name} className="w-10 h-10 object-contain rounded-full bg-gray-100 p-1" />
                                        <p className="font-semibold">{team.name}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Button onClick={() => handleEdit(team)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4" /></Button>
                                        <Button 
                                            onClick={() => handleDelete(team.id)} 
                                            className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"
                                            disabled={deletingId === team.id}
                                            aria-label={`Delete ${team.name}`}
                                        >
                                            {deletingId === team.id ? <Spinner className="w-4 h-4 border-2" /> : <TrashIcon className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <TeamFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} team={editingTeam} />}
        </>
    );
};
export default ManageTeams;
