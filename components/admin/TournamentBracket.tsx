
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Team, Competition } from '../../data/teams';
import { fetchCompetition, addCup, updateCup, handleFirestoreError, fetchAllCompetitions } from '../../services/api';
import { Tournament as DisplayTournament } from '../../data/cups';
import Spinner from '../ui/Spinner';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import TournamentBracketDisplay from '../TournamentBracketDisplay';
import EyeIcon from '../icons/BinocularsIcon'; // Using Binoculars as Eye/Preview icon

interface BracketMatch {
  id: string;
  round: number;
  matchInRound: number;
  team1Id: number | null;
  team2Id: number | null;
  score1: string;
  score2: string;
  score1ET?: string;
  score2ET?: string;
  score1Pen?: string;
  score2Pen?: string;
  winnerId: number | null;
  nextMatchId: string | null;
  date?: string;
  time?: string;
  venue?: string;
}

// Local Tournament interface matching component logic
interface AdminTournament {
    id?: string;
    name: string;
    rounds: {
        title: string;
        matches: BracketMatch[];
    }[];
    logoUrl?: string;
}

const MatchCard: React.FC<{
  match: BracketMatch;
  teams: Team[];
  assignedTeamIds: Set<number>;
  onTeamSelect: (matchId: string, teamSlot: 'team1Id' | 'team2Id', teamId: number) => void;
  onScoreChange: (matchId: string, scoreSlot: keyof BracketMatch, value: string) => void;
  onDateTimeChange: (matchId: string, field: 'date' | 'time' | 'venue', value: string) => void;
  onDeclareWinner: (matchId: string) => void;
}> = ({ match, teams, assignedTeamIds, onTeamSelect, onScoreChange, onDateTimeChange, onDeclareWinner }) => {
    
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    
    const TeamSlot: React.FC<{ team: Team | undefined; slot: 'team1Id' | 'team2Id' }> = ({ team, slot }) => {
        if (team) {
            const isWinner = match.winnerId === team.id;
            return (
                <div className={`flex items-center gap-2 ${isWinner ? 'font-bold text-green-700' : ''}`}>
                    <img src={team.crestUrl} alt={team.name} className="w-5 h-5 object-contain" />
                    <span className="truncate">{team.name}</span>
                </div>
            );
        }
        if (match.round > 1) {
            return <div className="text-gray-400 italic text-[10px]">Winner of prev match</div>
        }
        return (
            <select
                value=""
                onChange={(e) => onTeamSelect(match.id, slot, parseInt(e.target.value))}
                className="w-full text-[10px] p-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="" disabled>Select Team</option>
                {teams.filter(t => !assignedTeamIds.has(t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
        );
    };

    // Determine if Extra Time inputs should be shown
    const showET = (match.score1 !== '' && match.score2 !== '' && match.score1 === match.score2) || (match.score1ET && match.score1ET !== '') || (match.score2ET && match.score2ET !== '');

    // Determine if Penalty inputs should be shown
    const score1ET = match.score1ET || '';
    const score2ET = match.score2ET || '';
    const showPen = showET && (score1ET !== '' && score2ET !== '' && score1ET === score2ET) || (match.score1Pen && match.score1Pen !== '') || (match.score2Pen && match.score2Pen !== '');

    // Allow declaring winner if scores are different or if manual override is needed (e.g. text score like "2 (4)")
    const canDeclareWinner = team1 && team2 && !match.winnerId && (match.score1 !== '' || match.score2 !== '');

  return (
    <div className="bg-white border rounded-md p-2 w-52 text-xs shadow-sm">
      <div className="flex gap-1 mb-1 pb-1 border-b border-gray-100">
        <input 
            type="date" 
            className="text-[9px] p-1 border rounded w-full text-gray-500" 
            value={match.date || ''} 
            onChange={e => onDateTimeChange(match.id, 'date', e.target.value)} 
        />
        <input 
            type="time" 
            className="text-[9px] p-1 border rounded w-16 text-gray-500 text-center" 
            value={match.time || ''} 
            onChange={e => onDateTimeChange(match.id, 'time', e.target.value)} 
        />
      </div>
      <div className="mb-2 pb-2 border-b border-gray-100">
        <input 
            type="text" 
            className="text-[9px] p-1 border rounded w-full text-gray-500" 
            value={match.venue || ''} 
            onChange={e => onDateTimeChange(match.id, 'venue', e.target.value)} 
            placeholder="Venue"
        />
      </div>

      <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-100">
        <div className="flex-grow overflow-hidden mr-2"><TeamSlot team={team1} slot="team1Id" /></div>
        <input 
            type="text" 
            className="w-8 text-center font-bold border-none bg-gray-50 ml-1"
            value={match.score1}
            onChange={e => onScoreChange(match.id, 'score1', e.target.value)}
            disabled={!team1 || !team2 || !!match.winnerId}
            placeholder="-"
        />
      </div>
       <div className="flex justify-between items-center">
        <div className="flex-grow overflow-hidden mr-2"><TeamSlot team={team2} slot="team2Id" /></div>
        <input 
            type="text" 
            className="w-8 text-center font-bold border-none bg-gray-50 ml-1"
            value={match.score2}
            onChange={e => onScoreChange(match.id, 'score2', e.target.value)}
            disabled={!team1 || !team2 || !!match.winnerId}
            placeholder="-"
        />
      </div>

      {showET && (
          <div className="mt-2 pt-2 border-t border-gray-100 bg-yellow-50 rounded p-1">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Extra Time</span>
              </div>
              <div className="flex justify-end gap-2">
                <input 
                    type="text" className="w-8 text-center text-[10px] border rounded border-gray-300" 
                    value={match.score1ET || ''} onChange={e => onScoreChange(match.id, 'score1ET', e.target.value)} placeholder="AET"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="text" className="w-8 text-center text-[10px] border rounded border-gray-300" 
                    value={match.score2ET || ''} onChange={e => onScoreChange(match.id, 'score2ET', e.target.value)} placeholder="AET"
                />
              </div>
          </div>
      )}

      {showPen && (
          <div className="mt-2 pt-2 border-t border-gray-100 bg-red-50 rounded p-1">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Penalties</span>
              </div>
              <div className="flex justify-end gap-2">
                <input 
                    type="text" className="w-8 text-center text-[10px] border rounded border-gray-300" 
                    value={match.score1Pen || ''} onChange={e => onScoreChange(match.id, 'score1Pen', e.target.value)} placeholder="P"
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="text" className="w-8 text-center text-[10px] border rounded border-gray-300" 
                    value={match.score2Pen || ''} onChange={e => onScoreChange(match.id, 'score2Pen', e.target.value)} placeholder="P"
                />
              </div>
          </div>
      )}

      {canDeclareWinner && (
        <div className="mt-2 pt-2 border-t text-center">
            <Button onClick={() => onDeclareWinner(match.id)} className="bg-blue-600 text-white text-[10px] h-6 px-2 w-full">
                Confirm Winner
            </Button>
        </div>
      )}
    </div>
  );
};


const TournamentBracket: React.FC = () => {
    const [tournament, setTournament] = useState<AdminTournament | null>(null);
    const [numTeams, setNumTeams] = useState(8);
    const [tournamentName, setTournamentName] = useState('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [competitions, setCompetitions] = useState<{id: string, name: string}[]>([]);
    const [selectedSource, setSelectedSource] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
          setLoading(true);
          try {
              // Fetch all competitions to populate the selector
              const allComps = await fetchAllCompetitions();
              const compList = Object.entries(allComps).map(([id, c]) => ({ id, name: c.name }));
              setCompetitions(compList.sort((a, b) => a.name.localeCompare(b.name)));
              
              // Load default teams (MTN Premier League) as a fallback
              const defaultComp = allComps['mtn-premier-league'];
              if (defaultComp?.teams) setTeams(defaultComp.teams);
          } catch (e) {
              console.error("Error loading bracket data", e);
          } finally {
              setLoading(false);
          }
        };
        loadInitialData();
    }, []);

    const handleSourceChange = async (compId: string) => {
        setSelectedSource(compId);
        if (!compId) return;
        
        setLoading(true);
        try {
            const comp = await fetchCompetition(compId);
            if (comp) {
                // Update available teams for the bracket
                if (comp.teams) setTeams(comp.teams);
                // Suggest a name based on the league, if tournament name is empty or generic
                setTournamentName(`${comp.name} Cup`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateTournamentInDb = useCallback(async (updatedTournament: AdminTournament) => {
        if (!updatedTournament.id) return;
        setSaving(true);
        try {
            // Map the local complex BracketMatch structure to a simpler structure for Firestore/Display
            // Note: The display component uses a simplified structure. We save the FULL structure to allow future editing.
            await updateDoc(doc(db, "cups", updatedTournament.id), { rounds: updatedTournament.rounds });
        } catch (error) {
            handleFirestoreError(error, 'update tournament');
        } finally {
            setSaving(false);
        }
    }, []);

    const generateBracket = async () => {
        if (!tournamentName) {
            alert("Please enter a tournament name.");
            return;
        }
        
        setLoading(true);
        const rounds: AdminTournament['rounds'] = [];
        const roundsCount = Math.log2(numTeams);

        for (let r = 1; r <= roundsCount; r++) {
            const matchesInRound = numTeams / Math.pow(2, r);
            const matches: BracketMatch[] = [];
            
            for (let m = 1; m <= matchesInRound; m++) {
                // Calculate next match ID logic
                // Round 1 Match 1 & 2 -> Round 2 Match 1
                // Round 1 Match 3 & 4 -> Round 2 Match 2
                const nextMatchId = r < roundsCount ? `R${r+1}-M${Math.ceil(m/2)}` : null;
                
                matches.push({
                    id: `R${r}-M${m}`, 
                    round: r, 
                    matchInRound: m, 
                    team1Id: null, 
                    team2Id: null,
                    score1: '', 
                    score2: '',
                    score1ET: '',
                    score2ET: '',
                    score1Pen: '',
                    score2Pen: '',
                    winnerId: null, 
                    nextMatchId,
                    date: '',
                    time: '',
                    venue: ''
                });
            }
            
            let title = `Round of ${numTeams / Math.pow(2, r-1)}`;
            if (matchesInRound === 4) title = 'Quarter-Finals';
            if (matchesInRound === 2) title = 'Semi-Finals';
            if (matchesInRound === 1) title = 'Final';

            rounds.push({ title, matches });
        }
        
        const newTournamentData = { 
            name: tournamentName, 
            rounds: rounds,
            logoUrl: 'https://via.placeholder.com/150?text=Cup' // Default placeholder
        };
        
        try {
            const docRef = await addDoc(collection(db, 'cups'), newTournamentData);
            setTournament({ id: docRef.id, ...newTournamentData });
        } catch (error) {
            handleFirestoreError(error, 'create tournament');
        }
        setLoading(false);
    };

    const updateBracket = (updater: (prev: AdminTournament) => AdminTournament) => {
        setTournament(prev => {
            if (!prev) return null;
            const updatedTournament = updater(prev);
            updateTournamentInDb(updatedTournament); // Auto-save changes
            return updatedTournament;
        });
    };
    
    const handleTeamSelect = (matchId: string, teamSlot: 'team1Id' | 'team2Id', teamId: number) => {
        updateBracket(prev => {
            const newRounds = prev.rounds.map(round => ({
                ...round,
                matches: round.matches.map(m => m.id === matchId ? { ...m, [teamSlot]: teamId } : m)
            }));
            return { ...prev, rounds: newRounds };
        });
    };
    
    const handleScoreChange = (matchId: string, scoreSlot: keyof BracketMatch, value: string) => {
        updateBracket(prev => {
             const newRounds = prev.rounds.map(round => ({
                ...round,
                matches: round.matches.map(m => m.id === matchId ? { ...m, [scoreSlot]: value } : m)
            }));
            return { ...prev, rounds: newRounds };
        });
    };

    const handleDateTimeChange = (matchId: string, field: 'date' | 'time' | 'venue', value: string) => {
        updateBracket(prev => {
             const newRounds = prev.rounds.map(round => ({
                ...round,
                matches: round.matches.map(m => m.id === matchId ? { ...m, [field]: value } : m)
            }));
            return { ...prev, rounds: newRounds };
        });
    };

    const handleDeclareWinner = (matchId: string) => {
        if (!tournament) return;
        
        // Find the match across all rounds
        let currentMatch: BracketMatch | undefined;
        tournament.rounds.forEach(r => {
            const m = r.matches.find(match => match.id === matchId);
            if (m) currentMatch = m;
        });

        if (!currentMatch) return;
        
        let winnerId: number | null = null;

        // Logic for numeric score comparison
        const getScore = (s: string) => parseInt(s) || 0;

        // 1. Check Penalties
        if (currentMatch.score1Pen && currentMatch.score2Pen && currentMatch.score1Pen !== '' && currentMatch.score2Pen !== '') {
             const p1 = getScore(currentMatch.score1Pen);
             const p2 = getScore(currentMatch.score2Pen);
             if (p1 > p2) winnerId = currentMatch.team1Id;
             else if (p2 > p1) winnerId = currentMatch.team2Id;
        } 
        // 2. Check Extra Time
        else if (currentMatch.score1ET && currentMatch.score2ET && currentMatch.score1ET !== '' && currentMatch.score2ET !== '') {
             const et1 = getScore(currentMatch.score1ET);
             const et2 = getScore(currentMatch.score2ET);
             if (et1 > et2) winnerId = currentMatch.team1Id;
             else if (et2 > et1) winnerId = currentMatch.team2Id;
        }
        // 3. Check Normal Time
        else if (currentMatch.score1 !== '' && currentMatch.score2 !== '') {
            const s1 = getScore(currentMatch.score1);
            const s2 = getScore(currentMatch.score2);
            if (s1 > s2) winnerId = currentMatch.team1Id;
            else if (s2 > s1) winnerId = currentMatch.team2Id;
        }

        // 4. Fallback: If logic above fails (e.g. complex strings like "2 (4)"), ask user
        if (!winnerId && currentMatch.team1Id && currentMatch.team2Id) {
            // If scores are entered but logic failed (e.g. text scores), prompt for manual selection
            const t1 = teams.find(t => t.id === currentMatch!.team1Id);
            const t2 = teams.find(t => t.id === currentMatch!.team2Id);
            if (t1 && t2) {
                const result = window.confirm(`Auto-calculation unclear. Was ${t1.name} the winner? (Cancel for ${t2.name})`);
                winnerId = result ? t1.id : t2.id;
            }
        }

        if (!winnerId) {
            alert("Cannot declare winner. Please ensure scores are entered.");
            return;
        }

        updateBracket(prev => {
            const newRounds = [...prev.rounds]; // Shallow copy rounds array
            
            // 1. Update current match with winner
            newRounds.forEach((round, rIdx) => {
                round.matches = round.matches.map(m => m.id === matchId ? { ...m, winnerId } : m);
            });

            // 2. Advance winner to next match if exists
            if (currentMatch!.nextMatchId) {
                newRounds.forEach(round => {
                    round.matches = round.matches.map(m => {
                        if (m.id === currentMatch!.nextMatchId) {
                            // Logic to determine if winner goes to slot 1 or 2 based on previous match position
                            // E.g. R1-M1 goes to R2-M1 Slot 1. R1-M2 goes to R2-M1 Slot 2.
                            const isSlot1 = currentMatch!.matchInRound % 2 !== 0; // Odd number match -> Slot 1
                            const slot = isSlot1 ? 'team1Id' : 'team2Id';
                            return { ...m, [slot]: winnerId };
                        }
                        return m;
                    });
                });
            }
            
            return { ...prev, rounds: newRounds };
        });
    };

    // Calculate assigned teams for first round only to prevent duplicates in dropdown
    const assignedTeamIds = new Set<number>();
    if (tournament && tournament.rounds.length > 0) {
        tournament.rounds[0].matches.forEach(m => {
            if (m.team1Id) assignedTeamIds.add(m.team1Id);
            if (m.team2Id) assignedTeamIds.add(m.team2Id);
        });
    }

    const getPreviewTournament = (): DisplayTournament | null => {
        if (!tournament) return null;
        const mappedRounds = tournament.rounds.map(round => ({
            title: round.title,
            matches: round.matches.map(m => ({
                id: m.id,
                team1: {
                    name: teams.find(t => t.id === m.team1Id)?.name || 'TBD',
                    crestUrl: teams.find(t => t.id === m.team1Id)?.crestUrl,
                    score: m.score1 || undefined
                },
                team2: {
                    name: teams.find(t => t.id === m.team2Id)?.name || 'TBD',
                    crestUrl: teams.find(t => t.id === m.team2Id)?.crestUrl,
                    score: m.score2 || undefined
                },
                winner: m.winnerId === m.team1Id ? 'team1' : m.winnerId === m.team2Id ? 'team2' : undefined,
                date: m.date,
                time: m.time,
                venue: m.venue
            }))
        }));
        return {
            id: tournament.id || 'preview',
            name: tournament.name,
            logoUrl: tournament.logoUrl,
            rounds: mappedRounds
        } as DisplayTournament;
    };

    const renderBracket = () => (
        <div className="flex gap-8 overflow-x-auto p-6 bg-gray-100 rounded-lg min-h-[400px]">
            {tournament?.rounds.map((round, i) => (
                <div key={i} className="flex flex-col justify-around flex-shrink-0 w-60 relative">
                    <h4 className="font-bold text-center mb-4 text-sm uppercase tracking-wider text-gray-600 sticky top-0 bg-gray-100 py-2 z-10">
                        {round.title}
                    </h4>
                    {round.matches.map(match => (
                        <div key={match.id} className="mb-4 relative flex justify-center">
                            <MatchCard 
                                match={match} teams={teams} assignedTeamIds={assignedTeamIds}
                                onTeamSelect={handleTeamSelect} onScoreChange={handleScoreChange} onDateTimeChange={handleDateTimeChange} onDeclareWinner={handleDeclareWinner}
                            />
                            {/* Visual connectors could go here with absolute positioning */}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    const previewTournament = getPreviewTournament();

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                 {!tournament ? (
                    <>
                         <h3 className="text-2xl font-bold font-display mb-4">Create New Tournament</h3>
                        <div className="space-y-4 max-w-md bg-gray-50 p-6 rounded-lg border">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source League (Optional)</label>
                                <select 
                                    value={selectedSource} 
                                    onChange={e => handleSourceChange(e.target.value)} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="">-- Select Source --</option>
                                    {competitions.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Selecting a league will load its teams for the bracket.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                                <input 
                                    type="text" 
                                    value={tournamentName} 
                                    onChange={e => setTournamentName(e.target.value)} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    placeholder="e.g. 2024 Knockout Cup"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bracket Size</label>
                                <select 
                                    value={numTeams} 
                                    onChange={e => setNumTeams(parseInt(e.target.value))} 
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value={4}>4 Teams (Semi-Finals)</option>
                                    <option value={8}>8 Teams (Quarter-Finals)</option>
                                    <option value={16}>16 Teams (Round of 16)</option>
                                    <option value={32}>32 Teams (Round of 32)</option>
                                </select>
                            </div>
                            <Button onClick={generateBracket} className="bg-primary text-white hover:bg-primary-dark w-full" disabled={loading}>
                                {loading ? <Spinner className="w-4 h-4" /> : 'Generate Bracket'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <div>
                                <h4 className="text-xl font-bold font-display">{tournament.name}</h4>
                                <p className="text-xs text-gray-600">
                                    {saving ? 'Saving changes...' : 'Changes saved automatically.'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => setShowPreview(!showPreview)} 
                                    className={`text-sm flex items-center gap-2 ${showPreview ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                                >
                                    <EyeIcon className="w-4 h-4" /> {showPreview ? 'Edit Mode' : 'Preview Split Bracket'}
                                </Button>
                                <Button onClick={() => setTournament(null)} className="bg-gray-200 text-gray-800 text-sm">
                                    Close / Create New
                                </Button>
                            </div>
                        </div>
                        {showPreview && previewTournament ? (
                            <div className="border-t pt-4">
                                <TournamentBracketDisplay tournament={previewTournament} />
                            </div>
                        ) : (
                            renderBracket()
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default TournamentBracket;
