
import React, { useState, useEffect } from 'react';
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError } from '../../services/api';
import { Competition, CompetitionFixture } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import EditMatchModal from './EditMatchModal';

const ManageMatches: React.FC = () => {
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
                    // If nothing was removed by ID, try removing by matching content (Teams + Date)
                    // This handles cases where IDs might be different types (number vs string) or mismatched.
                    if (filtered.length === initialLen) {
                        console.warn(`ID delete failed for ${matchLabel}. Attempting content fallback deletion.`);
                        filtered = list.filter(item => {
                             const itemA = item.teamA.trim();
                             const itemB = item.teamB.trim();
                             const matchA = match.teamA.trim();
                             const matchB = match.teamB.trim();
                             const dateMatch = item.fullDate === match.fullDate;
                             
                             // Check for exact match OR swapped teams (just in case of data entry error, though less likely for delete)
                             const teamsMatch = (itemA === matchA && itemB === matchB);
                             
                             // We want to keep items that DO NOT match.
                             return !(teamsMatch && dateMatch);
                        });
                    }
                    return filtered;
                };

                const updatedFixtures = filterList(currentFixtures);
                const updatedResults = filterList(currentResults);
                
                const itemsRemovedCount = (currentFixtures.length - updatedFixtures.length) + (currentResults.length - updatedResults.length);

                if (itemsRemovedCount === 0) {
                     throw new Error(`Could not find match "${matchLabel}" to delete. It may have already been removed.`);
                }

                const updatedTeams = calculateStandings(currentTeams, updatedResults, updatedFixtures);

                transaction.update(docRef, removeUndefinedProps({
                    fixtures: updatedFixtures,
                    results: updatedResults,
                    teams: updatedTeams
                }));
            });
            
            loadMatchData();
        } catch (error) {
            console.error("Delete failed:", error);
            alert(`Failed to delete: ${(error as Error).message}`);
            handleFirestoreError(error, 'delete match');
            await loadMatchData(); // Refresh to ensure UI is in sync
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
            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");

                const comp = docSnap.data() as Competition;
                
                // 1. Identify and remove the old match entry from both lists to prevent duplicates
                const allOtherMatches = [...(comp.fixtures || []), ...(comp.results || [])]
                    .filter(f => String(f.id).trim() !== String(updatedMatch.id).trim());

                // 2. Determine where the updated match belongs based on its status
                // 'finished' matches go to results, everything else to fixtures
                const isFinished = updatedMatch.status === 'finished';
                
                const newFixtures = allOtherMatches.filter(f => f.status !== 'finished');
                const newResults = allOtherMatches.filter(f => f.status === 'finished');

                if (isFinished) {
                    newResults.push(updatedMatch);
                } else {
                    newFixtures.push(updatedMatch);
                }

                // 3. Recalculate standings with the new state
                const updatedTeams = calculateStandings(comp.teams || [], newResults, newFixtures);

                // 4. Commit updates
                transaction.update(docRef, removeUndefinedProps({
                    fixtures: newFixtures,
                    results: newResults,
                    teams: updatedTeams
                }));
            });

            alert('Match updated successfully!');
            loadMatchData();

        } catch (error) {
            console.error("Update failed:", error);
            alert(`Failed to update match: ${(error as Error).message}`);
            handleFirestoreError(error, 'update match');
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
                        <span className="text-xs text-gray-400">ID: {match.id}</span>
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
                            <p className="text-sm text-gray-600">View, edit, and delete individual matches to reconcile data issues.</p>
                        </div>
                        <select 
                            value={selectedComp} 
                            onChange={(e) => setSelectedComp(e.target.value)} 
                            className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-lg mb-3 text-gray-700 border-b pb-2 flex justify-between items-center">
                                    Match Results 
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{data?.results?.length || 0}</span>
                                </h4>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                    {data?.results?.slice().sort((a, b) => new Date(b.fullDate || '').getTime() - new Date(a.fullDate || '').getTime()).map((m, index) => (
                                        <MatchRow key={`${m.id}-${index}`} match={m} />
                                    ))}
                                    {(!data?.results || data.results.length === 0) && <p className="text-sm text-gray-500 italic">No results found.</p>}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-lg mb-3 text-gray-700 border-b pb-2 flex justify-between items-center">
                                    Scheduled Fixtures
                                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{data?.fixtures?.length || 0}</span>
                                </h4>
                                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                    {data?.fixtures?.slice().sort((a, b) => new Date(a.fullDate || '').getTime() - new Date(b.fullDate || '').getTime()).map((m, index) => (
                                        <MatchRow key={`${m.id}-${index}`} match={m} />
                                    ))}
                                    {(!data?.fixtures || data.fixtures.length === 0) && <p className="text-sm text-gray-500 italic">No fixtures found.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isEditModalOpen && editingMatch && data && (
                <EditMatchModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveMatch}
                    match={editingMatch}
                    teams={data.teams || []}
                />
            )}
        </>
    );
};

export default ManageMatches;
