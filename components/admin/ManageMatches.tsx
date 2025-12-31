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
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<CompetitionFixture | null>(null);
    const [savingId, setSavingId] = useState<number | string | null>(null);

    useEffect(() => {
        const loadCompetitions = async () => {
            const allComps = await fetchAllCompetitions();
            const list = Object.entries(allComps)
                .filter(([_, c]) => c && c.name)
                .map(([id, c]) => ({ id, name: c.name }));
            setCompetitions(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            
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
        setData(compData || null);
        setLoading(false);
    };

    useEffect(() => {
        loadMatchData();
    }, [selectedComp]);

    const handleDelete = async (match: CompetitionFixture) => {
        if (!window.confirm(`Delete ${match.teamA} vs ${match.teamB}?`)) return;
        setDeletingId(match.id);
        
        try {
            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const comp = docSnap.data() as Competition;
                const filterList = (list: CompetitionFixture[]) => list.filter(item => String(item.id).trim() !== String(match.id).trim());

                const updatedFixtures = filterList(comp.fixtures || []);
                const updatedResults = filterList(comp.results || []);
                const updatedTeams = calculateStandings(comp.teams || [], updatedResults, updatedFixtures);

                transaction.update(docRef, removeUndefinedProps({
                    fixtures: updatedFixtures,
                    results: updatedResults,
                    teams: updatedTeams
                }));
            });
            loadMatchData();
        } catch (error: any) {
            handleFirestoreError(error, 'delete match');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSaveMatch = async (updatedMatch: CompetitionFixture) => {
        setSavingId(updatedMatch.id);
        setIsEditModalOpen(false);
        try {
            const docRef = doc(db, 'competitions', selectedComp);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                const comp = docSnap.data() as Competition;
                const targetId = String(updatedMatch.id).trim();
                const allOtherMatches = [...(comp.fixtures || []), ...(comp.results || [])].filter(f => String(f.id).trim() !== targetId);

                const newFixtures = allOtherMatches.filter(f => f.status !== 'finished');
                const newResults = allOtherMatches.filter(f => f.status === 'finished');
                if (updatedMatch.status === 'finished') newResults.push(updatedMatch);
                else newFixtures.push(updatedMatch);

                const finalTeams = calculateStandings(comp.teams || [], newResults, newFixtures);
                transaction.update(docRef, removeUndefinedProps({ fixtures: newFixtures, results: newResults, teams: finalTeams }));
            });
            loadMatchData();
        } catch (e) {
            console.error(e);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h3 className="text-2xl font-bold font-display">Manage Matches</h3>
                        <select 
                            value={selectedComp}
                            onChange={(e) => setSelectedComp(e.target.value)}
                            className="block w-full max-w-sm border-gray-300 rounded-md shadow-sm"
                        >
                            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {loading ? <Spinner /> : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold border-b pb-2 mb-3">Fixtures</h4>
                                <div className="space-y-2">
                                    {(data?.fixtures || []).sort((a,b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime()).map(match => (
                                        <div key={match.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                            <span className="text-sm font-semibold">{match.teamA} vs {match.teamB}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingMatch(match); setIsEditModalOpen(true); }} className="p-1.5 bg-blue-100 text-blue-600 rounded"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(match)} className="p-1.5 bg-red-100 text-red-600 rounded"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold border-b pb-2 mb-3">Results</h4>
                                <div className="space-y-2">
                                    {(data?.results || []).sort((a,b) => new Date(b.fullDate || 0).getTime() - new Date(a.fullDate || 0).getTime()).map(match => (
                                        <div key={match.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                                            <span className="text-sm font-semibold">{match.teamA} {match.scoreA}-{match.scoreB} {match.teamB}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingMatch(match); setIsEditModalOpen(true); }} className="p-1.5 bg-blue-100 text-blue-600 rounded"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(match)} className="p-1.5 bg-red-100 text-red-600 rounded"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {isEditModalOpen && editingMatch && (
                <EditMatchModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} match={editingMatch} teams={data?.teams || []} onSave={handleSaveMatch} />
            )}
        </>
    );
};

export default ManageMatches;