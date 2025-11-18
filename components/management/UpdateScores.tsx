import React, { useState, useEffect } from 'react';
// FIX: Import 'fetchCompetition' which is now correctly exported from the API service.
import { fetchCompetition, handleFirestoreError } from '../../services/api';
import { CompetitionFixture, Competition, Team } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import SaveIcon from '../icons/SaveIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';


const UpdateScores: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [matches, setMatches] = useState<CompetitionFixture[]>([]);
    const [scores, setScores] = useState<Record<number, { scoreA: string; scoreB: string }>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Hardcoded for now, could be passed as a prop
    const COMPETITION_ID = 'mtn-premier-league';

    useEffect(() => {
        const loadMatches = async () => {
            setLoading(true);
            const data = await fetchCompetition(COMPETITION_ID);
            if (data?.fixtures) {
                const clubMatches = data.fixtures.filter(
                    f => (f.teamA === clubName || f.teamB === clubName) && f.status !== 'finished'
                );
                setMatches(clubMatches);
            }
            setLoading(false);
        };
        loadMatches();
    }, [clubName]);

    const handleScoreChange = (fixtureId: number, team: 'A' | 'B', value: string) => {
        setScores(prev => ({
            ...prev,
            [fixtureId]: {
                ...prev[fixtureId],
                [team === 'A' ? 'scoreA' : 'scoreB']: value
            }
        }));
    };
    
    const handleSaveScore = async (fixtureId: number) => {
        const fixture = matches.find(f => f.id === fixtureId);
        const score = scores[fixtureId];
        if (fixture && score && score.scoreA && score.scoreB) {
            setSubmitting(fixtureId);
            try {
                const docRef = doc(db, 'competitions', COMPETITION_ID);
                
                await runTransaction(db, async (transaction) => {
                    const docSnap = await transaction.get(docRef);
                    if (!docSnap.exists()) throw new Error("Competition not found");
                    
                    const competition = docSnap.data() as Competition;
                    const fixtureToMove = competition.fixtures.find(f => f.id === fixtureId);

                    if (!fixtureToMove) throw new Error("Fixture not found or already finished.");

                    const updatedFixtures = competition.fixtures.filter(f => f.id !== fixtureId);
                    
                    const newResult = {
                        ...fixtureToMove,
                        status: 'finished' as const,
                        scoreA: parseInt(score.scoreA),
                        scoreB: parseInt(score.scoreB)
                    };
                    
                    const updatedResults = [...(competition.results || []), newResult];
                    const updatedTeams = calculateStandings(competition.teams || [], updatedResults, updatedFixtures);

                    // CRITICAL: Sanitize the entire payload before updating.
                    transaction.update(docRef, removeUndefinedProps({ 
                        fixtures: updatedFixtures, 
                        results: updatedResults, 
                        teams: updatedTeams 
                    }));
                });
                
                setSuccessMessage(`Result for ${fixture.teamA} vs ${fixture.teamB} updated successfully!`);
                setMatches(prev => prev.filter(m => m.id !== fixtureId));
                setTimeout(() => setSuccessMessage(null), 3000);
            } catch(error) {
                handleFirestoreError(error, 'save score');
            } finally {
                setSubmitting(null);
            }
        } else {
            alert('Please enter both scores.');
        }
    };

    const inputClass = "block w-full text-center px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";


    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-4">Update Match Scores</h3>
                
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 text-green-800 border border-green-200 rounded-md flex items-center gap-2 animate-fade-in">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{successMessage}</span>
                    </div>
                )}
                
                {loading ? <Spinner /> : (
                    <div className="space-y-4">
                        {matches.length > 0 ? matches.map(match => (
                             <div key={match.id} className="bg-gray-50 p-4 rounded-lg border">
                                <p className="font-semibold text-gray-800 text-center mb-2">{match.teamA} vs {match.teamB}</p>
                                <p className="text-xs text-gray-500 text-center mb-3">{match.day} {match.date}, {match.time}</p>
                                <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3">
                                    <input type="number" value={scores[match.id]?.scoreA || ''} onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)} placeholder={match.teamA.split(' ')[0]} aria-label={`${match.teamA} score`} className={inputClass} min="0" />
                                     <span className="font-bold text-gray-500">-</span>
                                    <input type="number" value={scores[match.id]?.scoreB || ''} onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)} placeholder={match.teamB.split(' ')[0]} aria-label={`${match.teamB} score`} className={inputClass} min="0" />
                                    <Button onClick={() => handleSaveScore(match.id)} className="bg-primary text-white hover:bg-primary-dark focus:ring-primary-light h-10 w-10 p-0 flex items-center justify-center" disabled={submitting === match.id}>
                                        {submitting === match.id ? <Spinner className="w-5 h-5 border-2" /> : <SaveIcon className="w-5 h-5" />}
                                    </Button>
                                </div>
                             </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">No upcoming matches to score.</p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UpdateScores;