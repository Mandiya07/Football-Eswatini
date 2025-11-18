







import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Team, Competition } from '../../data/teams';
import { fetchCompetition, addCup, updateCup, handleFirestoreError } from '../../services/api';
import Spinner from '../ui/Spinner';
// FIX: The imported Tournament type is for display and incompatible with this component's logic.
// It is removed to avoid type conflicts with the locally defined data structures.
// import { Tournament } from '../../data/cups';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface BracketMatch {
  id: string;
  round: number;
  matchInRound: number;
  team1Id: number | null;
  team2Id: number | null;
  score1: string;
  score2: string;
  winnerId: number | null;
  nextMatchId: string | null;
}

// FIX: Define a local Tournament interface that matches this component's data structure and logic.
interface Tournament {
    id: string;
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
  onScoreChange: (matchId: string, scoreSlot: 'score1' | 'score2', value: string) => void;
  onDeclareWinner: (matchId: string) => void;
}> = ({ match, teams, assignedTeamIds, onTeamSelect, onScoreChange, onDeclareWinner }) => {
    
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    
    const TeamSlot: React.FC<{ team: Team | undefined; slot: 'team1Id' | 'team2Id' }> = ({ team, slot }) => {
        if (team) {
            // FIX: Comparison is between two numbers, no type error.
            const isWinner = match.winnerId === team.id;
            return (
                <div className={`flex items-center gap-2 ${isWinner ? 'font-bold' : ''}`}>
                    <img src={team.crestUrl} alt={team.name} className="w-5 h-5 object-contain" />
                    <span className="truncate">{team.name}</span>
                </div>
            );
        }
        if (match.round > 1) {
            return <div className="text-gray-400 italic text-sm">Winner from previous round</div>
        }
        return (
            <select
                value=""
                onChange={(e) => onTeamSelect(match.id, slot, parseInt(e.target.value))}
                className="w-full text-sm p-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="" disabled>Select Team</option>
                {teams.filter(t => !assignedTeamIds.has(t.id)).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
        );
    };

    const canDeclareWinner = team1 && team2 && !match.winnerId && match.score1 !== '' && match.score2 !== '';
    const score1num = parseInt(match.score1);
    const score2num = parseInt(match.score2);

  return (
    <div className="bg-white border rounded-md p-2 w-52 text-xs">
      <div className="flex justify-between items-center mb-1">
        <TeamSlot team={team1} slot="team1Id" />
        <input 
            type="number" 
            min="0"
            className="w-8 text-center font-bold border-b-2"
            value={match.score1}
            onChange={e => onScoreChange(match.id, 'score1', e.target.value)}
            disabled={!team1 || !team2 || !!match.winnerId}
        />
      </div>
       <div className="flex justify-between items-center">
        <TeamSlot team={team2} slot="team2Id" />
        <input 
            type="number" 
            min="0"
            className="w-8 text-center font-bold border-b-2"
            value={match.score2}
            onChange={e => onScoreChange(match.id, 'score2', e.target.value)}
            disabled={!team1 || !team2 || !!match.winnerId}
        />
      </div>
      {canDeclareWinner && (
        <div className="mt-2 pt-2 border-t text-center">
            <Button onClick={() => onDeclareWinner(match.id)} className="bg-blue-600 text-white text-xs h-7">
                Declare {score1num > score2num ? team1!.name.split(' ')[0] : team2!.name.split(' ')[0]} as Winner
            </Button>
        </div>
      )}
    </div>
  );
};


const TournamentBracket: React.FC = () => {
    // FIX: Use the locally defined Tournament type which matches the component's logic.
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [numTeams, setNumTeams] = useState(8);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeams = async () => {
          setLoading(true);
          const data = await fetchCompetition('mtn-premier-league');
          if (data?.teams) setTeams(data.teams);
          setLoading(false);
        };
        loadTeams();
    }, []);

    // FIX: Update parameter to use the local Tournament type.
    const updateTournamentInDb = useCallback(async (updatedTournament: Tournament) => {
        if (!updatedTournament.id) return;
        try {
            await updateDoc(doc(db, "cups", updatedTournament.id), { rounds: updatedTournament.rounds });
        } catch (error) {
            handleFirestoreError(error, 'update tournament');
        }
    }, []);

    const generateBracket = async () => {
        const name = window.prompt("Enter tournament name:");
        if (!name) return;
        
        setLoading(true);
        const matches: BracketMatch[] = [];
        const roundsCount = Math.log2(numTeams);

        for (let r = 1; r <= roundsCount; r++) {
            const matchesInRound = numTeams / Math.pow(2, r);
            for (let m = 1; m <= matchesInRound; m++) {
                matches.push({
                    id: `R${r}-M${m}`, round: r, matchInRound: m, team1Id: null, team2Id: null,
                    score1: '', score2: '', winnerId: null, nextMatchId: r < roundsCount ? `R${r+1}-M${Math.ceil(m/2)}` : null,
                });
            }
        }
        
        const newTournamentData = { name, rounds: [{ title: 'Bracket', matches }] }; // Simplified structure for now
        
        try {
            const docRef = await addDoc(collection(db, 'cups'), newTournamentData);
            // FIX: The object being created now correctly matches the local Tournament state type.
            setTournament({ id: docRef.id, ...newTournamentData });
        } catch (error) {
            handleFirestoreError(error, 'create tournament');
        }
        setLoading(false);
    };

    const updateBracket = (updater: (prev: BracketMatch[]) => BracketMatch[]) => {
        // FIX: The updater function now correctly operates on and returns types that match the local Tournament state.
        setTournament(prev => {
            if (!prev) return null;
            const newMatches = updater(prev.rounds[0].matches);
            const updatedTournament = { ...prev, rounds: [{...prev.rounds[0], matches: newMatches}]};
            updateTournamentInDb(updatedTournament); // Async save
            return updatedTournament;
        });
    };
    
    const handleTeamSelect = (matchId: string, teamSlot: 'team1Id' | 'team2Id', teamId: number) => {
        updateBracket(prev => prev.map(m => m.id === matchId ? { ...m, [teamSlot]: teamId } : m));
    };
    
    const handleScoreChange = (matchId: string, scoreSlot: 'score1' | 'score2', value: string) => {
        updateBracket(prev => prev.map(m => m.id === matchId ? { ...m, [scoreSlot]: value } : m));
    };

    const handleDeclareWinner = (matchId: string) => {
        const currentMatch = tournament?.rounds[0].matches.find(m => m.id === matchId);
        if (!currentMatch) return;
        
        const score1 = parseInt(currentMatch.score1);
        const score2 = parseInt(currentMatch.score2);
        // FIX: Accessing team1Id and team2Id is now valid on the local BracketMatch type.
        const winnerId = score1 > score2 ? currentMatch.team1Id : currentMatch.team2Id;

        if (!winnerId) return;

        updateBracket(prev => {
            let nextMatches = [...prev];
            // Set winner on current match
            nextMatches = nextMatches.map(m => m.id === matchId ? { ...m, winnerId } : m);
            // Advance winner to next match
            // FIX: Accessing nextMatchId is now valid.
            if (currentMatch.nextMatchId) {
                const nextMatchIndex = nextMatches.findIndex(m => m.id === currentMatch.nextMatchId);
                if (nextMatchIndex !== -1) {
                    const slot = nextMatches[nextMatchIndex].team1Id === null ? 'team1Id' : 'team2Id';
                    nextMatches[nextMatchIndex] = { ...nextMatches[nextMatchIndex], [slot]: winnerId };
                }
            }
            return nextMatches;
        });
    };

    // FIX: Accessing team1Id and team2Id is now valid.
    const assignedTeamIds = new Set(tournament?.rounds[0].matches.flatMap(m => [m.team1Id, m.team2Id]).filter(Boolean) as number[]);
    const bracketRounds = tournament ? Array.from({ length: Math.log2(numTeams) }, (_, i) => i + 1) : [];

    const renderBracket = () => (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide p-4 bg-gray-100 rounded-lg">
            {bracketRounds.map(roundNum => (
                <div key={roundNum} className="bracket-round flex-shrink-0">
                    <h4 className="font-bold text-center mb-4">
                        {roundNum === bracketRounds.length ? 'Final' : `Round ${roundNum}`}
                    </h4>
                    {/* FIX: Accessing round property is now valid. */}
                    {tournament!.rounds[0].matches.filter(m => m.round === roundNum).map(match => (
                        <div key={match.id} className="bracket-match-container">
                            {/* FIX: The `match` prop now correctly matches the type expected by MatchCard. */}
                            <MatchCard 
                                match={match} teams={teams} assignedTeamIds={assignedTeamIds}
                                onTeamSelect={handleTeamSelect} onScoreChange={handleScoreChange} onDeclareWinner={handleDeclareWinner}
                            />
                            {/* FIX: Accessing nextMatchId is now valid. */}
                            {match.nextMatchId && <div className="bracket-connector"></div>}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                 {!tournament ? (
                    <>
                         <h3 className="text-2xl font-bold font-display mb-1">Tournament Bracket</h3>
                        <p className="text-sm text-gray-600 mb-6">Setup a new tournament bracket.</p>
                        <div className="space-y-4 max-w-md">
                            <select value={numTeams} onChange={e => setNumTeams(parseInt(e.target.value))} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option value={4}>4 Teams</option><option value={8}>8 Teams</option><option value={16}>16 Teams</option><option value={32}>32 Teams</option>
                            </select>
                            <Button onClick={generateBracket} className="bg-primary text-white hover:bg-primary-dark" disabled={loading}>
                                {loading ? <Spinner className="w-4 h-4" /> : 'Create New Tournament'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="text-xl font-bold font-display">{tournament.name}</h4>
                                <p className="text-sm text-gray-600">{numTeams}-Team Single Elimination</p>
                            </div>
                            <Button onClick={() => setTournament(null)} className="bg-gray-200 text-gray-800">Reset</Button>
                        </div>
                        {renderBracket()}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default TournamentBracket;
