
import React, { useState, useEffect } from 'react';
// FIX: Import 'fetchAllCompetitions' and 'fetchCompetition' correctly.
import { fetchAllCompetitions, fetchCompetition, handleFirestoreError } from '../../services/api';
import { Team, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { calculateStandings, removeUndefinedProps } from '../../services/utils';
import ArrowRightIcon from '../icons/ArrowRightIcon';

const MergeTeams: React.FC = () => {
  const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
  const [selectedCompId, setSelectedCompId] = useState('mtn-premier-league');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [mergeConfirmation, setMergeConfirmation] = useState<{ team1: Team, team2: Team } | null>(null);
  const [primaryTeamId, setPrimaryTeamId] = useState<number | null>(null);
  
  const loadInitialData = async () => {
      setLoading(true);
      try {
          const allComps = await fetchAllCompetitions();
          const compList = Object.entries(allComps).map(([id, comp]) => ({ id, name: comp.name }));
          setCompetitions(compList.sort((a, b) => a.name.localeCompare(b.name)));

          // Load initial teams (either from default or first available)
          const initialComp = compList.find(c => c.id === selectedCompId) || compList[0];
          if (initialComp) {
             if (initialComp.id !== selectedCompId) setSelectedCompId(initialComp.id);
             const compData = allComps[initialComp.id];
             if (compData && compData.teams) {
                 setTeams(compData.teams.sort((a,b) => a.name.localeCompare(b.name)));
             }
          }
      } catch (error) {
          console.error("Error loading merge data:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCompChange = async (compId: string) => {
      setSelectedCompId(compId);
      setLoading(true);
      setMergeConfirmation(null);
      setSelected([]);
      try {
          const data = await fetchCompetition(compId);
          if (data?.teams) {
              setTeams(data.teams.sort((a,b) => a.name.localeCompare(b.name)));
          } else {
              setTeams([]);
          }
      } catch (error) {
          console.error("Error switching competition:", error);
      } finally {
          setLoading(false);
      }
  };

  const handleSelect = (teamId: number) => {
    setSelected(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      }
      if (prev.length < 2) {
        return [...prev, teamId];
      }
      return prev;
    });
  };

  const handleInitiateMerge = () => {
    if (selected.length !== 2) return;
    const team1 = teams.find(t => t.id === selected[0]);
    const team2 = teams.find(t => t.id === selected[1]);

    if (team1 && team2) {
      setMergeConfirmation({ team1, team2 });
      setPrimaryTeamId(team1.id); // Default to first selection
    }
  };

  const handleCancelMerge = () => {
    setMergeConfirmation(null);
    setPrimaryTeamId(null);
  };

  const handleConfirmMerge = async () => {
    if (!mergeConfirmation || !primaryTeamId) return;
    
    setSubmitting(true);
    const { team1, team2 } = mergeConfirmation;
    
    const tempTeamToKeep = team1.id === primaryTeamId ? team1 : team2;
    const tempTeamToRemove = team1.id === primaryTeamId ? team2 : team1;
    
    const teamToKeepName = tempTeamToKeep.name.trim();
    const teamToRemoveName = tempTeamToRemove.name.trim();
    const primaryTeamName = teamToKeepName;

    const docRef = doc(db, 'competitions', selectedCompId);
    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Competition not found");

            const competition = docSnap.data() as Competition;
            
            const currentTeams = (competition.teams || []).map(t => ({...t, name: t.name.trim()}));
            const currentFixtures = competition.fixtures || [];
            const currentResults = competition.results || [];
            
            // Find fresh references inside the transaction
            const teamToKeep = currentTeams.find(t => String(t.id).trim() === String(tempTeamToKeep.id).trim());
            const teamToRemove = currentTeams.find(t => String(t.id).trim() === String(tempTeamToRemove.id).trim());

            if (!teamToKeep || !teamToRemove) throw new Error("Could not find one or both teams in the database for merging.");

            const combinedPlayers = [...(teamToKeep.players || [])];
            const playerIds = new Set(combinedPlayers.map(p => p.id));
            (teamToRemove.players || []).forEach(p => {
                if (!playerIds.has(p.id)) combinedPlayers.push(p);
            });

            const combinedStaff = [...(teamToKeep.staff || [])];
            const staffIds = new Set(combinedStaff.map(s => s.id));
            (teamToRemove.staff || []).forEach(s => {
                if (!staffIds.has(s.id)) combinedStaff.push(s);
            });
            
            // Rename team references in Matches
            // We must look for the name of the team being removed and swap it to the team being kept.
            const renameInMatches = (matches: any[]) => matches.map(match => {
                let newTeamA = match.teamA.trim();
                let newTeamB = match.teamB.trim();
                
                // Case insensitive check
                if (newTeamA.toLowerCase() === teamToRemoveName.toLowerCase()) newTeamA = primaryTeamName;
                if (newTeamB.toLowerCase() === teamToRemoveName.toLowerCase()) newTeamB = primaryTeamName;
                
                return { ...match, teamA: newTeamA, teamB: newTeamB };
            });

            const updatedFixtures = renameInMatches(currentFixtures);
            const updatedResults = renameInMatches(currentResults);
            
            const mergedTeam: Team = {
                ...teamToKeep,
                name: primaryTeamName,
                players: combinedPlayers,
                staff: combinedStaff,
                // Stats will be recalculated
                stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
            };
            
            // Filter out BOTH old records, then add the new merged one
            const baseTeamsForRecalculation = currentTeams.filter(t => String(t.id).trim() !== String(teamToKeep.id).trim() && String(t.id).trim() !== String(teamToRemove.id).trim());
            baseTeamsForRecalculation.push(mergedTeam);

            const finalUpdatedTeams = calculateStandings(baseTeamsForRecalculation, updatedResults, updatedFixtures);

            // CRITICAL: Sanitize the entire payload before updating.
            transaction.update(docRef, removeUndefinedProps({ 
                teams: finalUpdatedTeams, 
                fixtures: updatedFixtures, 
                results: updatedResults 
            }));
        });
        
        alert('Teams merged successfully!');
        setMergeConfirmation(null);
        setPrimaryTeamId(null);
        setSelected([]);
        // Refresh the list
        handleCompChange(selectedCompId);
    } catch (error) {
        handleFirestoreError(error, 'merge teams');
    } finally {
        setSubmitting(false);
    }
  };


  return (
    <Card className="shadow-lg animate-fade-in">
      <CardContent className="p-6">
        <h3 className="text-2xl font-bold font-display mb-1">Merge Duplicate Teams</h3>
        <p className="text-sm text-gray-600 mb-6">Select two teams to merge into a single entity. This will combine player lists and fix match history references.</p>

        <div className="mb-4">
            <label htmlFor="comp-select-merge" className="block text-sm font-medium text-gray-700 mb-1">Select Competition</label>
            <select
                id="comp-select-merge"
                value={selectedCompId}
                onChange={(e) => handleCompChange(e.target.value)}
                className="block w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                disabled={loading || !!mergeConfirmation}
            >
                {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : mergeConfirmation ? (
             <div className="animate-fade-in p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <h4 className="text-lg font-bold text-blue-800">Confirm Merge</h4>
                <p className="text-sm text-gray-700 mt-2">You are about to merge these two teams. All players, staff, and match history will be combined under one name. This action cannot be undone.</p>
                
                <div className="my-4 flex items-center justify-center gap-4 p-3 bg-white rounded-md">
                    <div className="text-center font-semibold">{mergeConfirmation.team1.name}</div>
                    <ArrowRightIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <div className="text-center font-semibold">{mergeConfirmation.team2.name}</div>
                </div>
                
                <p className="text-sm font-semibold text-gray-800 mb-2">Please select the primary name and crest to keep:</p>
                <div className="space-y-2">
                    {[mergeConfirmation.team1, mergeConfirmation.team2].map(team => (
                        <label key={team.id} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border-2 transition-colors ${primaryTeamId === team.id ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-gray-50'}`}>
                            <input
                                type="radio"
                                name="primaryTeam"
                                value={team.id}
                                checked={primaryTeamId === team.id}
                                onChange={() => setPrimaryTeamId(team.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <img src={team.crestUrl} alt={team.name} className="w-8 h-8 object-contain" />
                            <span className="font-semibold">{team.name}</span>
                        </label>
                    ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <Button onClick={handleCancelMerge} className="bg-gray-200 text-gray-800" disabled={submitting}>Cancel</Button>
                    <Button onClick={handleConfirmMerge} className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
                        {submitting ? <Spinner className="w-5 h-5 border-2" /> : 'Confirm Merge'}
                    </Button>
                </div>
            </div>
        ) : (
          <>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 border rounded-lg p-2">
              {teams.length > 0 ? teams.map(team => (
                <div 
                  key={team.id}
                  onClick={() => handleSelect(team.id)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selected.includes(team.id) ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-50 border-transparent'} border-2`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(team.id)}
                    onChange={() => handleSelect(team.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <img src={team.crestUrl} alt={team.name} className="w-8 h-8 object-contain" />
                  <span className="font-semibold">{team.name}</span>
                </div>
              )) : (
                  <p className="text-center text-gray-500 py-4">No teams found in this competition.</p>
              )}
            </div>
            <div className="mt-4 text-right">
              <Button onClick={handleInitiateMerge} disabled={selected.length !== 2} className="bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:bg-gray-400">
                {`Merge Selected Teams (${selected.length}/2)`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MergeTeams;
