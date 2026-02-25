
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Team } from '../../data/teams';
import { fetchAllCompetitions, listenToCups, deleteCup, handleFirestoreError, fetchCategories, Category } from '../../services/api';
import { Tournament as DisplayTournament, CupHubSlot } from '../../data/cups';
import Spinner from '../ui/Spinner';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import TrashIcon from '../icons/TrashIcon';
import RefreshIcon from '../icons/RefreshIcon';
import PencilIcon from '../icons/PencilIcon';
import UsersIcon from '../icons/UsersIcon';
import ImageIcon from '../icons/ImageIcon';
import TrophyIcon from '../icons/TrophyIcon';
import { removeUndefinedProps, compressImage, parseScore } from '../../services/utils';
import CheckIcon from '../icons/CheckIcon';
import GlobeIcon from '../icons/GlobeIcon';
import ArrowRightIcon from '../icons/ArrowRightIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';

interface AdminBracketMatch {
  id: string;
  round: number;
  matchInRound: number;
  team1Id: number | null;
  team2Id: number | null;
  team1Name?: string;
  team2Name?: string;
  team1Crest?: string;
  team2Crest?: string;
  team1Mode?: 'id' | 'name';
  team2Mode?: 'id' | 'name';
  score1: string;
  score2: string;
  winner: 'team1' | 'team2' | null; 
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
    hubSlot?: CupHubSlot;
}

