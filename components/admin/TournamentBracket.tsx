
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Team } from '../../data/teams';
import { fetchAllCompetitions, fetchCups, deleteCup, handleFirestoreError, fetchCategories, Category } from '../../services/api';
import { Tournament as DisplayTournament, cupData as localCupData } from '../../data/cups';
import Spinner from '../ui/Spinner';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import EditIcon from '../icons/Edit3Icon';
import TrashIcon from '../icons/TrashIcon';
import RefreshIcon from '../icons/RefreshIcon';
import PencilIcon from '../icons/PencilIcon';
import UsersIcon from '../icons/UsersIcon';
import { removeUndefinedProps } from '../../services/utils';

interface AdminBracketMatch {
  id: string;
  round: number;
  matchInRound: number;
  team1Id: number | null;
  team2Id: number | null;
  team1Name?: string;
  team2Name?: string;
  team1Mode?: 'id' | 'name';
  team2Mode?: 'id' | 'name';
  score1: string;
  score2: string;
  winner: 'team1' | 'team2' | null; // Slot-based winner for UI consistency
  nextMatchId: string | null;
  date?: string;
  time?: string;
  venue?: string;
}

interface AdminTournament {
    id?: string;
    name: string;
    rounds: { title: string; matches: AdminBracketMatch[]; }[];
    logoUrl?: string;
    categoryId?: string;
    type?: 'bracket' | 'league';
}

