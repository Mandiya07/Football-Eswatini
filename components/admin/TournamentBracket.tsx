import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Team, Competition } from '../../data/teams';
import { fetchCompetition, addCup, updateCup, deleteCup, handleFirestoreError, fetchAllCompetitions, fetchCups, fetchDirectoryEntries } from '../../services/api';
import { Tournament as DisplayTournament, cupData as localCupData } from '../../data/cups';
import Spinner from '../ui/Spinner';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import TournamentBracketDisplay from '../TournamentBracketDisplay';
import EyeIcon from '../icons/BinocularsIcon';
import EditIcon from '../icons/Edit3Icon';
import TrashIcon from '../icons/TrashIcon';
import XIcon from '../icons/XIcon';
import RefreshIcon from '../icons/RefreshIcon';
import { removeUndefinedProps } from '../../services/utils';

interface AdminBracketMatch {
  id: string;
  round: number;
  matchInRound: number;
  team1Id: number | null;
  team2Id: number | null;
  score1: string;
  score2: string;
  winnerId: number | null;
  nextMatchId: string | null;
  date?: string;
  time?: string;
  venue?: string;
  score1ET?: string; score2ET?: string; score1Pen?: string; score2Pen?: string;
}

interface AdminTournament {
    id?: string;
    name: string;
    rounds: { title: string; matches: AdminBracketMatch[]; }[];
    logoUrl?: string;
}

