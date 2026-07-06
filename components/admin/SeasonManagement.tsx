import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { Competition } from '../../data/teams';
import { handleFirestoreError, OperationType } from '../../services/api';

import { useAuth } from '../../contexts/AuthContext';
import { useDataCache } from '../../contexts/DataCacheContext';

const SeasonManagement: React.FC = () => {
    const { user } = useAuth();
    const { competitions } = useDataCache();
    
    const [newSeason, setNewSeason] = useState('');
    const [selectedLeagueId, setSelectedLeagueId] = useState('all');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const isSuperAdmin = user?.role === 'super_admin';
    const managedLeagues = user?.managedLeagues || [];

    // Determine which leagues this user can manage
    const availableLeagues = Object.values(competitions).filter(comp => {
        if (isSuperAdmin) return true;
        return managedLeagues.includes(comp.id);
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Fallback selection if 'all' is chosen but user is not super_admin
    React.useEffect(() => {
        if (!isSuperAdmin && selectedLeagueId === 'all' && availableLeagues.length > 0) {
            setSelectedLeagueId(availableLeagues[0].id);
        }
    }, [isSuperAdmin, selectedLeagueId, availableLeagues]);

    const handleInitializeSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newSeason) {
            alert("Please enter a new season year.");
            return;
        }

        const targetLeaguesText = selectedLeagueId === 'all' ? 'ALL competitions' : availableLeagues.find(l => l.id === selectedLeagueId)?.name || 'the selected competition';

        if (!window.confirm(`Are you sure you want to initialize the ${newSeason} season? This will archive the current season data and reset all rosters, fixtures, and results for ${targetLeaguesText}.`)) {
            return;
        }

        setLoading(true);
        setStatusMessage('Initializing new season...');

        try {
            const compsSnapshot = await getDocs(collection(db, 'competitions'));
            const batch = writeBatch(db);
            
            let count = 0;
            compsSnapshot.forEach((docSnap) => {
                const comp = docSnap.data() as Competition;
                
                // Only process the selected league, or all if selectedLeagueId is 'all'
                if (selectedLeagueId !== 'all' && comp.id !== selectedLeagueId) {
                    return;
                }
                
                // Extra security check
                if (!isSuperAdmin && !managedLeagues.includes(comp.id)) {
                    return;
                }
                const currentSeasonSafe = (comp.season || 'Unknown').replace(/\//g, '-');
                
                // 1. Archive current season
                const archiveRef = doc(db, 'competitions_archive', `${comp.id}-${currentSeasonSafe}`);
                batch.set(archiveRef, comp);
                
                // 2. Clear out data for new season
                const newTeams = (comp.teams || []).map(team => ({
                    ...team,
                    players: [],
                    fixtures: [],
                    results: [],
                    stats: {
                        p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: ''
                    },
                    standings: {
                        played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0
                    }
                }));

                const activeRef = doc(db, 'competitions', comp.id);
                batch.set(activeRef, {
                    ...comp,
                    season: newSeason,
                    fixtures: [],
                    results: [],
                    teams: newTeams
                });

                count++;
            });

            await batch.commit();
            setStatusMessage(`Successfully initialized ${newSeason} season for ${count} competitions.`);
            setNewSeason('');
        } catch (error) {
            console.error("Error initializing season:", error);
            handleFirestoreError(error, OperationType.UPDATE, 'competitions');
            setStatusMessage(`Error initializing season: ${(error as any).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <Card className="shadow-lg border-blue-200">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-1 text-blue-900">Season Management</h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Start a new football season. This will clone the structures (leagues and teams) from the current season into the new season, while providing empty slots for new rosters, fixtures, and results. The previous season will be archived.
                    </p>

                    <form onSubmit={handleInitializeSeason} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="selectedLeague" className="block text-sm font-medium text-gray-700 mb-1">
                                    Target Competition
                                </label>
                                <select 
                                    id="selectedLeague" 
                                    value={selectedLeagueId} 
                                    onChange={e => setSelectedLeagueId(e.target.value)} 
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    {isSuperAdmin && <option key="all-comps" value="all">-- All Competitions --</option>}
                                    {availableLeagues.map((comp, index) => (
                                        <option key={`league-${comp.id || index}`} value={comp.id}>{comp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="newSeason" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Season Identifier
                                </label>
                                <input 
                                    type="text" 
                                    id="newSeason" 
                                    value={newSeason} 
                                    onChange={e => setNewSeason(e.target.value)} 
                                    required 
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                    placeholder="e.g., 2026/2027" 
                                />
                            </div>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <p>
                                            Initializing a new season is a destructive operation on the active database. It will empty all current rosters, fixtures, and results. Please ensure you actually want to transition to a new season before proceeding.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-4">
                            {statusMessage && (
                                <p className={`text-sm ${statusMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                    {statusMessage}
                                </p>
                            )}
                            <Button 
                                type="submit" 
                                className="bg-blue-600 text-white hover:bg-blue-700 h-12 px-8 flex justify-center items-center font-bold shadow-md rounded-xl" 
                                disabled={loading}
                            >
                                {loading ? <Spinner className="w-5 h-5 border-2 border-white/20 border-t-white" /> : 'Initialize New Season'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SeasonManagement;
