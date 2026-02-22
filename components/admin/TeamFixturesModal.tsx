
import React, { useState, useEffect } from 'react';
import { Team, CompetitionFixture, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps } from '../../services/utils';
import Spinner from '../ui/Spinner';
// FIX: Added handleFirestoreError to the imports from api service to fix reference errors
import { fetchCompetition, handleFirestoreError } from '../../services/api';

interface TeamFixturesModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team;
    competitionId: string;
}

const TeamFixturesModal: React.FC<TeamFixturesModalProps> = ({ isOpen, onClose, team, competitionId }) => {
    const [fixtures, setFixtures] = useState<CompetitionFixture[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [newFixture, setNewFixture] = useState({
        opponentId: '',
        date: '',
        time: '',
        venue: '',
        matchday: ''
    });

    const loadData = async () => {
        setLoading(true);
        const compData = await fetchCompetition(competitionId);
        if (compData) {
            const teamFixtures = (compData.fixtures || []).filter(f => 
                f.teamA === team.name || f.teamB === team.name
            );
            setFixtures(teamFixtures.sort((a,b) => new Date(a.fullDate!).getTime() - new Date(b.fullDate!).getTime()));
            setAllTeams(compData.teams || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        if(isOpen) loadData();
    }, [isOpen, competitionId, team]);

    const handleAddFixture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFixture.opponentId || !newFixture.date) return;

        const opponent = allTeams.find(t => t.id.toString() === newFixture.opponentId);
        if (!opponent) return;

        setIsSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', competitionId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const comp = docSnap.data() as Competition;
                
                const dateObj = new Date(newFixture.date);
                
                const fixture: CompetitionFixture = {
                    id: Date.now(),
                    teamA: team.name,
                    teamB: opponent.name,
                    fullDate: newFixture.date,
                    date: dateObj.getDate().toString(),
                    day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                    time: newFixture.time || '15:00',
                    venue: newFixture.venue,
                    matchday: newFixture.matchday ? parseInt(newFixture.matchday) : undefined,
                    status: 'scheduled'
                };

                const updatedFixtures = [...(comp.fixtures || []), fixture];
                transaction.update(docRef, { fixtures: removeUndefinedProps(updatedFixtures) });
            });
            
            setNewFixture({ opponentId: '', date: '', time: '', venue: '', matchday: '' });
            loadData();
        } catch (error) {
            handleFirestoreError(error, 'add fixture');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteFixture = async (id: number | string) => {
        if (!window.confirm("Delete this fixture?")) return;
        setIsSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', competitionId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) return; // Should not happen
                const comp = docSnap.data() as Competition;
                const updatedFixtures = (comp.fixtures || []).filter(f => f.id !== id);
                transaction.update(docRef, { fixtures: updatedFixtures });
            });
            loadData();
        } catch (error) {
            handleFirestoreError(error, 'delete fixture');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) return null;

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-3xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold font-display">Manage Schedule: {team.name}</h2>
                        <p className="text-sm text-gray-600">Add or remove upcoming fixtures for this team.</p>
                    </div>

                    {/* Add Fixture Form */}
                    <form onSubmit={handleAddFixture} className="p-4 rounded-lg border mb-6 bg-blue-50 border-blue-100">
                        <h4 className="font-bold text-sm text-blue-800 mb-3">Add New Fixture</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Opponent *</label>
                                <select 
                                    value={newFixture.opponentId} 
                                    onChange={e => setNewFixture({...newFixture, opponentId: e.target.value})} 
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>Select Team</option>
                                    {allTeams.filter(t => t.id !== team.id).map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                                <input type="date" value={newFixture.date} onChange={e => setNewFixture({...newFixture, date: e.target.value})} className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                                <input type="time" value={newFixture.time} onChange={e => setNewFixture({...newFixture, time: e.target.value})} className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Venue</label>
                                <input type="text" value={newFixture.venue} onChange={e => setNewFixture({...newFixture, venue: e.target.value})} placeholder="Stadium" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Matchday</label>
                                <input type="number" value={newFixture.matchday} onChange={e => setNewFixture({...newFixture, matchday: e.target.value})} placeholder="e.g. 12" className={inputClass} />
                            </div>
                        </div>
                        <div className="text-right">
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 flex items-center justify-center w-full sm:w-auto ml-auto gap-2 text-xs">
                                {isSubmitting ? <Spinner className="w-4 h-4 border-2"/> : <><PlusCircleIcon className="w-4 h-4" /> Add Fixture</>}
                            </Button>
                        </div>
                    </form>

                    {/* Fixtures List */}
                    <div className="space-y-2">
                        <h4 className="font-bold text-sm mb-2">Upcoming Fixtures ({fixtures.length})</h4>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                            {loading ? <Spinner /> : fixtures.length > 0 ? fixtures.map(fixture => (
                                <div key={fixture.id} className="flex items-center justify-between p-3 border rounded bg-white hover:bg-gray-50">
                                    <div>
                                        <div className="font-semibold text-sm text-gray-800">
                                            vs {fixture.teamA === team.name ? fixture.teamB : fixture.teamA}
                                            <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {fixture.teamA === team.name ? 'Home' : 'Away'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {fixture.fullDate} at {fixture.time} • {fixture.venue || 'TBD'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteFixture(fixture.id)} 
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        title="Delete Fixture"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )) : <p className="text-sm text-gray-500 text-center py-4">No scheduled fixtures found.</p>}
                        </div>
                    </div>

                    <div className="mt-6 text-right border-t pt-4">
                        <Button onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Close</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamFixturesModal;