const MatchCard: React.FC<{
  match: AdminBracketMatch;
  teams: Team[];
  onTeamSelect: (matchId: string, teamSlot: 'team1Id' | 'team2Id', teamId: number | null) => void;
  onScoreChange: (matchId: string, scoreSlot: keyof AdminBracketMatch, value: string) => void;
  onDateTimeChange: (matchId: string, field: 'date' | 'time' | 'venue', value: string) => void;
  onDeclareWinner: (matchId: string) => void;
  onResetWinner: (matchId: string) => void;
}> = ({ match, teams, onTeamSelect, onScoreChange, onDateTimeChange, onDeclareWinner, onResetWinner }) => {
    const team1Id = match.team1Id;
    const team2Id = match.team2Id;
    
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 w-56 text-xs shadow-sm">
            <div className="flex gap-2 mb-2 pb-2 border-b border-gray-50">
                <input type="date" className="text-[10px] p-1 border rounded w-full bg-gray-50" value={match.date || ''} onChange={e => onDateTimeChange(match.id, 'date', e.target.value)} />
                <input type="time" className="text-[10px] p-1 border rounded w-20 text-center bg-gray-50" value={match.time || ''} onChange={e => onDateTimeChange(match.id, 'time', e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <select 
                        value={team1Id || ''} 
                        onChange={e => onTeamSelect(match.id, 'team1Id', parseInt(e.target.value) || null)}
                        className="flex-grow text-[10px] p-1 border rounded bg-white mr-2 truncate"
                    >
                        <option value="">Home Team...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="text" className="w-8 text-center font-bold border rounded p-1" value={match.score1} onChange={e => onScoreChange(match.id, 'score1', e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                    <select 
                        value={team2Id || ''} 
                        onChange={e => onTeamSelect(match.id, 'team2Id', parseInt(e.target.value) || null)}
                        className="flex-grow text-[10px] p-1 border rounded bg-white mr-2 truncate"
                    >
                        <option value="">Away Team...</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <input type="text" className="w-8 text-center font-bold border rounded p-1" value={match.score2} onChange={e => onScoreChange(match.id, 'score2', e.target.value)} />
                </div>
            </div>

            {match.winnerId ? (
                <button onClick={() => onResetWinner(match.id)} className="mt-3 w-full py-1 text-[10px] bg-red-50 text-red-600 rounded flex items-center justify-center gap-1"><RefreshIcon className="w-3 h-3"/> Reset Result</button>
            ) : (team1Id && team2Id) && (
                <button onClick={() => onDeclareWinner(match.id)} className="mt-3 w-full py-1 text-[10px] bg-blue-600 text-white rounded font-bold">Confirm Winner</button>
            )}
        </div>
    );
};

const TournamentBracket: React.FC = () => {
    const [tournament, setTournament] = useState<AdminTournament | null>(null);
    const [existingTournaments, setExistingTournaments] = useState<DisplayTournament[]>([]);
    const [numTeams, setNumTeams] = useState(8);
    const [tournamentName, setTournamentName] = useState('');
    const [allTeams, setAllTeams] = useState<Team[]>([]); 
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [allComps, dbCups] = await Promise.all([fetchAllCompetitions(), fetchCups()]);
            
            // Defensively merge local and DB cups
            const cupsMap = new Map<string, DisplayTournament>();
            localCupData.forEach(c => cupsMap.set(c.id, c));
            if (dbCups && dbCups.length > 0) {
                dbCups.forEach(c => {
                    if (c && c.id) cupsMap.set(c.id, c);
                });
            }
            
            setExistingTournaments(Array.from(cupsMap.values()));
            
            const allTeamsList = Object.values(allComps)
                .flatMap(c => c.teams || [])
                .filter(t => t && t.name)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                
            setAllTeams(allTeamsList);
        } catch (e) {
            console.error("Error loading bracket data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleEditExisting = (t: DisplayTournament) => {
        const adminT: AdminTournament = {
            id: t.id,
            name: t.name,
            logoUrl: t.logoUrl,
            rounds: t.rounds.map((r, rIdx) => ({
                title: r.title,
                matches: r.matches.map(m => {
                    const t1Id = (m.team1 as any)?.id || (m as any).team1Id || null;
                    const t2Id = (m.team2 as any)?.id || (m as any).team2Id || null;
                    
                    return {
                        id: String(m.id),
                        round: rIdx + 1,
                        matchInRound: 0,
                        team1Id: t1Id,
                        team2Id: t2Id,
                        score1: String(m.team1?.score || (m as any).score1 || ''),
                        score2: String(m.team2?.score || (m as any).score2 || ''),
                        winnerId: m.winner === 'team1' ? t1Id : m.winner === 'team2' ? t2Id : ((m as any).winnerId || null),
                        nextMatchId: (m as any).nextMatchId || null,
                        date: m.date, time: m.time, venue: m.venue
                    };
                })
            }))
        };
        setTournament(adminT);
    };

    const handleDeleteTournament = async (id: string) => {
        if (!window.confirm("Delete this bracket?")) return;
        setDeletingId(id);
        try {
            await deleteCup(id);
            setExistingTournaments(prev => prev.filter(t => t.id !== id));
        } finally {
            setDeletingId(null);
        }
    };

    const generateBracket = async () => {
        if (!tournamentName) return alert("Enter tournament name.");
        setLoading(true);
        const rounds = [];
        const roundsCount = Math.log2(numTeams);
        for (let r = 1; r <= roundsCount; r++) {
            const matchesCount = numTeams / Math.pow(2, r);
            const matches: AdminBracketMatch[] = Array.from({ length: matchesCount }, (_, i) => ({
                id: `R${r}-M${i+1}`, round: r, matchInRound: i + 1, team1Id: null, team2Id: null,
                score1: '', score2: '', winnerId: null, nextMatchId: null
            }));
            let title = matchesCount === 1 ? 'Final' : matchesCount === 2 ? 'Semi-Finals' : `Round of ${matchesCount * 2}`;
            rounds.push({ title, matches });
        }
        try {
            const newT = { name: tournamentName, rounds };
            const docRef = await addDoc(collection(db, 'cups'), newT);
            setTournament({ id: docRef.id, ...newT });
            await loadInitialData();
        } finally {
            setLoading(false);
        }
    };

    const updateInDb = async (updated: AdminTournament) => {
        if (!updated.id) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "cups", updated.id), removeUndefinedProps({
                name: updated.name,
                rounds: updated.rounds,
                logoUrl: updated.logoUrl
            }));
        } finally { setSaving(false); }
    };

    const updateStateAndDb = (updater: (prev: AdminTournament) => AdminTournament) => {
        setTournament(prev => {
            if (!prev) return null;
            const updated = updater(prev);
            updateInDb(updated);
            return updated;
        });
    };

    if (loading && existingTournaments.length === 0) return <div className="flex justify-center p-12"><Spinner /></div>;

    return (
        <Card className="shadow-lg overflow-hidden border-0 max-w-full">
            <CardContent className="p-6">
                {!tournament ? (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-bold font-display">Tournament Brackets</h3>
                            <Button onClick={loadInitialData} className="bg-gray-100 text-gray-600 h-9 p-0 w-9 flex items-center justify-center rounded-full hover:bg-gray-200"><RefreshIcon className="w-5 h-5"/></Button>
                        </div>

                        {existingTournaments.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {existingTournaments.map(t => (
                                    <div key={t.id} className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1 border">
                                                <img src={t.logoUrl || 'https://via.placeholder.com/64?text=Cup'} className="max-h-full max-w-full object-contain" alt="" />
                                            </div>
                                            <span className="font-bold text-gray-800">{t.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditExisting(t)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><EditIcon className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteTournament(t.id)} disabled={deletingId === t.id} className="p-2 text-red-600 bg-red-50 rounded-lg">
                                                {deletingId === t.id ? <Spinner className="w-4 h-4" /> : <TrashIcon className="w-4 h-4"/>}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 max-w-md">
                            <h4 className="font-bold mb-4">Create New Bracket</h4>
                            <div className="space-y-4">
                                <input type="text" value={tournamentName} onChange={e => setTournamentName(e.target.value)} placeholder="Tournament Name" className="w-full p-2 border rounded-lg text-sm" />
                                <select value={numTeams} onChange={e => setNumTeams(parseInt(e.target.value))} className="w-full p-2 border rounded-lg text-sm">
                                    <option value={4}>4 Teams (Semi-Finals)</option>
                                    <option value={8}>8 Teams (Quarter-Finals)</option>
                                    <option value={16}>16 Teams (Round of 16)</option>
                                </select>
                                <Button onClick={generateBracket} className="bg-primary text-white w-full h-11">Build Bracket</Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{tournament.name}</h3>
                            <div className="flex gap-2">
                                <span className="text-xs text-gray-400 self-center">{saving ? 'Saving...' : 'All changes saved.'}</span>
                                <Button onClick={() => setTournament(null)} className="bg-gray-200 text-gray-800 h-9">Close Editor</Button>
                            </div>
                        </div>
                        <div className="flex gap-8 overflow-x-auto pb-6">
                            {tournament.rounds.map((round, rIdx) => (
                                <div key={rIdx} className="flex flex-col gap-6 min-w-[14rem]">
                                    <h4 className="text-xs font-black uppercase text-center text-gray-400 tracking-widest">{round.title}</h4>
                                    <div className="flex flex-col justify-around flex-grow gap-4">
                                        {round.matches.map(m => (
                                            <MatchCard 
                                                key={m.id} match={m} teams={allTeams} 
                                                onTeamSelect={(id, slot, tid) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [slot]: tid} : match)}))}))}
                                                onScoreChange={(id, slot, val) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [slot]: val} : match)}))}))}
                                                onDateTimeChange={(id, field, val) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [field]: val} : match)}))}))}
                                                onDeclareWinner={(id) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => {
                                                    if (match.id !== id) return match;
                                                    const s1 = parseInt(match.score1) || 0;
                                                    const s2 = parseInt(match.score2) || 0;
                                                    return {...match, winnerId: s1 >= s2 ? match.team1Id : match.team2Id};
                                                })}))}))}
                                                onResetWinner={(id) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, winnerId: null} : match)}))}))}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TournamentBracket;