const MatchCard: React.FC<{
  match: AdminBracketMatch;
  teams: Team[];
  onTeamSelect: (matchId: string, teamSlot: 'team1' | 'team2', value: { id: number | null, name: string | undefined, mode: 'id' | 'name', crestUrl: string | undefined }) => void;
  onScoreChange: (matchId: string, scoreSlot: 'score1' | 'score2', value: string) => void;
  onDateTimeChange: (matchId: string, field: 'date' | 'time' | 'venue', value: string) => void;
  onDeclareWinner: (matchId: string) => void;
  onResetWinner: (matchId: string) => void;
  onCrestUpload: (matchId: string, slot: 'team1' | 'team2', base64: string) => void;
}> = ({ match, teams, onTeamSelect, onScoreChange, onDateTimeChange, onDeclareWinner, onResetWinner, onCrestUpload }) => {
    
    const handleCrestFileChange = async (e: React.ChangeEvent<HTMLInputElement>, slot: 'team1' | 'team2') => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0], 120, 0.6);
                onCrestUpload(match.id, slot, base64);
            } catch (err) {
                console.error("Crest upload failed", err);
            }
        }
    };

    const renderTeamSlot = (slot: 'team1' | 'team2') => {
        const nameKey = slot === 'team1' ? 'team1Name' : 'team2Name';
        const modeKey = slot === 'team1' ? 'team1Mode' : 'team2Mode';
        const crestKey = slot === 'team1' ? 'team1Crest' : 'team2Crest';
        
        const mode = match[modeKey] || 'id';
        const nameValue = match[nameKey];
        const crestValue = match[crestKey];

        const selectedIndex = teams.findIndex(t => t.name === nameValue);

        return (
            <div className="flex items-center gap-1 group/slot">
                <label className="cursor-pointer group/crest relative flex-shrink-0" title="Click to upload custom crest">
                    {crestValue ? (
                        <img src={crestValue} className="w-6 h-6 object-contain bg-white rounded shadow-sm border border-gray-100 group-hover/crest:ring-2 ring-blue-400 transition-all" alt="" />
                    ) : (
                        <div className="w-6 h-6 rounded bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center group-hover/crest:border-blue-400 transition-colors">
                            <ImageIcon className="w-3 h-3 text-gray-400" />
                        </div>
                    )}
                    <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleCrestFileChange(e, slot)} 
                    />
                </label>

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
                                    mode: 'id',
                                    crestUrl: team.crestUrl
                                });
                            } else {
                                onTeamSelect(match.id, slot, { id: null, name: undefined, mode: 'id', crestUrl: undefined });
                            }
                        }}
                        className="flex-grow text-[9px] p-0.5 border rounded bg-white truncate h-6"
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
                        onChange={e => onTeamSelect(match.id, slot, { id: null, name: e.target.value, mode: 'name', crestUrl: crestValue })}
                        placeholder="Name..."
                        className="flex-grow text-[9px] p-0.5 border rounded bg-white truncate font-bold h-6"
                    />
                )}
                <button 
                    type="button"
                    onClick={() => onTeamSelect(match.id, slot, { 
                        id: null, 
                        name: mode === 'id' ? '' : undefined, 
                        mode: mode === 'id' ? 'name' : 'id',
                        crestUrl: crestValue
                    })}
                    className={`p-0.5 rounded border transition-all ${mode === 'name' ? 'bg-blue-600 text-white border-blue-700' : 'text-gray-400 hover:text-blue-600 bg-gray-50 border-transparent'}`}
                    title={mode === 'id' ? "Enter Custom Name" : "Select From Team List"}
                >
                    {mode === 'id' ? <PencilIcon className="w-2.5 h-2.5" /> : <UsersIcon className="w-2.5 h-2.5" />}
                </button>
                <input 
                    type="text" 
                    className="w-7 text-center font-bold border rounded p-0.5 text-[10px]" 
                    value={slot === 'team1' ? match.score1 : match.score2} 
                    onChange={e => onScoreChange(match.id, slot === 'team1' ? 'score1' : 'score2', e.target.value)} 
                />
            </div>
        );
    };
    
    return (
        <div className={`bg-white border rounded-lg p-2 w-56 text-[10px] shadow-sm transition-colors ${match.winner ? 'border-green-200 ring-2 ring-green-50' : 'border-gray-200'}`}>
            <div className="space-y-1 mb-1.5 pb-1.5 border-b border-gray-50">
                <div className="flex gap-1">
                    <input type="date" className="text-[9px] p-0.5 border rounded w-full bg-gray-50" value={match.date || ''} onChange={e => onDateTimeChange(match.id, 'date', e.target.value)} />
                    <input type="time" className="text-[9px] p-0.5 border rounded w-14 text-center bg-gray-50" value={match.time || ''} onChange={e => onDateTimeChange(match.id, 'time', e.target.value)} />
                </div>
                <input 
                    type="text" 
                    className="text-[9px] p-0.5 border rounded w-full bg-gray-50" 
                    value={match.venue || ''} 
                    onChange={e => onDateTimeChange(match.id, 'venue', e.target.value)} 
                    placeholder="Venue"
                />
            </div>
            
            <div className="space-y-1">
                <div className={`rounded p-0.5 ${match.winner === 'team1' ? 'bg-green-50 ring-1 ring-green-200' : ''}`}>
                    {renderTeamSlot('team1')}
                </div>
                <div className={`rounded p-0.5 ${match.winner === 'team2' ? 'bg-green-50 ring-1 ring-green-200' : ''}`}>
                    {renderTeamSlot('team2')}
                </div>
            </div>

            {match.winner ? (
                <button onClick={() => onResetWinner(match.id)} className="mt-2 w-full py-0.5 text-[9px] bg-red-50 text-red-600 rounded flex items-center justify-center gap-1 hover:bg-red-100 transition-colors"><RefreshIcon className="w-2.5 h-2.5"/> Reset Result</button>
            ) : ( (match.team1Id || match.team1Name) && (match.team2Id || match.team2Name) ) && (
                <button onClick={() => onDeclareWinner(match.id)} className="mt-2 w-full py-1 text-[9px] bg-blue-600 text-white rounded font-black uppercase tracking-widest shadow hover:bg-blue-700 transition-all">Set Winner</button>
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
    const [selectedHubSlot, setSelectedHubSlot] = useState<CupHubSlot | ''>('');
    const [newTournamentLogo, setNewTournamentLogo] = useState('');
    const [tournamentType, setTournamentType] = useState<'bracket' | 'league'>('bracket');
    const [allTeams, setAllTeams] = useState<Team[]>([]); 
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isRenaming, setIsRenaming] = useState(false);
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [allComps, cats] = await Promise.all([
                fetchAllCompetitions(), 
                fetchCategories()
            ]);
            setCategories(cats);
            
            const allTeamsList = Object.values(allComps)
                .flatMap(c => c.teams || [])
                .filter(t => t && t.name)
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            const uniqueTeams = Array.from(new Map(allTeamsList.map(t => [t.name, t])).values());
            setAllTeams(uniqueTeams);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let unsubscribeCups: (() => void) | undefined;
        
        loadInitialData();
        
        unsubscribeCups = listenToCups((dbCups) => {
            setExistingTournaments(dbCups || []);
        });

        return () => {
            if (unsubscribeCups) unsubscribeCups();
        };
    }, [loadInitialData]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current && latestTournamentRef.current) {
                clearTimeout(saveTimeoutRef.current);
                updateInDb(latestTournamentRef.current);
            }
        };
    }, []);

    const updateInDb = async (updated: AdminTournament) => {
        if (!updated.id) return;
        setSaving(true);
        try {
            const cleanedRounds = updated.rounds.map(r => ({
                ...r,
                matches: r.matches.map(m => removeUndefinedProps({ ...m }))
            }));

            const docRef = doc(db, "cups", updated.id);
            await setDoc(docRef, {
                id: updated.id,
                name: updated.name,
                rounds: cleanedRounds,
                logoUrl: updated.logoUrl || null,
                categoryId: updated.categoryId || null,
                type: updated.type || 'bracket',
                hubSlot: updated.hubSlot || null
            }, { merge: true });
        } catch (err) {
            console.error("Save failed:", err);
            handleFirestoreError(err, 'update bracket in db');
        } finally { 
            setSaving(false); 
        }
    };

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestTournamentRef = useRef<AdminTournament | null>(null);

    const updateStateAndDb = (updater: (prev: AdminTournament) => AdminTournament) => {
        setTournament(prev => {
            if (!prev) return prev;
            const updated = updater(prev);
            latestTournamentRef.current = updated;
            return updated;
        });
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            if (latestTournamentRef.current) {
                updateInDb(latestTournamentRef.current);
            }
        }, 1000);
    };

    const handleTournamentLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNewForm: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0], 400, 0.7);
                if (isNewForm) {
                    setNewTournamentLogo(base64);
                } else if (tournament) {
                    updateStateAndDb(prev => ({ ...prev, logoUrl: base64 }));
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleEditExisting = (t: DisplayTournament) => {
        const adminT: AdminTournament = {
            id: t.id,
            name: t.name,
            logoUrl: t.logoUrl,
            categoryId: (t as any).categoryId || '',
            type: (t as any).type || 'bracket',
            hubSlot: t.hubSlot,
            rounds: t.rounds.map((r, rIdx) => ({
                title: r.title,
                matches: r.matches.map(m => {
                    const mAny = m as any;
                    const t1Id = m.team1?.id || mAny.team1Id || null;
                    const t2Id = m.team2?.id || mAny.team2Id || null;
                    const t1Name = mAny.team1Name || m.team1?.name || (t1Id ? allTeams.find(at => at.id === t1Id)?.name : undefined);
                    const t2Name = mAny.team2Name || m.team2?.name || (t2Id ? allTeams.find(at => at.id === t2Id)?.name : undefined);
                    
                    return {
                        id: String(m.id),
                        round: rIdx + 1,
                        matchInRound: mAny.matchInRound || 0,
                        team1Id: t1Id,
                        team2Id: t2Id,
                        team1Name: t1Name,
                        team2Name: t2Name,
                        team1Crest: mAny.team1Crest || m.team1?.crestUrl,
                        team2Crest: mAny.team2Crest || m.team2?.crestUrl,
                        team1Mode: mAny.team1Mode || (t1Name ? 'name' : 'id'),
                        team2Mode: mAny.team2Mode || (t2Name ? 'name' : 'id'),
                        score1: String(mAny.score1 !== undefined ? mAny.score1 : (m.team1?.score !== undefined ? m.team1.score : '')),
                        score2: String(mAny.score2 !== undefined ? mAny.score2 : (m.team2?.score !== undefined ? m.team2.score : '')),
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
        try {
            const newId = tournamentName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            if (tournamentType === 'league') {
                alert("League feature initialized.");
            } else {
                const rounds = [];
                const roundsCount = Math.log2(numTeams);
                for (let r = 1; r <= roundsCount; r++) {
                    const matchesCount = numTeams / Math.pow(2, r);
                    const matches: AdminBracketMatch[] = Array.from({ length: matchesCount }, (_, i) => ({
                        id: `R${r}-M${i+1}`, round: r, matchInRound: i + 1, team1Id: null, team2Id: null,
                        score1: '', score2: '', winner: null, nextMatchId: null
                    }));
                    let title = matchesCount === 1 ? 'Final' : matchesCount === 2 ? 'Semi-Finals' : matchesCount === 4 ? 'Quarter-Finals' : `Round of ${matchesCount * 2}`;
                    rounds.push({ title, matches });
                }
                const newT = { 
                    id: newId,
                    name: tournamentName, 
                    rounds, 
                    categoryId: selectedCategory || null, 
                    hubSlot: selectedHubSlot || null,
                    type: 'bracket' as const,
                    logoUrl: newTournamentLogo || null
                };
                await setDoc(doc(db, 'cups', newId), newT);
                setTournament(newT);
            }
            setTournamentName('');
            setNewTournamentLogo('');
        } finally {
            setLoading(false);
        }
    };

    const jumpToFinal = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            // Scroll to the absolute end of the content
            container.scrollTo({
                left: container.scrollWidth,
                behavior: 'smooth'
            });
        }
    };

    const jumpToStart = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        }
    };

    if (loading && existingTournaments.length === 0) return <div className="flex justify-center p-12"><Spinner /></div>;

    const HUB_SLOTS: { value: CupHubSlot, label: string }[] = [
        { value: 'national', label: 'Ingwenyama: National Finals' },
        { value: 'trade-fair', label: 'Cups Hub: Trade Fair Cup' },
        { value: 'hhohho', label: 'Ingwenyama: Hhohho Region' },
        { value: 'manzini', label: 'Ingwenyama: Manzini Region' },
        { value: 'lubombo', label: 'Ingwenyama: Lubombo Region' },
        { value: 'shiselweni', label: 'Ingwenyama: Shiselweni Region' },
    ];

    return (
        <div className="w-full">
            <Card className="shadow-lg border-0 w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6 w-full">
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
                                                    <img src={t.logoUrl || 'https://via.placeholder.com/64?text=Cup'} className="max-h-full max-w-full object-contain" alt="" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-800 block">{t.name}</span>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <span className="text-[9px] uppercase font-black text-blue-500">{(t as any).type || 'Bracket'}</span>
                                                        {t.hubSlot && <span className="text-[9px] uppercase font-black text-green-600 bg-green-50 px-1 rounded flex items-center gap-1"><GlobeIcon className="w-2.5 h-2.5"/> {t.hubSlot}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditExisting(t)} className="p-2 text-blue-600 bg-blue-50 rounded-lg shadow-sm flex items-center gap-1.5 px-3">
                                                    <PencilIcon className="w-4 h-4"/> 
                                                    <span className="text-[10px] font-black uppercase">Edit</span>
                                                </button>
                                                <button onClick={() => handleDeleteTournament(t.id)} disabled={deletingId === t.id} className="p-2 text-red-600 bg-red-50 rounded-lg shadow-sm" title="Delete">
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
                                        <input type="text" value={tournamentName} onChange={e => setTournamentName(e.target.value)} placeholder="e.g. Malkerns Cup" className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hub Placement Slot</label>
                                        <select value={selectedHubSlot} onChange={e => setSelectedHubSlot(e.target.value as any)} className="w-full p-2 border rounded-lg text-sm font-bold text-blue-700 bg-blue-50">
                                            <option value="">-- No Slot (Independent) --</option>
                                            {HUB_SLOTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Logo (Optional)</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                                {newTournamentLogo ? <img src={newTournamentLogo} className="max-h-full max-w-full object-contain p-1" /> : <TrophyIcon className="w-6 h-6 text-gray-200"/>}
                                            </div>
                                            <label className="cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50">
                                                Upload
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTournamentLogoUpload(e, true)} />
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Starting Size</label>
                                        <select value={numTeams} onChange={e => setNumTeams(parseInt(e.target.value))} className="w-full p-2 border rounded-lg text-sm">
                                            <option value={4}>4 Teams</option>
                                            <option value={8}>8 Teams</option>
                                            <option value={16}>16 Teams</option>
                                            <option value={32}>32 Teams</option>
                                        </select>
                                    </div>
                                    <Button onClick={generateBracket} className="bg-primary text-white w-full h-11 font-bold uppercase tracking-widest shadow-xl">Build System</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in flex flex-col h-full w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
                                <div className="flex items-center gap-4 flex-grow">
                                    <label className="cursor-pointer group/cup relative flex-shrink-0">
                                        <div className="w-16 h-16 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group-hover:border-primary transition-all">
                                            {tournament.logoUrl ? <img src={tournament.logoUrl} className="max-h-full max-w-full object-contain p-2" alt="" /> : <TrophyIcon className="w-8 h-8 text-gray-200" />}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cup:opacity-100 flex items-center justify-center transition-opacity"><ImageIcon className="w-5 h-5 text-white" /></div>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTournamentLogoUpload(e, false)} />
                                    </label>
                                    
                                    <div className="flex-grow max-w-xl">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Master Bracket Editor</p>
                                            <button onClick={() => setIsRenaming(!isRenaming)} className="text-[9px] font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1"><PencilIcon className="w-3 h-3"/> Rename</button>
                                        </div>
                                        {isRenaming ? (
                                            <div className="flex gap-2">
                                                <input value={tournament.name} onChange={e => updateStateAndDb(prev => ({...prev, name: e.target.value}))} className="text-xl font-black font-display uppercase w-full bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5 outline-none" autoFocus />
                                                <button onClick={() => setIsRenaming(false)} className="bg-blue-600 text-white p-1.5 rounded-lg"><CheckIcon className="w-4 h-4"/></button>
                                            </div>
                                        ) : (
                                            <h3 className="text-2xl font-black font-display text-gray-900 uppercase tracking-tight leading-none">{tournament.name}</h3>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center no-print">
                                    <button 
                                        onClick={jumpToStart} 
                                        className="bg-white border border-gray-200 text-gray-600 h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                                    >
                                        <ArrowLeftIcon className="w-3 h-3"/> Start
                                    </button>
                                    <button 
                                        onClick={jumpToFinal} 
                                        className="bg-white border border-gray-200 text-gray-600 h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                                    >
                                        Final <ArrowRightIcon className="w-3 h-3"/>
                                    </button>
                                    <Button onClick={setTournament.bind(null, null)} className="bg-gray-900 text-white h-9 px-6 font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg">Close</Button>
                                </div>
                            </div>
                            
                            <div 
                                ref={scrollContainerRef}
                                className="flex flex-row gap-8 overflow-x-auto pb-10 px-4 pt-4 min-h-[650px] flex-nowrap custom-scrollbar w-full relative bg-gray-50/30 rounded-[2rem] border border-gray-100 shadow-inner"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                <div className="flex flex-row gap-8 min-w-max">
                                    {tournament.rounds.map((round, rIdx) => (
                                        <div key={rIdx} className="flex flex-col gap-4 flex-shrink-0" style={{ width: '224px' }}>
                                            <div className="bg-white py-3 rounded-xl border border-gray-200 text-center shadow-sm sticky top-0 z-10">
                                                <h4 className="text-[9px] font-black uppercase text-blue-600 tracking-[0.2em]">{round.title}</h4>
                                            </div>
                                            <div className="flex flex-col justify-around flex-grow gap-4 min-h-0">
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
                                                                    [`${slot}Crest`]: data.crestUrl,
                                                                    winner: null 
                                                                } : match)
                                                            }))
                                                        }))}
                                                        onScoreChange={(id, slot, val) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [slot]: val} : match)}))}))}
                                                        onDateTimeChange={(id, field, val) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => match.id === id ? {...match, [field]: val} : match)}))}))}
                                                        onDeclareWinner={(id) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => {
                                                            if (match.id !== id) return match;
                                                            const p1 = parseScore(match.score1);
                                                            const p2 = parseScore(match.score2);
                                                            
                                                            let winner: 'team1' | 'team2' = 'team1';
                                                            if (p1.main > p2.main) winner = 'team1';
                                                            else if (p2.main > p1.main) winner = 'team2';
                                                            else if (p1.pens > p2.pens) winner = 'team1';
                                                            else if (p2.pens > p1.pens) winner = 'team2';
                                                            
                                                            return { ...match, winner };
                                                        })}))}))}
                                                        onResetWinner={(id) => updateStateAndDb(prev => ({...prev, rounds: prev.rounds.map(r => ({...r, matches: r.matches.map(match => id === match.id ? {...match, winner: null} : match)}))}))}
                                                        onCrestUpload={(id, slot, base64) => updateStateAndDb(prev => ({
                                                            ...prev,
                                                            rounds: prev.rounds.map(r => ({
                                                                ...r,
                                                                matches: r.matches.map(match => match.id === id ? { ...match, [`${slot}Crest`]: base64 } : match)
                                                            }))
                                                        }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Large buffer spacer for scrolling comfort in 32-team views */}
                                    <div className="w-[300px] h-full flex-shrink-0"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TournamentBracket;