const MatchCard: React.FC<{
  match: AdminBracketMatch;
  teams: Team[];
  onTeamSelect: (matchId: string, teamSlot: 'team1' | 'team2', value: { id: number | null, name: string | undefined, mode: 'id' | 'name' }) => void;
  onScoreChange: (matchId: string, scoreSlot: 'score1' | 'score2', value: string) => void;
  onDateTimeChange: (matchId: string, field: 'date' | 'time' | 'venue', value: string) => void;
  onDeclareWinner: (matchId: string) => void;
  onResetWinner: (matchId: string) => void;
}> = ({ match, teams, onTeamSelect, onScoreChange, onDateTimeChange, onDeclareWinner, onResetWinner }) => {
    const renderTeamSlot = (slot: 'team1' | 'team2') => {
        const idKey = slot === 'team1' ? 'team1Id' : 'team2Id';
        const nameKey = slot === 'team1' ? 'team1Name' : 'team2Name';
        const modeKey = slot === 'team1' ? 'team1Mode' : 'team2Mode';
        
        const mode = match[modeKey] || 'id';
        const idValue = match[idKey];
        const nameValue = match[nameKey];

        // Find the index of the currently selected team to use as the value
        // This prevents the "Bundesliga" bug where multiple teams have the same ID
        const selectedIndex = teams.findIndex(t => t.name === nameValue);

        return (
            <div className="flex items-center gap-1 group/slot">
                {mode === 'id' ? (
                    <select 
                        value={selectedIndex !== -1 ? selectedIndex : ''} 
                        onChange={e => {
                            const idx = parseInt(e.target.value);
                            const team = teams[idx];
                            if (team) {
                                onTeamSelect(match.id, slot, { 
                                    id: team.id, 
                                    name: team.name, 
                                    mode: 'id' 
                                });
                            } else {
                                onTeamSelect(match.id, slot, { id: null, name: undefined, mode: 'id' });
                            }
                        }}
                        className="flex-grow text-[10px] p-1 border rounded bg-white truncate"
                    >
                        <option value="">Select Team...</option>
                        {teams.map((t, idx) => (
                            <option key={`${t.id}-${idx}`} value={idx}>{t.name}</option>
                        ))}
                    </select>
                ) : (
                    <input 
                        type="text"
                        value={nameValue || ''}
                        onChange={e => onTeamSelect(match.id, slot, { id: null, name: e.target.value, mode: 'name' })}
                        placeholder="Custom Name..."
                        className="flex-grow text-[10px] p-1 border rounded bg-white truncate font-bold"
                    />
                )}
                <button 
                    type="button"
                    onClick={() => onTeamSelect(match.id, slot, { 
                        id: null, 
                        name: mode === 'id' ? '' : undefined, 
                        mode: mode === 'id' ? 'name' : 'id' 
                    })}
                    className={`p-1 rounded border transition-all ${mode === 'name' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-blue-600 bg-gray-50 border-transparent'}`}
                    title={mode === 'id' ? "Enter Custom Name" : "Select From Team List"}
                >
                    {mode === 'id' ? <PencilIcon className="w-3 h-3" /> : <UsersIcon className="w-3 h-3" />}
                </button>
                <input 
                    type="text" 
                    className="w-8 text-center font-bold border rounded p-1" 
                    value={slot === 'team1' ? match.score1 : match.score2} 
                    onChange={e => onScoreChange(match.id, slot === 'team1' ? 'score1' : 'score2', e.target.value)} 
                />
            </div>
        );
    };
    
    return (
        <div className={`bg-white border-2 rounded-xl p-3 w-64 text-xs shadow-sm transition-colors ${match.winner ? 'border-green-200 ring-2 ring-green-50' : 'border-gray-200'}`}>
            <div className="flex gap-2 mb-2 pb-2 border-b border-gray-50">
                <input type="date" className="text-[10px] p-1 border rounded w-full bg-gray-50" value={match.date || ''} onChange={e => onDateTimeChange(match.id, 'date', e.target.value)} />
                <input type="time" className="text-[10px] p-1 border rounded w-20 text-center bg-gray-50" value={match.time || ''} onChange={e => onDateTimeChange(match.id, 'time', e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <div className={`rounded-md p-0.5 ${match.winner === 'team1' ? 'bg-green-50 ring-1 ring-green-200' : ''}`}>
                    {renderTeamSlot('team1')}
                </div>
                <div className={`rounded-md p-0.5 ${match.winner === 'team2' ? 'bg-green-50 ring-1 ring-green-200' : ''}`}>
                    {renderTeamSlot('team2')}
                </div>
            </div>

            {match.winner ? (
                <button onClick={() => onResetWinner(match.id)} className="mt-3 w-full py-1 text-[10px] bg-red-50 text-red-600 rounded flex items-center justify-center gap-1 hover:bg-red-100 transition-colors"><RefreshIcon className="w-3 h-3"/> Reset Result</button>
            ) : ( (match.team1Id || match.team1Name) && (match.team2Id || match.team2Name) ) && (
                <button onClick={() => onDeclareWinner(match.id)} className="mt-3 w-full py-1.5 text-[10px] bg-blue-600 text-white rounded font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all">Confirm Winner</button>
            )}
        </div>
    );
};

const TournamentBracket: React.FC = () => {
    const [tournament, setTournament] = useState<AdminTournament | null>(null);
    const [existingTournaments, setExistingTournaments] = useState<DisplayTournament[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [numTeams, setNumTeams] = useState(8);
    const [tournamentName, setTournamentName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [tournamentType, setTournamentType] = useState<'bracket' | 'league'>('bracket');
    const [allTeams, setAllTeams] = useState<Team[]>([]); 
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [allComps, dbCups, cats] = await Promise.all([
                fetchAllCompetitions(), 
                fetchCups(),
                fetchCategories()
            ]);
            setCategories(cats);
            const cupsMap = new Map<string, DisplayTournament>();
            localCupData.forEach(cup => cupsMap.set(cup.id, cup));
            if (dbCups && dbCups.length > 0) {
                dbCups.forEach(c => {
                    if (c && c.id) cupsMap.set(c.id, c);
                });
            }
            setExistingTournaments(Array.from(cupsMap.values()));
            
            // Collect teams and sort them
            const allTeamsList = Object.values(allComps)
                .flatMap(c => c.teams || [])
                .filter(t => t && t.name)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            // Deduplicate teams by name to prevent multiple entries for the same club in the dropdown
            const uniqueTeams = Array.from(new Map(allTeamsList.map(t => [t.name, t])).values());
            
            setAllTeams(uniqueTeams);
        } catch (e) {
            console.error(e);
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
            logoUrl: (t as any).logoUrl,
            categoryId: (t as any).categoryId || '',
            type: (t as any).type || 'bracket',
            rounds: t.rounds.map((r, rIdx) => ({
                title: r.title,
                matches: r.matches.map(m => {
                    const mAny = m as any;
                    const t1Id = m.team1?.id || mAny.team1Id || null;
                    const t2Id = m.team2?.id || mAny.team2Id || null;
                    const t1Name = mAny.team1Name || (m.team1?.id === undefined ? m.team1?.name : undefined);
                    const t2Name = mAny.team2Name || (m.team2?.id === undefined ? m.team2?.name : undefined);
                    
                    return {
                        id: String(m.id),
                        round: rIdx + 1,
                        matchInRound: 0,
                        team1Id: t1Id,
                        team2Id: t2Id,
                        team1Name: t1Name,
                        team2Name: t2Name,
                        team1Mode: t1Name ? 'name' : 'id',
                        team2Mode: t2Name ? 'name' : 'id',
                        score1: String(mAny.score1 || m.team1?.score || ''),
                        score2: String(mAny.score2 || m.team2?.score || ''),
                        winner: m.winner || null,
                        nextMatchId: mAny.nextMatchId || null,
                        date: m.date, time: m.time, venue: m.venue
                    };
                })
            }))
        };
        setTournament(adminT);
    };

    const handleDeleteTournament = async (id: string) => {
        if (!window.confirm("Delete this tournament structure?")) return;
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
                score1: '', score2: '', winner: null, nextMatchId: null
            }));
            let title = matchesCount === 1 ? 'Final' : matchesCount === 2 ? 'Semi-Finals' : `Round of ${matchesCount * 2}`;
            rounds.push({ title, matches });
        }
        try {
            const newT = { 
                name: tournamentName, 
                rounds, 
                categoryId: selectedCategory,
                type: tournamentType 
            };
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
            const cleanedRounds = updated.rounds.map(r => ({
                ...r,
                matches: r.matches.map(m => {
                    const cleaned = { ...m };
                    return removeUndefinedProps(cleaned);
                })
            }));

            await updateDoc(doc(db, "cups", updated.id), {
                name: updated.name,
                rounds: cleanedRounds,
                logoUrl: updated.logoUrl,
                categoryId: updated.categoryId,
                type: updated.type
            });
        } catch (err) {
            console.error("Save failed:", err);
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
        <div className="max-w-full overflow-hidden">
            <Card className="shadow-lg overflow-hidden border-0 max-w-full">
                <CardContent className="p-6">
                    {!tournament ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold font-display">Tournament Builder</h3>
                                <Button onClick={loadInitialData} className="bg-gray-100 text-gray-600 h-9 p-0 w-9 flex items-center justify-center rounded-full hover:bg-gray-200"><RefreshIcon className="w-5 h-5"/></Button>
                            </div>

                            {existingTournaments.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {existingTournaments.map(t => (
                                        <div key={t.id} className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1 border">
                                                    <img src={(t as any).logoUrl || 'https://via.placeholder.com/64?text=Cup'} className="max-h-full max-w-full object-contain" alt="" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-800 block">{t.name}</span>
                                                    <span className="text-[10px] uppercase font-black text-blue-500">{(t as any).type || 'Bracket'}</span>
                                                </div>
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
                                <h4 className="font-bold mb-4">Initialize New Competition</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tournament Name</label>
                                        <input type="text" value={tournamentName} onChange={e => setTournamentName(e.target.value)} placeholder="e.g. Easter Knockout" className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Category</label>
                                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border rounded-lg text-sm">
                                            <option value="">-- No Category --</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Format</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setTournamentType('bracket')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${tournamentType === 'bracket' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}>Bracket</button>
                                            <button onClick={() => setTournamentType('league')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${tournamentType === 'league' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}>Fixture/Result</button>
                                        </div>
                                    </div>
                                    {tournamentType === 'bracket' && (
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Starting Size</label>
                                            <select value={numTeams} onChange={e => setNumTeams(parseInt(e.target.value))} className="w-full p-2 border rounded-lg text-sm">
                                                <option value={4}>4 Teams (Semi-Finals)</option>
                                                <option value={8}>8 Teams (Quarter-Finals)</option>
                                                <option value={16}>16 Teams (Round of 16)</option>
                                                <option value={32}>32 Teams (Last 32)</option>
                                            </select>
                                        </div>
                                    )}
                                    <Button onClick={generateBracket} className="bg-primary text-white w-full h-11 font-bold uppercase tracking-widest shadow-xl">Build System</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">{tournament.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <select 
                                            value={tournament.categoryId || ''} 
                                            onChange={e => updateStateAndDb(prev => ({...prev, categoryId: e.target.value}))}
                                            className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border-none outline-none"
                                        >
                                            <option value="">Uncategorized</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-xs text-gray-400 self-center font-bold">{saving ? 'Syncing...' : 'Saved'}</span>
                                    <Button onClick={() => setTournament(null)} className="bg-gray-200 text-gray-800 h-9 font-bold px-4">Exit Editor</Button>
                                </div>
                            </div>
                            
                            {tournament.type === 'league' ? (
                                <div className="p-8 border-2 border-dashed rounded-[2rem] text-center bg-gray-50">
                                    <p className="text-gray-500 italic mb-4">League format uses standard match recording tools. Please use "Manage Matches" or "Submit Results" to populate data for this competition.</p>
                                    <Button onClick={() => setTournament(null)} className="bg-primary text-white">Go to Match Management</Button>
                                </div>
                            ) : (
                                <div className="flex gap-8 overflow-x-auto pb-6 custom-scrollbar">
                                    {tournament.rounds.map((round, rIdx) => (
                                        <div key={rIdx} className="flex flex-col gap-6 min-w-[17rem]">
                                            <h4 className="text-xs font-black uppercase text-center text-gray-400 tracking-widest">{round.title}</h4>
                                            <div className="flex flex-col justify-around flex-grow gap-4">
                                                {round.matches.map(m => (
                                                    <MatchCard 
                                                        key={m.id} match={m} teams={allTeams} 
                                                        onTeamSelect={(id, slot, data) => updateStateAndDb(prev => ({
                                                            ...prev, 
                                                            rounds: prev.rounds.map(r => ({
                                                                ...r, 
                                                                matches: r.matches.map(match => match.id === id ? {
                                                                    ...match, 
                                                                    [`${slot}Id`]: data.id,
                                                                    [`${slot}Name`]: data.name,
                                                                    [`${slot}Mode`]: data.mode,
                                                                    winner: null 
                                                                } : match)
                                                            }))
                                                        }))}
                                                        onScoreChange={(id, slot, val) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [slot]: val} : match)}))}))}
                                                        onDateTimeChange={(id, field, val) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [field]: val} : match)}))}))}
                                                        onDeclareWinner={(id) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => {
                                                            if (match.id !== id) return match;
                                                            const s1 = parseInt(match.score1) || 0;
                                                            const s2 = parseInt(match.score2) || 0;
                                                            return { ...match, winner: s1 >= s2 ? 'team1' : 'team2' };
                                                        })}))}))}
                                                        onResetWinner={(id) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => id === match.id ? {...match, winner: null} : match)}))}))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TournamentBracket;
