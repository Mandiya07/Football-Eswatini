
import React, { useState, useEffect } from 'react';
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError } from '../../services/api';
import { Competition, CompetitionFixture, Team, Player } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import EditMatchModal from './EditMatchModal';
import { useAuth } from '../../contexts/AuthContext';

const ManageMatches: React.FC = () => {
    const { user } = useAuth();
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [selectedComp, setSelectedComp] = useState('mtn-premier-league'); 
    const [data, setData] = useState<Competition | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | string | null>(null);
    
    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<CompetitionFixture | null>(null);
    const [savingId, setSavingId] = useState<number | string | null>(null);

    useEffect(() => {
        const loadCompetitions = async () => {
            const allComps = await fetchAllCompetitions();
            const list = Object.entries(allComps).map(([id, c]) => ({ id, name: c.name }));
            setCompetitions(list.sort((a, b) => a.name.localeCompare(b.name)));
            
            // If default isn't found, fallback to first
            if (!list.find(c => c.id === selectedComp) && list.length > 0) {
                setSelectedComp(list[0].id);
            }
        };
        loadCompetitions();
    }, []);

    const loadMatchData = async () => {
        if (!selectedComp) return;
        setLoading(true);
        const compData = await fetchCompetition(selectedComp);
        setData(compData);
        setLoading(false);
    };

    useEffect(() => {
        loadMatchData();
    }, [selectedComp]);

    const handleDelete = async (match: CompetitionFixture) => {
        const matchLabel = `${match.teamA} vs ${match.teamB}`;
        if (!window.confirm(`Are you sure you want to delete:\n${matchLabel}?\n\nStandings will be recalculated immediately.`)) return;
        
        setDeletingId(match.id);
        
        try {
            // Check if user is super_admin. Even if they are, handle potential permission errors gracefully.
            if (user?.role !== 'super_admin') {
                throw { code: 'permission-denied' };
            }

            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const comp = docSnap.data() as Competition;
                const currentFixtures = comp.fixtures || [];
                const currentResults = comp.results || [];
                const currentTeams = comp.teams || [];

                const filterList = (list: CompetitionFixture[]) => {
                    const targetId = String(match.id).trim();
                    const initialLen = list.length;
                    
                    // Attempt 1: ID Match
                    let filtered = list.filter(item => String(item.id).trim() !== targetId);
                    
                    // Attempt 2: Content Match Fallback
                    if (filtered.length === initialLen) {
                        filtered = list.filter(item => {
                             const itemA = item.teamA.trim();
                             const itemB = item.teamB.trim();
                             const matchA = match.teamA.trim();
                             const matchB = match.teamB.trim();
                             const dateMatch = item.fullDate === match.fullDate;
                             return !(itemA === matchA && itemB === matchB && dateMatch);
                        });
                    }
                    return filtered;
                };

                const updatedFixtures = filterList(currentFixtures);
                const updatedResults = filterList(currentResults);
                const updatedTeams = calculateStandings(currentTeams, updatedResults, updatedFixtures);

                transaction.update(docRef, removeUndefinedProps({
                    fixtures: updatedFixtures,
                    results: updatedResults,
                    teams: updatedTeams
                }));
            });
            
            loadMatchData();
        } catch (error: any) {
            if (error.code === 'permission-denied' || user?.role !== 'super_admin') {
                alert("Permission denied. Only super admins can delete matches.");
            } else {
                console.error("Delete failed:", error);
                alert(`Failed to delete: ${(error as Error).message}`);
                handleFirestoreError(error, 'delete match');
            }
            await loadMatchData(); 
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditClick = (match: CompetitionFixture) => {
        setEditingMatch(match);
        setIsEditModalOpen(true);
    };

    const handleSaveMatch = async (updatedMatch: CompetitionFixture) => {
        setSavingId(updatedMatch.id);
        setIsEditModalOpen(false);
        
        try {
            if (user?.role !== 'super_admin') {
                throw { code: 'permission-denied' };
            }

            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");

                const comp = docSnap.data() as Competition;
                let currentTeams = comp.teams || [];
                let teamsUpdated = false;

                // --- CRITICAL: AUTO-ADD NEW PLAYERS FROM EVENTS TO ROSTER ---
                if (updatedMatch.events && updatedMatch.events.length > 0) {
                    updatedMatch.events.forEach(event => {
                        // We only care if there is a player name and a team name attached to the event
                        if (event.playerName && event.teamName) {
                            const teamNameLower = event.teamName.trim().toLowerCase();
                            const teamIndex = currentTeams.findIndex(t => t.name.trim().toLowerCase() === teamNameLower);
                            
                            if (teamIndex !== -1) {
                                const team = currentTeams[teamIndex];
                                const playerNameLower = event.playerName.trim().toLowerCase();
                                const playerExists = (team.players || []).some(p => p.name.trim().toLowerCase() === playerNameLower);
                                
                                if (!playerExists) {
                                    // Player not found in roster, create new entry
                                    const newPlayer: Player = {
                                        id: Date.now() + Math.floor(Math.random() * 10000), // Generate unique ID
                                        name: event.playerName.trim(),
                                        position: 'Forward', // Default position
                                        number: 0,
                                        photoUrl: '',
                                        bio: { age: 0, height: '-', nationality: 'Eswatini' },
                                        stats: { appearances: 0, goals: 0, assists: 0 },
                                        transferHistory: []
                                    };
                                    
                                    // Update team object in our local array copy
                                    const updatedPlayers = [...(team.players || []), newPlayer];
                                    currentTeams[teamIndex] = { ...team, players: updatedPlayers };
                                    teamsUpdated = true;
                                    console.log(`[Auto-Roster] Created player: ${newPlayer.name} for ${team.name}`);
                                }
                            }
                        }
                    });
                }
                
                // 1. Remove old version of the match from both lists to avoid duplicates
                const targetId = String(updatedMatch.id).trim();
                const allOtherMatches = [...(comp.fixtures || []), ...(comp.results || [])]
                    .filter(f => String(f.id).trim() !== targetId);

                // 2. Determine destination (Fixtures vs Results) based on status
                const isFinished = updatedMatch.status === 'finished';
                const newFixtures = allOtherMatches.filter(f => f.status !== 'finished');
                const newResults = allOtherMatches.filter(f => f.status === 'finished');

                if (isFinished) newResults.push(updatedMatch);
                else newFixtures.push(updatedMatch);

                // 3. Recalculate standings using the UPDATED teams array (which now contains any new players)
                // This ensures stats can be attributed correctly if we expand stats logic later
                const finalTeams = calculateStandings(currentTeams, newResults, newFixtures);

                // 4. Commit all updates transactionally
                transaction.update(docRef, removeUndefinedProps({
                    fixtures: newFixtures,
                    results: newResults,
                    teams: finalTeams
                }));
            });

            alert('Match updated successfully! Scores, events, and rosters have been synchronized.');
            loadMatchData();

        } catch (error: any) {
            if (error.code === 'permission-denied' || user?.role !== 'super_admin') {
                alert("Permission denied. Only super admins can update matches directly.");
            } else {
                console.error("Update failed:", error);
                alert(`Failed to update match: ${(error as Error).message}`);
            }
        } finally {
            setSavingId(null);
            setEditingMatch(null);
        }
    };

    const MatchRow: React.FC<{ match: CompetitionFixture }> = ({ match }) => {
        const isDeleting = deletingId !== null && String(deletingId).trim() === String(match.id).trim();
        const isSavingThis = savingId !== null && String(savingId).trim() === String(match.id).trim();

        return (
            <div className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm hover:bg-gray-50 transition-colors">
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="font-semibold text-gray-800">
                        {match.teamA} <span className="text-gray-400 px-1">vs</span> {match.teamB}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-3">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{match.fullDate}</span>
                        {match.scoreA !== undefined && match.scoreB !== undefined && (
                            <span className="font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded">{match.scoreA} - {match.scoreB}</span>
                        )}
                        <span className="text-xs">MD {match.matchday || '?'}</span>
                    </div>
                </div>
                <div className="flex-shrink-0 ml-4 flex gap-2">
                     <Button 
                        onClick={() => handleEditClick(match)} 
                        disabled={isDeleting || isSavingThis}
                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-2 h-9 w-9 flex items-center justify-center rounded-full"
                        title="Edit Match"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                        onClick={() => handleDelete(match)} 
                        disabled={isDeleting || isSavingThis}
                        className="bg-red-100 text-red-600 hover:bg-red-200 p-2 h-9 w-9 flex items-center justify-center rounded-full"
                        title="Delete Match"
                    >
                        {(isDeleting || isSavingThis) ? <Spinner className="w-4 h-4 border-2 border-red-600" /> : <TrashIcon className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-2xl font-bold font-display text-gray-800">Manage Matches</h3>
                            <p className="text-sm text-gray-600">Update scores, log events, and correct fixture details.</p>
                        </div>
                        <select 
                            value={selectedComp}
                            onChange={(e) => setSelectedComp(e.target.value)}
                            className="block w-full max-w-sm pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                        >
                            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {loading ? <div className="flex justify-center p-8"><Spinner/></div> : (
                        <div className="space-y-6">
                            {/* Fixtures */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">Upcoming Fixtures ({data?.fixtures?.length || 0})</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {(data?.fixtures || []).sort((a,b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime()).map(match => (
                                        <MatchRow key={match.id} match={match} />
                                    ))}
                                    {(!data?.fixtures || data.fixtures.length === 0) && <p className="text-sm text-gray-500 italic">No scheduled fixtures.</p>}
                                </div>
                            </div>
                            
                            {/* Results */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-700 mb-3 border-b pb-2">Completed Results ({data?.results?.length || 0})</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {(data?.results || []).sort((a,b) => new Date(b.fullDate!).getTime() - new Date(a.fullDate!).getTime()).map(match => (
                                        <MatchRow key={match.id} match={match} />
                                    ))}
                                    {(!data?.results || data.results.length === 0) && <p className="text-sm text-gray-500 italic">No results found.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isEditModalOpen && editingMatch && data?.teams && (
                <EditMatchModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    match={editingMatch}
                    teams={data.teams}
                    onSave={handleSaveMatch}
                />
            )}
        </>
    );
};

export default ManageMatches;
