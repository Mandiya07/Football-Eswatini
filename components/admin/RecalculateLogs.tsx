
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
import { calculateStandings, removeUndefinedProps, normalize, levenshtein, superNormalize } from '../../services/utils';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import TrashIcon from '../icons/TrashIcon';
import GitMergeIcon from '../icons/GitMergeIcon';
import SparklesIcon from '../icons/SparklesIcon';
import UsersIcon from '../icons/UsersIcon';
import DownloadIcon from '../icons/DownloadIcon';

const RecalculateLogs: React.FC = () => {
    const [leagues, setLeagues] = useState<{ id: string, name: string }[]>([]);
    const [selectedLeague, setSelectedLeague] = useState('mtn-premier-league');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    
    // Ghost & Zombie Team State
    const [ghostTeams, setGhostTeams] = useState<string[]>([]);
    const [zombieTeams, setZombieTeams] = useState<Team[]>([]);
    const [officialTeams, setOfficialTeams] = useState<{id: number, name: string}[]>([]);
    
    // Maps
    const [fixMap, setFixMap] = useState<Record<string, string>>({}); // Map ghost name -> official name
    const [mergeMap, setMergeMap] = useState<Record<number, string>>({}); // Map zombie ID -> source team ID

    const loadData = async () => {
        setLoading(true);
        const allData = await fetchAllCompetitions();
        const leagueList = Object.entries(allData)
            .filter(([_, comp]) => comp.teams) 
            .map(([id, comp]) => ({ id, name: comp.name }));
        setLeagues(leagueList);
        
        if (selectedLeague) {
             await analyzeLeague(selectedLeague);
        }
        
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Re-analyze when league changes
    useEffect(() => {
        if (selectedLeague) {
            analyzeLeague(selectedLeague);
        }
    }, [selectedLeague]);

    const analyzeLeague = async (leagueId: string) => {
        setGhostTeams([]);
        setOfficialTeams([]);
        setZombieTeams([]);
        setFixMap({});
        setMergeMap({});
        
        try {
            const docRef = doc(db, 'competitions', leagueId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Competition;
                const teams = data.teams || [];
                const officialNames = new Set(teams.map(t => superNormalize(t.name)));
                
                setOfficialTeams(teams.map(t => ({ id: t.id, name: t.name })).sort((a,b) => a.name.localeCompare(b.name)));

                const allMatches = [...(data.fixtures || []), ...(data.results || [])];
                
                // 1. Detect Ghosts (Names in matches that are NOT in the team list)
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

                // 2. Detect Zombies (Teams in the list that have NO matches and 0 points)
                const zombies = teams.filter(t => {
                    const normOfficial = superNormalize(t.name);
                    const hasMatches = allMatches.some(m => superNormalize(m.teamA) === normOfficial || superNormalize(m.teamB) === normOfficial);
                    return !hasMatches && (t.stats.p === 0);
                });
                setZombieTeams(zombies);
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

    const handleAdoptGhosts = async () => {
        if (ghostTeams.length === 0) return;
        if (!window.confirm(`This will create ${ghostTeams.length} new team entries in this league using the names found in match records. This ensures they appear on the league log. Proceed?`)) return;

        setSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const data = docSnap.data() as Competition;
                
                const currentTeams = [...(data.teams || [])];
                const allGlobalComps = await fetchAllCompetitions();
                const allGlobalTeams = Object.values(allGlobalComps).flatMap(c => c.teams || []);
                let nextId = allGlobalTeams.reduce((max, t) => Math.max(max, t.id), 0) + 1;

                ghostTeams.forEach(name => {
                    const newTeam: Team = {
                        id: nextId++,
                        name: name,
                        crestUrl: `https://via.placeholder.com/128/333333/FFFFFF?text=${name.charAt(0)}`,
                        stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' },
                        players: [], fixtures: [], results: [], staff: []
                    };
                    currentTeams.push(newTeam);
                });

                const finalTeams = calculateStandings(currentTeams, data.results || [], data.fixtures || []);
                transaction.update(docRef, removeUndefinedProps({ teams: finalTeams }));
            });

            setStatusMessage({ type: 'success', text: `Adopted ${ghostTeams.length} teams successfully! The log is now updated.` });
            await analyzeLeague(selectedLeague);
        } catch (error) {
            handleFirestoreError(error, 'adopt ghost teams');
            setStatusMessage({ type: 'error', text: 'Failed to adopt teams.' });
        } finally {
            setSubmitting(false);
        }
    }

    const handleFixGhost = async (ghostName: string) => {
        const targetTeamName = fixMap[ghostName];
        if (!targetTeamName) {
            alert("Please select an official team to map this ghost entry to.");
            return;
        }

        if (!window.confirm(`This will rename "${ghostName}" to "${targetTeamName}" in ALL past and future matches. This will fix the "sudden change" by consolidating history. Proceed?`)) return;

        setSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const data = docSnap.data() as Competition;
                
                const fixer = (matches: CompetitionFixture[]) => matches.map(m => ({
                    ...m,
                    teamA: m.teamA.trim() === ghostName ? targetTeamName : m.teamA,
                    teamB: m.teamB.trim() === ghostName ? targetTeamName : m.teamB
                }));

                const updatedFixtures = fixer(data.fixtures || []);
                const updatedResults = fixer(data.results || []);
                
                const updatedTeams = calculateStandings(data.teams || [], updatedResults, updatedFixtures);

                transaction.update(docRef, removeUndefinedProps({
                    fixtures: updatedFixtures,
                    results: updatedResults,
                    teams: updatedTeams
                }));
            });
            
            setStatusMessage({ type: 'success', text: `Fixed "${ghostName}"! Matches updated and logs recalculated.` });
            await analyzeLeague(selectedLeague);

        } catch (error) {
            handleFirestoreError(error, 'fix ghost team');
            setStatusMessage({ type: 'error', text: 'Failed to fix team.' });
        } finally {
            setSubmitting(false);
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
                if (!docSnap.exists()) throw new Error("Competition document not found.");

                const competitionData = docSnap.data() as Competition;
                
                const allMatches = [...(competitionData.fixtures || []), ...(competitionData.results || [])];
                
                const cleanedResults = allMatches.filter(m => 
                    m.status === 'finished' && m.scoreA != null && m.scoreB != null
                );
                
                const cleanedFixtures = allMatches.filter(m => 
                    m.status !== 'finished' || m.scoreA == null || m.scoreB == null
                );
                
                const recalculatedTeams = calculateStandings(competitionData.teams || [], cleanedResults, cleanedFixtures);
                
                transaction.update(docRef, { 
                    teams: recalculatedTeams,
                    fixtures: cleanedFixtures,
                    results: cleanedResults,
                });
            });

            setStatusMessage({ type: 'success', text: `Successfully repaired data and recalculated logs.` });
            analyzeLeague(selectedLeague);
        
        } catch (error) {
            handleFirestoreError(error, 'recalculate standings');
            setStatusMessage({ type: 'error', text: `Failed to recalculate. See alert for details.` });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-2xl font-bold font-display">Repair Data & Logs</h3>
                    <Button onClick={handleExportJson} className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs flex items-center gap-2">
                        <DownloadIcon className="w-4 h-4"/> Export Backup
                    </Button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    Fix "Ghost" teams caused by name mismatches and force log updates.
                </p>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-1">Select League</label>
                            <select 
                                id="league-select" 
                                value={selectedLeague} 
                                onChange={e => setSelectedLeague(e.target.value)} 
                                className="mb-4 block w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        
                        {/* GHOST TEAM DETECTOR (Matches -> Teams mismatch) */}
                        <div className={`border rounded-lg p-4 ${ghostTeams.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className={`font-bold flex items-center gap-2 ${ghostTeams.length > 0 ? 'text-orange-800' : 'text-gray-700'}`}>
                                    {ghostTeams.length > 0 ? <AlertTriangleIcon className="w-5 h-5"/> : <span className="text-green-600">✓</span>} 
                                    Match Name Mismatches (Ghosts) - {ghostTeams.length} Detected
                                </h4>
                                {ghostTeams.length > 0 && (
                                    <Button 
                                        onClick={handleAdoptGhosts} 
                                        disabled={submitting}
                                        className="bg-orange-600 text-white text-[10px] h-7 px-3 flex items-center gap-1 shadow-sm"
                                    >
                                        <UsersIcon className="w-3 h-3" /> Adopt All as Teams
                                    </Button>
                                )}
                            </div>
                            {ghostTeams.length > 0 ? (
                                <>
                                    <p className="text-xs text-orange-700 mb-3">
                                        These names appear in matches but are NOT in your official team list. 
                                        Map them to an official team to merge their match history into the log.
                                    </p>
                                    <div className="space-y-2">
                                        {ghostTeams.map(ghost => (
                                            <div key={ghost} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded border border-orange-100">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded truncate max-w-[150px]">{ghost}</span>
                                                <span className="text-gray-400 text-xs">should be &rarr;</span>
                                                <select 
                                                    className="text-sm border-gray-300 rounded-md flex-grow"
                                                    value={fixMap[ghost] || ''}
                                                    onChange={e => setFixMap(prev => ({...prev, [ghost]: e.target.value}))}
                                                >
                                                    <option value="" disabled>Select Official Team</option>
                                                    {officialTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                </select>
                                                <Button 
                                                    onClick={() => handleFixGhost(ghost)} 
                                                    disabled={submitting || !fixMap[ghost]}
                                                    className="bg-green-600 text-white text-xs h-8 px-3"
                                                >
                                                    Map Name
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500">All match team names correspond to official teams. Logic is healthy.</p>
                            )}
                        </div>

                        <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                            <Button onClick={handleRecalculate} disabled={submitting} className="bg-gray-800 text-white hover:bg-black h-11 px-6 flex items-center justify-center gap-2">
                                {submitting ? <Spinner className="w-5 h-5 border-2"/> : <><RefreshIcon className="w-5 h-5" /> Force Standings Update</>}
                            </Button>
                        </div>
                    </div>
                )}
                
                {statusMessage.text && (
                    <div className={`mt-6 p-3 rounded-md text-sm font-semibold animate-fade-in ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {statusMessage.text}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RecalculateLogs;
