import React, { useState, useEffect } from 'react';
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
          const compList = Object.entries(allComps)
            .filter(([_, comp]) => comp && comp.name)
            .map(([id, comp]) => ({ id, name: comp.name! }));
          
          const sortedComps = compList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setCompetitions(sortedComps);

          // Find appropriate competition to start with
          const activeId = compList.find(c => c.id === selectedCompId) ? selectedCompId : (compList[0]?.id || '');
          if (activeId) {
             setSelectedCompId(activeId);
             const compData = allComps[activeId];
             if (compData && compData.teams) {
                 const teamList = (compData.teams || [])
                    .filter(t => t && t.name)
                    .sort((a,b) => (a.name || '').localeCompare(b.name || ''));
                 setTeams(teamList);
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
              const teamList = (data.teams || [])
                .filter(t => t && t.name)
                .sort((a,b) => (a.name || '').localeCompare(b.name || ''));
              setTeams(teamList);
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
      setPrimaryTeamId(team1.id);
    }
  };

  const handleConfirmMerge = async () => {
    if (!mergeConfirmation || !primaryTeamId) return;
    
    setSubmitting(true);
    const { team1, team2 } = mergeConfirmation;
    
    const teamToKeepRef = team1.id === primaryTeamId ? team1 : team2;
    const teamToRemoveRef = team1.id === primaryTeamId ? team2 : team1;
    
    const docRef = doc(db, 'competitions', selectedCompId);
    try {
        await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Competition not found");

            const competition = docSnap.data() as Competition;
            const currentTeams = [...(competition.teams || [])];
            
            const teamToKeep = currentTeams.find(t => t.id === teamToKeepRef.id);
            const teamToRemove = currentTeams.find(t => t.id === teamToRemoveRef.id);

            if (!teamToKeep || !teamToRemove) throw new Error("Team mismatch.");

            // Merge rosters
            const combinedPlayers = [...(teamToKeep.players || [])];
            const playerIds = new Set(combinedPlayers.map(p => p.id));
            (teamToRemove.players || []).forEach(p => {
                if (!playerIds.has(p.id)) combinedPlayers.push(p);
            });

            const teamToKeepName = teamToKeep.name.trim();
            const teamToRemoveName = teamToRemove.name.trim();

            const renameInMatches = (matches: any[]) => (matches || []).map(match => {
                let newTeamA = match.teamA.trim();
                let newTeamB = match.teamB.trim();
                if (newTeamA.toLowerCase() === teamToRemoveName.toLowerCase()) newTeamA = teamToKeepName;
                if (newTeamB.toLowerCase() === teamToRemoveName.toLowerCase()) newTeamB = teamToKeepName;
                return { ...match, teamA: newTeamA, teamB: newTeamB };
            });

            const updatedFixtures = renameInMatches(competition.fixtures);
            const updatedResults = renameInMatches(competition.results);
            
            const baseTeams = currentTeams.filter(t => t.id !== teamToKeep.id && t.id !== teamToRemove.id);
            const mergedTeam: Team = {
                ...teamToKeep,
                players: combinedPlayers,
                stats: { p: 0, w: 0, d: 0, l: 0, gs: 0, gc: 0, gd: 0, pts: 0, form: '' }
            };
            baseTeams.push(mergedTeam);

            const finalTeams = calculateStandings(baseTeams, updatedResults, updatedFixtures);
            transaction.update(docRef, removeUndefinedProps({ 
                teams: finalTeams, 
                fixtures: updatedFixtures, 
                results: updatedResults 
            }));
        });
        
        alert('Teams merged successfully!');
        setMergeConfirmation(null);
        setPrimaryTeamId(null);
        setSelected([]);
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
        <p className="text-sm text-gray-600 mb-6">Consolidate two team records into one, preserving players and match history.</p>

        <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Target Competition</label>
            <select
                value={selectedCompId}
                onChange={(e) => handleCompChange(e.target.value)}
                className="block w-full max-w-sm px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500"
                disabled={loading || !!mergeConfirmation}
            >
                {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : mergeConfirmation ? (
             <div className="animate-fade-in p-6 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
                <h4 className="text-lg font-bold text-blue-800">Confirm Technical Merge</h4>
                <div className="my-6 flex items-center justify-center gap-4">
                    <span className="font-bold text-gray-700">{mergeConfirmation.team1.name}</span>
                    <ArrowRightIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-gray-700">{mergeConfirmation.team2.name}</span>
                </div>
                
                <p className="text-sm text-gray-800 mb-4">Select the profile to retain as primary:</p>
                <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
                    {[mergeConfirmation.team1, mergeConfirmation.team2].map(team => (
                        <label key={team.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${primaryTeamId === team.id ? 'bg-white border-blue-500 shadow-sm' : 'bg-gray-50 border-transparent opacity-70'}`}>
                            <input type="radio" name="primary" checked={primaryTeamId === team.id} onChange={() => setPrimaryTeamId(team.id)} className="h-4 w-4 text-blue-600" />
                            <span className="font-bold text-sm">{team.name} (ID: {team.id})</span>
                        </label>
                    ))}
                </div>
                
                <div className="mt-8 flex justify-center gap-3">
                    <Button onClick={() => setMergeConfirmation(null)} className="bg-gray-200 text-gray-800 h-10">Cancel</Button>
                    <Button onClick={handleConfirmMerge} className="bg-blue-600 text-white h-10 px-8" disabled={submitting}>
                        {submitting ? <Spinner className="w-4 h-4 border-2" /> : 'Confirm Merge'}
                    </Button>
                </div>
            </div>
        ) : (
          <div className="space-y-2">
            <div className="max-h-80 overflow-y-auto border rounded-xl p-2 bg-gray-50">
              {teams.length > 0 ? teams.map(team => (
                <div 
                  key={team.id}
                  onClick={() => handleSelect(team.id)}
                  className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-all ${selected.includes(team.id) ? 'bg-blue-100 border-blue-300' : 'bg-white border-transparent hover:bg-gray-50'} border-2`}
                >
                  <input type="checkbox" checked={selected.includes(team.id)} readOnly className="h-4 w-4 rounded text-blue-600" />
                  <img src={team.crestUrl} alt="" className="w-8 h-8 object-contain" />
                  <span className="font-bold text-sm text-gray-800">{team.name}</span>
                </div>
              )) : <p className="text-center text-gray-500 py-4">No teams found.</p>}
            </div>
            <div className="mt-4 flex justify-between items-center bg-gray-100 p-4 rounded-xl">
              <span className="text-sm font-bold text-gray-600">Selected: {selected.length} / 2</span>
              <Button onClick={handleInitiateMerge} disabled={selected.length !== 2} className="bg-primary text-white h-10 px-6">
                Merge Selected
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MergeTeams;