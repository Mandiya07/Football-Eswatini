import React, { useState, useEffect } from 'react';
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
import BookIcon from '../icons/BookIcon';
import TeamFormModal from './TeamFormModal';
import TeamRosterModal from './TeamRosterModal';
import TeamFixturesModal from './TeamFixturesModal';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import { Region, DirectoryEntity } from '../../data/directory';

const ManageTeams: React.FC = () => {
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedCompId, setSelectedCompId] = useState('mtn-premier-league');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    
    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
    const [isFixturesModalOpen, setIsFixturesModalOpen] = useState(false);
    
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
    const [scheduleTeam, setScheduleTeam] = useState<Team | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const allComps = await fetchAllCompetitions();
            const compList = Object.entries(allComps).map(([id, comp]) => ({ id, name: comp.name }));
            setCompetitions(compList.sort((a, b) => a.name.localeCompare(b.name)));

            if (selectedCompId && allComps[selectedCompId]) {
                setTeams((allComps[selectedCompId].teams || []).sort((a,b) => a.name.localeCompare(b.name)));
            } else if (compList.length > 0) {
                const firstCompId = compList[0].id;
                setSelectedCompId(firstCompId);
                setTeams((allComps[firstCompId]?.teams || []).sort((a,b) => a.name.localeCompare(b.name)));
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
        if (!window.confirm(`Add "${team.name}" to the public Football Directory?\n\nThis will allow users to find the team in the Directory section.`)) return;

        setProcessingId(team.id);
        try {
            await syncToDirectory(team.id, team.name, team.crestUrl, selectedCompId);
            alert(`"${team.name}" has been successfully added/linked to the Directory.`);
        } catch (error) {
            console.error("Directory sync failed", error);
            alert("Failed to add to directory.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (teamId: number) => {
        if (!window.confirm("Are you sure you want to delete this team? This will also remove them from any associated fixtures and results, and standings will be recalculated.")) {
            return;
        }

        setProcessingId(teamId);
        const compDocRef = doc(db, 'competitions', selectedCompId);
        try {
            await runTransaction(db, async (transaction) => {
                const compDocSnap = await transaction.get(compDocRef);
                if (!compDocSnap.exists()) throw new Error("Competition not found");
                const competition = compDocSnap.data() as Competition;

                const targetIdStr = String(teamId).trim();
                
                const teamIndex = (competition.teams || []).findIndex(t => String(t.id).trim() === targetIdStr);
                
                if (teamIndex === -1) throw new Error("Team not found in competition");
                
                const teamToDelete = competition.teams![teamIndex];
                const targetName = teamToDelete.name.trim();
                
                // 1. Remove team from list
                const updatedCompTeams = [...(competition.teams || [])];
                updatedCompTeams.splice(teamIndex, 1);

                // 2. Filter out fixtures and results involving the deleted team
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
            
            // Cleanup directory link if exists
            const directoryEntries = await fetchDirectoryEntries();
            const linkedEntry = directoryEntries.find(e => e.teamId === teamId && e.competitionId === selectedCompId);
            if (linkedEntry) {
                await updateDirectoryEntry(linkedEntry.id, { teamId: null, competitionId: null });
            }

            await loadData();

        } catch (error) {
            console.error("Error deleting team:", error);
            alert("Failed to delete team. " + (error as Error).message);
        } finally {
            setProcessingId(null);
        }
    };

    // Helper logic extracted for reuse
    const syncToDirectory = async (teamId: number, teamName: string, crestUrl: string, compId: string) => {
        const directoryEntries = await fetchDirectoryEntries();
                    
        // Check if a directory entry with this teamID OR Name already exists
        const existingEntry = directoryEntries.find(e => 
            (e.teamId === teamId && e.competitionId === compId) ||
            e.name.trim().toLowerCase() === teamName.toLowerCase()
        );

        if (existingEntry) {
            // Update existing entry
            await updateDirectoryEntry(existingEntry.id, {
                teamId: teamId,
                competitionId: compId,
                crestUrl: crestUrl || existingEntry.crestUrl, // Keep existing crest if new one is blank
                name: teamName // Ensure name is synced
            });
        } else {
            // Create new entry
            // Determine Region and Tier from Competition
            const allComps = await fetchAllCompetitions(); 
            const compName = allComps[compId]?.name.toLowerCase() || '';
            
            let region: Region = 'Hhohho';
            if (compName.includes('manzini')) region = 'Manzini';
            else if (compName.includes('lubombo')) region = 'Lubombo';
            else if (compName.includes('shiselweni')) region = 'Shiselweni';

            let tier: DirectoryEntity['tier'] = 'Regional';
            if (compName.includes('premier')) tier = 'Premier League';
            else if (compName.includes('first division') || compName.includes('nfd')) tier = 'NFD';
            else if (compName.includes('women') || compName.includes('ladies')) tier = 'Womens League';
            else if (compName.includes('school')) tier = 'Schools';
            else if (compName.includes('super league')) tier = 'Regional'; // Ensure Super Leagues map to Regional

            const newEntry: Omit<DirectoryEntity, 'id'> = {
                name: teamName,
                category: 'Club',
                region: region,
                crestUrl: crestUrl,
                teamId: teamId,
                competitionId: compId,
                tier: tier,
                location: { lat: -26.5, lng: 31.5, address: `Eswatini` }, // Default coordinates
                contact: { email: '', phone: '' },
                founded: 0,
                stadium: ''
            };
            
            await addDirectoryEntry(newEntry);
        }
    };

    const handleSaveTeam = async (data: Partial<Omit<Team, 'id' | 'stats' | 'players' | 'fixtures' | 'results' | 'staff'>>, id?: number, addToDirectory: boolean = false) => {
        setLoading(true);
        setIsFormModalOpen(false);
        
        try {
            const compDocRef = doc(db, 'competitions', selectedCompId);
            let finalTeamId = id;
            let teamName = (data.name || '').trim();
            let crestUrl = data.crestUrl || '';
    
            // --- 1. SAVE TEAM TO COMPETITION ---
            if (id) { // EDITING
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const targetIdStr = String(id).trim();
                    const oldTeamIndex = (competition.teams || []).findIndex(t => String(t.id).trim() === targetIdStr);
                    
                    if (oldTeamIndex === -1) throw new Error("Original team not found in competition for update");
    
                    const oldTeam = competition.teams![oldTeamIndex];
                    const updatedCompTeams = [...(competition.teams || [])];
                    
                    updatedCompTeams[oldTeamIndex] = { ...oldTeam, ...data };
    
                    if (data.name && oldTeam.name.trim() !== data.name.trim()) {
                        const oldNameLower = oldTeam.name.trim().toLowerCase();
                        const newName = data.name.trim();
                        
                        const renameInMatches = (matches: any[]) => (matches || []).map(f => {
                            let updatedFixture = { ...f };
                            let changed = false;

                            if (f.teamA.trim().toLowerCase() === oldNameLower) {
                                updatedFixture.teamA = newName;
                                changed = true;
                            }
                            if (f.teamB.trim().toLowerCase() === oldNameLower) {
                                updatedFixture.teamB = newName;
                                changed = true;
                            }
                            return changed ? updatedFixture : f;
                        });

                        const updatedFixtures = renameInMatches(competition.fixtures);
                        const updatedResults = renameInMatches(competition.results);
                        
                        const finalTeams = calculateStandings(updatedCompTeams, updatedResults, updatedFixtures);

                        transaction.update(compDocRef, removeUndefinedProps({ 
                            teams: finalTeams, 
                            fixtures: updatedFixtures, 
                            results: updatedResults 
                        }));
                    } else {
                        transaction.update(compDocRef, removeUndefinedProps({ teams: updatedCompTeams }));
                    }
                });
            } else { // ADDING
                const allComps = await fetchAllCompetitions();
                const allTeams = Object.values(allComps).flatMap(comp => comp.teams || []);
                const maxId = allTeams.reduce((max, team) => Math.max(max, team.id), 0);
                const newTeamId = maxId > 0 ? maxId + 1 : 1;
                finalTeamId = newTeamId;
    
                await runTransaction(db, async (transaction) => {
                    const compDocSnap = await transaction.get(compDocRef);
                    if (!compDocSnap.exists()) throw new Error("Competition not found");
                    const competition = compDocSnap.data() as Competition;
                    
                    const newTeam: Team = {
                        id: newTeamId,
                        name: (data.name || '').trim(),
                        crestUrl: data.crestUrl || '',
                        players: [], fixtures: [], results: [], staff: [],
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
                    };
                    
                    const updatedCompTeams = [...(competition.teams || []), newTeam];
                    transaction.update(compDocRef, removeUndefinedProps({ teams: updatedCompTeams }));
                });
            }
            
            // --- 2. SYNC TO DIRECTORY (If Checked) ---
            if (addToDirectory && finalTeamId) {
                await syncToDirectory(finalTeamId, teamName, crestUrl, selectedCompId);
            }

            await loadData();
        } catch (error) {
            console.error("Error saving team:", error);
            alert("Failed to save team. " + (error as Error).message);
            setLoading(false);
        }
    };

    const handleSaveRoster = async () => {
        setIsRosterModalOpen(false);
        setRosterTeam(null);
        await loadData(); 
    }


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
                                <div key={team.id} className="p-3 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full border">
                                            {team.crestUrl ? <img src={team.crestUrl} alt={team.name} className="w-8 h-8 object-contain" /> : <span className="text-xs font-bold text-gray-400">{team.name.charAt(0)}</span>}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{team.name}</p>
                                            <p className="text-xs text-gray-500">ID: {team.id} &bull; Players: {team.players?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                        <Button onClick={() => handleManageSchedule(team)} className="bg-yellow-100 text-yellow-700 h-8 w-8 p-0 flex items-center justify-center" title="Manage Schedule/Fixtures">
                                            <CalendarIcon className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => handleManageRoster(team)} className="bg-green-100 text-green-700 h-8 w-8 p-0 flex items-center justify-center" title="Manage Roster/Players">
                                            <UsersIcon className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => handleAddToDirectory(team)} disabled={processingId === team.id} className="bg-purple-100 text-purple-700 h-8 w-8 p-0 flex items-center justify-center" title="Add to Directory">
                                            {processingId === team.id ? <Spinner className="w-3 h-3 border-purple-700"/> : <BookIcon className="w-4 h-4" />}
                                        </Button>
                                        <Button onClick={() => handleEdit(team)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center" title="Edit Team Details">
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            onClick={() => handleDelete(team.id)} 
                                            className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"
                                            disabled={processingId === team.id}
                                            aria-label={`Delete ${team.name}`}
                                            title="Delete Team"
                                        >
                                            {processingId === team.id ? <Spinner className="w-3 h-3 border-red-700" /> : <TrashIcon className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && <p className="text-center text-gray-500 py-4">No teams found in this competition.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
            
            {/* Team Details Modal */}
            {isFormModalOpen && (
                <TeamFormModal 
                    isOpen={isFormModalOpen} 
                    onClose={() => setIsFormModalOpen(false)} 
                    onSave={handleSaveTeam} 
                    team={editingTeam}
                    competitionId={selectedCompId} // Pass the current competition ID
                />
            )}
            
            {/* Player Roster Modal */}
            {isRosterModalOpen && rosterTeam && (
                <TeamRosterModal
                    isOpen={isRosterModalOpen}
                    onClose={() => setIsRosterModalOpen(false)}
                    onSave={handleSaveRoster}
                    team={rosterTeam}
                    competitionId={selectedCompId}
                />
            )}

            {/* Team Fixtures Modal */}
            {isFixturesModalOpen && scheduleTeam && (
                <TeamFixturesModal
                    isOpen={isFixturesModalOpen}
                    onClose={() => setIsFixturesModalOpen(false)}
                    team={scheduleTeam}
                    competitionId={selectedCompId}
                />
            )}
        </>
    );
};
export default ManageTeams;