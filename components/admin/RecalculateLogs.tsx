
import React, { useState, useEffect } from 'react';
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError } from '../../services/api';
import { Team, Competition, CompetitionFixture } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import RefreshIcon from '../icons/RefreshIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import { db } from '../../services/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps, superNormalize } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import DownloadIcon from '../icons/DownloadIcon';

const RecalculateLogs: React.FC = () => {
    const [leagues, setLeagues] = useState<{ id: string, name: string }[]>([]);
    const [selectedLeague, setSelectedLeague] = useState('mtn-premier-league');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    
    const [ghostTeams, setGhostTeams] = useState<string[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allData = await fetchAllCompetitions();
            const leagueList = Object.entries(allData)
                .filter(([_, comp]) => comp && comp.name) 
                .map(([id, comp]) => ({ id, name: comp.name! }));
            
            const sortedLeagues = leagueList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setLeagues(sortedLeagues);
            
            if (selectedLeague) {
                 await analyzeLeague(selectedLeague);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedLeague) {
            analyzeLeague(selectedLeague);
        }
    }, [selectedLeague]);

    const analyzeLeague = async (leagueId: string) => {
        setGhostTeams([]);
        try {
            const docRef = doc(db, 'competitions', leagueId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Competition;
                const teams = data.teams || [];
                const officialNames = new Set(teams.map(t => superNormalize(t.name || '')));
                
                const allMatches = [...(data.fixtures || []), ...(data.results || [])];
                const foundNames = new Set<string>();
                allMatches.forEach(m => {
                    if (m.teamA) foundNames.add(m.teamA.trim());
                    if (m.teamB) foundNames.add(m.teamB.trim());
                });

                const ghosts: string[] = [];
                foundNames.forEach(name => {
                    const normMatchName = superNormalize(name);
                    if (!officialNames.has(normMatchName) && name.length > 0) {
                        ghosts.push(name);
                    }
                });
                setGhostTeams(ghosts.sort());
            }
        } catch (e) {
            console.error("Error analyzing league", e);
        }
    };

    const handleExportJson = async () => {
        try {
            const comp = await fetchCompetition(selectedLeague);
            if (!comp) return;
            const dataStr = JSON.stringify(comp, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `${selectedLeague}-backup-${new Date().toISOString().split('T')[0]}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } catch (e) {
            alert("Export failed.");
        }
    };

    const handleRecalculate = async () => {
        if (!selectedLeague) return;
        setSubmitting(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("League doc missing.");

                const competitionData = docSnap.data() as Competition;
                const allMatches = [...(competitionData.fixtures || []), ...(competitionData.results || [])];
                const cleanedResults = allMatches.filter(m => m.status === 'finished' && m.scoreA != null && m.scoreB != null);
                const cleanedFixtures = allMatches.filter(m => m.status !== 'finished' || m.scoreA == null || m.scoreB == null);
                const recalculatedTeams = calculateStandings(competitionData.teams || [], cleanedResults, cleanedFixtures);
                
                transaction.update(docRef, removeUndefinedProps({ 
                    teams: recalculatedTeams,
                    fixtures: cleanedFixtures,
                    results: cleanedResults,
                }));
            });

            setStatusMessage({ type: 'success', text: `Successfully recalculated standings for ${selectedLeague}.` });
            analyzeLeague(selectedLeague);
        } catch (error) {
            handleFirestoreError(error, 'recalculate standings');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold font-display">Repair Data & Logs</h3>
                        <p className="text-sm text-gray-500">Force standings update or export league backups.</p>
                    </div>
                    <Button onClick={handleExportJson} className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs flex items-center gap-2">
                        <DownloadIcon className="w-4 h-4"/> Export JSON
                    </Button>
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="league-select" className="block text-xs font-black uppercase text-gray-400 mb-2">Target League</label>
                            <select 
                                id="league-select" 
                                value={selectedLeague} 
                                onChange={e => setSelectedLeague(e.target.value)} 
                                className="block w-full max-w-sm px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            >
                                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        
                        <div className={`border rounded-xl p-5 ${ghostTeams.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                            <h4 className={`font-bold flex items-center gap-2 mb-2 ${ghostTeams.length > 0 ? 'text-orange-800' : 'text-gray-700'}`}>
                                {ghostTeams.length > 0 ? <AlertTriangleIcon className="w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5 text-green-500" />} 
                                Team Mismatches: {ghostTeams.length} Detected
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {ghostTeams.length > 0 
                                    ? "These team names are in match records but not in the team list. This causes them to be excluded from logs. Use Merge Teams or Add Teams to fix."
                                    : "All match data is mapped to registered teams correctly."
                                }
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <Button onClick={handleRecalculate} disabled={submitting} className="bg-primary text-white hover:bg-primary-dark h-12 px-10 flex items-center gap-2 shadow-lg">
                                {submitting ? <Spinner className="w-5 h-5 border-2 border-white"/> : <><RefreshIcon className="w-5 h-5" /> Force Standings Sync</>}
                            </Button>
                        </div>
                    </div>
                )}
                
                {statusMessage.text && (
                    <div className={`mt-6 p-4 rounded-xl text-sm font-bold animate-fade-in ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMessage.text}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecalculateLogs;
