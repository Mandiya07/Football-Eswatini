
import React, { useState, useEffect } from 'react';
// FIX: Import 'fetchAllCompetitions' which is now correctly exported from the API service.
import { fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import RefreshIcon from '../icons/RefreshIcon';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { calculateStandings } from '../../services/utils';

const RecalculateLogs: React.FC = () => {
    const [leagues, setLeagues] = useState<{ id: string, name: string }[]>([]);
    const [selectedLeague, setSelectedLeague] = useState('mtn-premier-league');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadLeagues = async () => {
            const allData = await fetchAllCompetitions();
            const leagueList = Object.entries(allData)
                .filter(([_, comp]) => comp.teams) // Corrected Filter: Show any competition with a `teams` property.
                .map(([id, comp]) => ({ id, name: comp.name }));
            setLeagues(leagueList);
            setLoading(false);
        };
        loadLeagues();
    }, []);

    const handleRecalculate = async () => {
        if (!selectedLeague) return;

        setSubmitting(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error("Competition document not found.");
            }

            const competitionData = docSnap.data() as Competition;
            
            // Clean up the fixtures and results arrays for data hygiene
            // Move any 'finished' match to results, and any non-finished to fixtures.
            const allMatches = [...(competitionData.fixtures || []), ...(competitionData.results || [])];
            
            const cleanedResults = allMatches.filter(m => 
                m.status === 'finished' && m.scoreA != null && m.scoreB != null
            );
            
            const cleanedFixtures = allMatches.filter(m => 
                m.status !== 'finished' || m.scoreA == null || m.scoreB == null
            );
            
            // The core logic: use the robust calculateStandings function
            const recalculatedTeams = calculateStandings(competitionData.teams || [], cleanedResults, cleanedFixtures);
            
            await updateDoc(docRef, { 
                teams: recalculatedTeams,
                fixtures: cleanedFixtures,
                results: cleanedResults,
            });

            setStatusMessage({ type: 'success', text: `Successfully repaired data and recalculated logs for "${competitionData.name}". Missing finished matches have been moved to the results list.` });
        
        } catch (error) {
            handleFirestoreError(error, 'recalculate standings');
            setStatusMessage({ type: 'error', text: `Failed to recalculate standings. See alert for details.` });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-1">Repair Data & Recalculate Logs</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Use this tool if a finished match is missing from the Results page or if the league table standings seem incorrect. This will sort all matches into their correct lists (Fixtures/Results) and force a full recalculation of points.
                </p>

                {loading ? <Spinner /> : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-1">Select League</label>
                            <select 
                                id="league-select" 
                                value={selectedLeague} 
                                onChange={e => setSelectedLeague(e.target.value)} 
                                className="mb-4 block w-full max-w-sm pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <Button onClick={handleRecalculate} disabled={submitting} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 h-11 w-auto flex justify-center items-center gap-2 px-6">
                            {submitting ? <Spinner className="w-5 h-5 border-2"/> : <><RefreshIcon className="w-5 h-5" /> Force Repair & Recalculate</>}
                        </Button>
                    </div>
                )}
                
                {statusMessage.text && (
                    <div className={`mt-6 p-3 rounded-md text-sm font-semibold ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMessage.text}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecalculateLogs;
