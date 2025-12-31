
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Team, Competition } from '../../data/teams';
import { fetchAllCompetitions, updateDirectoryEntry, fetchDirectoryEntries, addDirectoryEntry } from '../../services/api';
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

const ManageTeams: React.FC = () => {
    const [allCompsData, setAllCompsData] = useState<Record<string, Competition>>({});
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompId, setSelectedCompId] = useState('mtn-premier-league');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isFixturesModalOpen, setIsFixturesModalOpen] = useState(false);
    
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
    const [scheduleTeam, setScheduleTeam] = useState<Team | null>(null);

    const loadData = useCallback(async (refreshOnly: boolean = false) => {
        if (!refreshOnly) setLoading(true);
        try {
            const allComps = await fetchAllCompetitions();
            setAllCompsData(allComps);
            
            // Defensive mapping and sorting for competitions
            const compList = Object.entries(allComps)
                .filter(([_, comp]) => comp && comp.name)
                .map(([id, comp]) => ({ id, name: comp.name! }));

            const sortedList = compList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setCompetitions(sortedList);

            // Determine active competition
            let activeId = selectedCompId;
            if (!allComps[activeId] && sortedList.length > 0) {
                activeId = sortedList[0].id;
                setSelectedCompId(activeId);
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
            console.error("Failed to load teams data:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedCompId]);
    
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

    const handleAddToDirectory = async (team: Team) => {
        if (!window.confirm(`Add "${team.name}" to the public Football Directory?`)) return;

        setProcessingId(team.id);
        try {
            await syncToDirectory(team.id, team.name, team.crestUrl, selectedCompId);
            alert(`"${team.name}" successfully synced to Directory.`);
        } catch (error) {
            console.error("Directory sync failed", error);
        } finally {
            setProcessingId(null);
        }
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

    const syncToDirectory = async (teamId: number, teamName: string, crestUrl: string, compId: string) => {
        const directoryEntries = await fetchDirectoryEntries();
        const existingEntry = directoryEntries.find(e => 
            (e.teamId === teamId && e.competitionId === compId) ||
            e.name.trim().toLowerCase() === teamName.toLowerCase()
        );

        if (existingEntry) {
            await updateDirectoryEntry(existingEntry.id, {
                teamId: teamId,
                competitionId: compId,
                crestUrl: crestUrl || existingEntry.crestUrl,
                name: teamName
            });
        } else {
            const compName = allCompsData[compId]?.name.toLowerCase() || '';
            let region: Region = 'Hhohho';
            if (compName.includes('manzini')) region = 'Manzini';
            else if (compName.includes('lubombo')) region = 'Lubombo';
            else if (compName.includes('shiselweni')) region = 'Shiselweni';

            let tier: DirectoryEntity['tier'] = 'Regional';
            if (compName.includes('premier')) tier = 'Premier League';
            else if (compName.includes('first division') || compName.includes('nfd')) tier = 'NFD';
            else if (compName.includes('women')) tier = 'Womens League';

            const newEntry: Omit<DirectoryEntity, 'id'> = {
                name: teamName,
                category: 'Club',
                region: region,
                crestUrl: crestUrl,
                teamId: teamId,
                competitionId: compId,
                tier: tier,
                location: { lat: -26.5, lng: 31.5 },
                contact: { email: '', phone: '' },
                founded: 0,
                stadium: ''
            };
            await addDirectoryEntry(newEntry);
        }
    };

    const handleSaveTeam = async (data: any, id?: number, addToDir: boolean = false) => {
        setLoading(true);
        setIsFormModalOpen(false);
        try {
            const compDocRef = doc(db, 'competitions', selectedCompId);
            if (id) {
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    const updatedCompTeams = (competition.teams || []).map(t => t.id === id ? { ...t, ...data } : t);
                    transaction.update(compDocRef, removeUndefinedProps({ teams: updatedCompTeams }));
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
                        name: data.name,
                        crestUrl: data.crestUrl || '',
                        players: [], fixtures: [], results: [], staff: [],
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
                    };
                    const updatedCompTeams = [...(competition.teams || []), newTeam];
                    transaction.update(compDocRef, { teams: updatedCompTeams });
                });
            }
            if (addToDir) await syncToDirectory(id || Date.now(), data.name, data.crestUrl, selectedCompId);
            await loadData(true);
        } catch (error) {
            console.error("Save team failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold font-display">Manage Teams</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Team
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
                                        <button onClick={() => handleManageSchedule(team)} className="p-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors" title="Schedule"><CalendarIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleManageRoster(team)} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors" title="Roster"><UsersIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleEdit(team)} className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors" title="Edit"><PencilIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(team.id)} disabled={processingId === team.id} className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                                            {processingId === team.id ? <Spinner className="w-5 h-5 border-2 border-red-700" /> : <TrashIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && <p className="text-center text-gray-500 py-12 italic border-2 border-dashed rounded-xl">No teams found in this competition.</p>}
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
