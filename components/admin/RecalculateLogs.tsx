
import React, { useState, useEffect } from 'react';
// FIX: Import 'fetchAllCompetitions' which is now correctly exported from the API service.
import { fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { Competition, CompetitionFixture, Team } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import RefreshIcon from '../icons/RefreshIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import TrashIcon from '../icons/TrashIcon';
import GitMergeIcon from '../icons/GitMergeIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps, normalize, levenshtein } from '../../services/utils';

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
                const officialNames = new Set(teams.map(t => t.name.trim()));
                
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
                    // Simple check first
                    if (!officialNames.has(name)) {
                        // Also check fuzzy. If the new calculateStandings handles it, it's not a "true" ghost for the logs,
                        // but it IS a data inconsistency we should flag.
                        ghosts.push(name);
                    }
                });
                setGhostTeams(ghosts.sort());

                // 2. Detect Zombies (Teams in the list that have NO matches and 0 points)
                // This usually happens if a team was duplicated/renamed but the old entry remains.
                const zombies = teams.filter(t => {
                    const name = t.name.trim();
                    const hasMatches = allMatches.some(m => m.teamA.trim() === name || m.teamB.trim() === name);
                    // A zombie is a team with no matches AND (safeguard) 0 points/games played in stats
                    return !hasMatches && (t.stats.p === 0);
                });
                setZombieTeams(zombies);
            }
        } catch (e) {
            console.error("Error analyzing league", e);
        }
    };

    const handleAutoCorrectTypos = async () => {
        if (!window.confirm("This will scan all matches. If a team name is very similar to an official team (e.g. 'Leopard' vs 'Leopards'), it will update the match record to the official name. Proceed?")) return;
        
        setSubmitting(true);
        let fixedCount = 0;

        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const data = docSnap.data() as Competition;
                
                // Create map of Normalized Name -> Official Name
                const officialTeamMap = new Map<string, string>();
                (data.teams || []).forEach(t => {
                    officialTeamMap.set(normalize(t.name), t.name.trim());
                });

                // Helper to find best match
                const findOfficialName = (name: string): string | null => {
                    const norm = normalize(name);
                    if (officialTeamMap.has(norm)) return officialTeamMap.get(norm)!;

                    // Fuzzy search
                    let bestMatch: string | null = null;
                    let minDist = Infinity;
                    for (const key of officialTeamMap.keys()) {
                         const dist = levenshtein(norm, key);
                         if (dist < minDist) {
                             minDist = dist;
                             bestMatch = officialTeamMap.get(key)!;
                         }
                    }
                    // Strict threshold: 2 edits max
                    if (bestMatch && minDist <= 2) return bestMatch;
                    return null;
                };

                const fixer = (matches: CompetitionFixture[]) => matches.map(m => {
                    const fixedA = findOfficialName(m.teamA);
                    const fixedB = findOfficialName(m.teamB);
                    
                    let changed = false;
                    const newM = { ...m };

                    if (fixedA && fixedA !== m.teamA) {
                        newM.teamA = fixedA;
                        changed = true;
                        fixedCount++;
                    }
                    if (fixedB && fixedB !== m.teamB) {
                        newM.teamB = fixedB;
                        changed = true;
                        fixedCount++;
                    }
                    return newM;
                });

                const updatedFixtures = fixer(data.fixtures || []);
                const updatedResults = fixer(data.results || []);
                
                // Also recalculate standings with clean names
                const updatedTeams = calculateStandings(data.teams || [], updatedResults, updatedFixtures);

                transaction.update(docRef, removeUndefinedProps({
                    fixtures: updatedFixtures,
                    results: updatedResults,
                    teams: updatedTeams
                }));
            });
            
            setStatusMessage({ type: 'success', text: `Auto-Correction Complete. Fixed ${fixedCount} name occurrences.` });
            await analyzeLeague(selectedLeague);

        } catch(error) {
            handleFirestoreError(error, 'auto correct typos');
            setStatusMessage({ type: 'error', text: 'Failed to auto-correct.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleFixGhost = async (ghostName: string) => {
        const targetTeamName = fixMap[ghostName];
        if (!targetTeamName) {
            alert("Please select an official team to map this ghost entry to.");
            return;
        }

        if (!window.confirm(`This will rename "${ghostName}" to "${targetTeamName}" in ALL past and future matches. This cannot be undone. Proceed?`)) return;

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

    const handleRemoveZombie = async (teamId: number) => {
        if (!window.confirm("Are you sure you want to remove this team? It has no matches associated with it.")) return;

        setSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                
                const data = docSnap.data() as Competition;
                const updatedTeams = (data.teams || []).filter(t => t.id !== teamId);

                transaction.update(docRef, removeUndefinedProps({ teams: updatedTeams }));
            });
            
            setStatusMessage({ type: 'success', text: `Removed unused team entry.` });
            await analyzeLeague(selectedLeague);
        } catch (error) {
            handleFirestoreError(error, 'remove zombie team');
            setStatusMessage({ type: 'error', text: 'Failed to remove team.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleMergeIntoZombie = async (targetZombieId: number) => {
        const sourceIdStr = mergeMap[targetZombieId];
        if (!sourceIdStr) {
            alert("Please select a source team to merge from.");
            return;
        }
        const sourceId = parseInt(sourceIdStr);
        const sourceTeam = officialTeams.find(t => t.id === sourceId);
        
        // Finding the zombie team object for confirmation name
        const targetTeam = zombieTeams.find(t => t.id === targetZombieId);

        if (!sourceTeam || !targetTeam) return;

        if (!window.confirm(`CONFIRM MERGE:\n\nSource (will be deleted): ${sourceTeam.name}\nTarget (will keep): ${targetTeam.name}\n\nAll matches for "${sourceTeam.name}" will be renamed to "${targetTeam.name}".\n"${sourceTeam.name}" will then be deleted.\n\nAre you sure?`)) return;

        setSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', selectedLeague);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Competition not found");
                const data = docSnap.data() as Competition;

                const oldName = sourceTeam.name.trim();
                const newName = targetTeam.name.trim();

                // 1. Rename matches
                const renameMatches = (matches: CompetitionFixture[]) => matches.map(m => ({
                    ...m,
                    teamA: m.teamA.trim() === oldName ? newName : m.teamA,
                    teamB: m.teamB.trim() === oldName ? newName : m.teamB
                }));

                const updatedFixtures = renameMatches(data.fixtures || []);
                const updatedResults = renameMatches(data.results || []);

                // 2. Delete Source Team from list
                const currentTeams = data.teams || [];
                const updatedTeamList = currentTeams.filter(t => t.id !== sourceId); // Remove source
                // Target (Zombie) is already in the list, so we don't add it.

                // 3. Recalculate Standings (Target team will now pick up the stats from the matches)
                const finalTeams = calculateStandings(updatedTeamList, updatedResults, updatedFixtures);

                transaction.update(docRef, removeUndefinedProps({
                    teams: finalTeams,
                    fixtures: updatedFixtures,
                    results: updatedResults
                }));
            });

            setStatusMessage({ type: 'success', text: `Merged "${sourceTeam.name}" into "${targetTeam.name}" successfully!` });
            await analyzeLeague(selectedLeague);
            setMergeMap({});

        } catch (error) {
            handleFirestoreError(error, 'merge into zombie');
            setStatusMessage({ type: 'error', text: 'Failed to merge teams.' });
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
                <h3 className="text-2xl font-bold font-display mb-1">Repair Data & Recalculate Logs</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Fix duplicate teams, merge stats from old names, and force log updates.
                </p>

                {loading ? <Spinner /> : (
                    <div className="space-y-6">
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
                        
                        {/* NEW: Auto-Correct Section */}
                        <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                            <h4 className="font-bold flex items-center gap-2 mb-2 text-purple-800">
                                <SparklesIcon className="w-5 h-5"/> Auto-Correct Team Name Typos
                            </h4>
                            <p className="text-xs text-purple-700 mb-3">
                                Use this if you see duplicates like "Royal Leopards" (Correct) vs "Royal Leopard" (Incorrect) in your logs.
                                It scans all match records and automatically updates misspelled names to match your official team list.
                            </p>
                            <Button 
                                onClick={handleAutoCorrectTypos}
                                disabled={submitting}
                                className="bg-purple-600 text-white hover:bg-purple-700 text-sm h-9 px-4 w-full sm:w-auto"
                            >
                                {submitting ? <Spinner className="w-4 h-4 border-2"/> : "Deep Clean & Auto-Correct Names"}
                            </Button>
                        </div>

                        {/* GHOST TEAM DETECTOR (Matches -> Teams mismatch) */}
                        <div className={`border rounded-lg p-4 ${ghostTeams.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                            <h4 className={`font-bold flex items-center gap-2 mb-2 ${ghostTeams.length > 0 ? 'text-orange-800' : 'text-gray-700'}`}>
                                {ghostTeams.length > 0 ? <AlertTriangleIcon className="w-5 h-5"/> : <span className="text-green-600">✓</span>} 
                                Match Name Mismatches (Ghosts) - {ghostTeams.length} Detected
                            </h4>
                            {ghostTeams.length > 0 ? (
                                <>
                                    <p className="text-xs text-orange-700 mb-3">
                                        These names appear in matches but are NOT in your official team list. This causes duplicates on the log. Map them to the correct team to fix.
                                    </p>
                                    <div className="space-y-2">
                                        {ghostTeams.map(ghost => (
                                            <div key={ghost} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded border border-orange-100">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{ghost}</span>
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
                                                    Fix Name
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500">All match team names correspond to official teams.</p>
                            )}
                        </div>

                        {/* ZOMBIE TEAM DETECTOR (Unused Teams) */}
                        <div className={`border rounded-lg p-4 ${zombieTeams.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                             <h4 className={`font-bold flex items-center gap-2 mb-2 ${zombieTeams.length > 0 ? 'text-blue-800' : 'text-gray-700'}`}>
                                {zombieTeams.length > 0 ? <GitMergeIcon className="w-5 h-5"/> : <span className="text-green-600">✓</span>}
                                Empty Team Entries (Zombies) - {zombieTeams.length} Detected
                            </h4>
                            {zombieTeams.length > 0 ? (
                                <>
                                    <p className="text-xs text-blue-700 mb-3">
                                        These teams exist in the list but have <b>0 matches</b> linked to them. This usually happens when a team is duplicated. 
                                        <br/>
                                        If this is the <b>Correct</b> team, use the "Merge Stats From" option to pull match history from the duplicate (Old Name).
                                        <br/>
                                        If this is the <b>Incorrect</b> duplicate, simply remove it.
                                    </p>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {zombieTeams.map(team => (
                                            <div key={team.id} className="bg-white p-3 rounded border border-blue-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm">{team.name} <span className="font-normal text-gray-500">(0 matches)</span></span>
                                                    <Button 
                                                        onClick={() => handleRemoveZombie(team.id)} 
                                                        disabled={submitting}
                                                        className="bg-red-100 text-red-700 hover:bg-red-200 text-xs h-7 px-2"
                                                    >
                                                        <TrashIcon className="w-3 h-3 mr-1"/> Remove Entry
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                                    <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">Merge Stats From:</span>
                                                    <select 
                                                        className="text-xs border-gray-300 rounded w-full"
                                                        value={mergeMap[team.id] || ''}
                                                        onChange={e => setMergeMap(prev => ({...prev, [team.id]: e.target.value}))}
                                                    >
                                                        <option value="" disabled>Select Duplicate with History</option>
                                                        {officialTeams.filter(t => t.id !== team.id).map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        onClick={() => handleMergeIntoZombie(team.id)}
                                                        disabled={submitting || !mergeMap[team.id]}
                                                        className="bg-blue-600 text-white text-xs h-7 px-3 whitespace-nowrap"
                                                    >
                                                        Merge & Fix
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-gray-500">No unused/duplicate team entries found.</p>
                            )}
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-3">If standings are still incorrect (e.g. points didn't update after a result), force a full recalculation:</p>
                            <Button onClick={handleRecalculate} disabled={submitting} className="bg-gray-800 text-white hover:bg-black h-11 w-auto flex justify-center items-center gap-2 px-6">
                                {submitting ? <Spinner className="w-5 h-5 border-2"/> : <><RefreshIcon className="w-5 h-5" /> Force Recalculation</>}
                            </Button>
                        </div>
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
