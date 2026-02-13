import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Team, Player, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import UserIcon from '../icons/UserIcon';
import HistoryIcon from '../icons/HistoryIcon';
import BarChartIcon from '../icons/BarChartIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps, superNormalize } from '../../services/utils';
import Spinner from '../ui/Spinner';
import { handleFirestoreError } from '../../services/api';
import InfoIcon from '../icons/InfoIcon';

interface TeamRosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    team: Team;
    competitionId: string;
    initialPlayer?: Player | null;
}

const TeamRosterModal: React.FC<TeamRosterModalProps> = ({ isOpen, onClose, onSave, team, competitionId, initialPlayer }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'technical' | 'history'>('basic');
    
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '', position: 'Forward', number: '', photoUrl: '',
        age: '', nationality: '', height: '',
        appearances: '0', goals: '0', assists: '0', cleanSheets: '0',
        yellowCards: '0', redCards: '0', potmWins: '0'
    });

    const [transferHistory, setTransferHistory] = useState<{from: string, to: string, year: number}[]>([]);
    const [newTransfer, setNewTransfer] = useState({ from: '', to: '', year: new Date().getFullYear() });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startEditing = useCallback((player: Player) => {
        setEditingId(player.id);
        // Source baseline from baseStats if present, else stats
        // Fix: Explicitly provided a default object that satisfies PlayerStats to avoid "Property does not exist on type '{}'" errors.
        const source = player.baseStats || player.stats || {
            appearances: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            cleanSheets: 0,
            potmWins: 0
        };
        setFormData({
            name: player.name || '',
            position: player.position || 'Forward',
            number: player.number === 0 ? '' : String(player.number), 
            photoUrl: player.photoUrl || '',
            age: String(player.bio?.age || ''),
            nationality: player.bio?.nationality || '',
            height: player.bio?.height || '',
            appearances: String(source.appearances || 0),
            goals: String(source.goals || 0),
            assists: String(source.assists || 0),
            cleanSheets: String(source.cleanSheets || 0),
            yellowCards: String(source.yellowCards || 0),
            redCards: String(source.redCards || 0),
            potmWins: String(source.potmWins || 0)
        });
        setTransferHistory(player.transferHistory || []);
        setActiveTab('basic');
    }, []);

    const resetForm = useCallback(() => {
        setFormData({ 
            name: '', position: 'Forward', number: '', photoUrl: '',
            age: '', nationality: '', height: '',
            appearances: '0', goals: '0', assists: '0', cleanSheets: '0',
            yellowCards: '0', redCards: '0', potmWins: '0'
        });
        setTransferHistory([]);
        setEditingId(null);
        setActiveTab('basic');
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    useEffect(() => {
        if (isOpen) {
            setPlayers(team.players || []);
            if (initialPlayer) {
                startEditing(initialPlayer);
            } else {
                resetForm();
            }
        }
    }, [team, initialPlayer, isOpen, startEditing, resetForm]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => { if (typeof reader.result === 'string') setFormData(prev => ({ ...prev, photoUrl: reader.result as string })); };
            reader.readAsDataURL(file);
        }
    };

    const handleAddTransfer = () => {
        if (!newTransfer.from || !newTransfer.to) return;
        setTransferHistory([...transferHistory, newTransfer].sort((a,b) => b.year - a.year));
        setNewTransfer({ from: '', to: '', year: new Date().getFullYear() });
    };

    const updateFirestore = async (updatedPlayers: Player[]) => {
        setIsSubmitting(true);
        try {
            const docRef = doc(db, 'competitions', competitionId);
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw new Error("Hub missing.");
                const competition = docSnap.data() as Competition;
                const normName = superNormalize(team.name);
                const updatedTeams = competition.teams.map(t => {
                    if (t.id === team.id || superNormalize(t.name) === normName) {
                        return { ...t, players: updatedPlayers };
                    }
                    return t;
                });
                transaction.update(docRef, removeUndefinedProps({ teams: updatedTeams }));
            });
            setPlayers(updatedPlayers);
            onSave();
        } catch (error) {
            handleFirestoreError(error, 'update roster');
        } finally { setIsSubmitting(false); }
    };

    const handleSavePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;
        
        const manualBaseline = { 
            appearances: parseInt(formData.appearances, 10) || 0,
            goals: parseInt(formData.goals, 10) || 0,
            assists: parseInt(formData.assists, 10) || 0,
            cleanSheets: parseInt(formData.cleanSheets, 10) || 0,
            yellowCards: parseInt(formData.yellowCards, 10) || 0,
            redCards: parseInt(formData.redCards, 10) || 0,
            potmWins: parseInt(formData.potmWins, 10) || 0
        };

        const playerToSave: Player = {
            id: editingId || Date.now(),
            name: formData.name.trim(),
            position: formData.position as any,
            number: parseInt(formData.number, 10) || 0,
            photoUrl: formData.photoUrl,
            bio: { nationality: formData.nationality || 'Eswatini', age: parseInt(formData.age, 10) || 0, height: formData.height || '-' },
            baseStats: manualBaseline, // Saved as baseline
            stats: manualBaseline,      // Initial display total
            transferHistory: transferHistory,
        };
        
        let updated: Player[] = editingId ? players.map(p => p.id === editingId ? playerToSave : p) : [...players, playerToSave];
        await updateFirestore(updated.sort((a,b) => a.number - b.number));
        resetForm();
        onClose();
    };

    if (!isOpen) return null;
    const inputClass = "block w-full px-4 py-3 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm outline-none bg-white transition-all";

    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[300] flex items-center justify-center p-0 lg:p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-5xl min-h-screen lg:min-h-0 lg:rounded-[2.5rem] relative animate-slide-up flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 z-50 bg-white/10 rounded-full p-2"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-6 lg:p-12 flex-grow overflow-y-auto lg:overflow-visible">
                    <div className="mb-8">
                        <h2 className="text-2xl lg:text-3xl font-black font-display text-slate-900">{team.name}</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Roster & Technical Management Suite</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-10">
                        {/* List */}
                        <div className="lg:w-1/3 order-2 lg:order-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Active Squad</h4>
                                <button onClick={resetForm} className="text-[10px] font-black uppercase text-blue-600 hover:underline">New Player</button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1 no-scrollbar lg:custom-scrollbar">
                                {players.map(p => (
                                    <div key={p.id} onClick={() => startEditing(p)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${editingId === p.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white hover:bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white shadow-sm">
                                                {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" /> : <UserIcon className={`w-5 h-5 ${editingId === p.id ? 'text-white' : 'text-slate-300'}`}/>}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm truncate">{p.name}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-tighter ${editingId === p.id ? 'text-white/60' : 'text-blue-600'}`}>#{p.number} • {p.position}</p>
                                            </div>
                                        </div>
                                        <PencilIcon className={`w-4 h-4 ${editingId === p.id ? 'text-white/40' : 'text-slate-300'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="lg:w-2/3 order-1 lg:order-2">
                            <form onSubmit={handleSavePlayer} className="space-y-8">
                                <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                                    {(['basic', 'technical', 'history'] as const).map(tab => (
                                        <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>{tab}</button>
                                    ))}
                                </div>

                                <div className="min-h-[400px]">
                                    {activeTab === 'basic' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Legal Name</label>
                                                <input name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Jersey Number</label>
                                                <input type="number" name="number" value={formData.number} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Position</label>
                                                <select name="position" value={formData.position} onChange={handleInputChange} className={inputClass}>
                                                    <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Age</label>
                                                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nationality</label>
                                                <input name="nationality" value={formData.nationality} onChange={handleInputChange} className={inputClass} />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Profile Photo</label>
                                                <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" ref={fileInputRef} />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'technical' && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                                                <InfoIcon className="w-6 h-6 text-blue-600 mt-1" />
                                                <div>
                                                    <p className="text-sm text-blue-800 font-bold uppercase tracking-tight">Historical / Manual Baseline</p>
                                                    <p className="text-xs text-blue-700 leading-relaxed mt-1">Use these fields to set a starting point (e.g. goals from previous years). Matches currently in the system will be added to these baselines automatically.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Appearances</label><input type="number" name="appearances" value={formData.appearances} onChange={handleInputChange} className={inputClass} /></div>
                                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Goals</label><input type="number" name="goals" value={formData.goals} onChange={handleInputChange} className={inputClass} /></div>
                                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Assists</label><input type="number" name="assists" value={formData.assists} onChange={handleInputChange} className={inputClass} /></div>
                                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Clean Sheets</label><input type="number" name="cleanSheets" value={formData.cleanSheets} onChange={handleInputChange} className={inputClass} /></div>
                                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Yellow Cards</label><input type="number" name="yellowCards" value={formData.yellowCards} onChange={handleInputChange} className={inputClass} /></div>
                                                <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Red Cards</label><input type="number" name="redCards" value={formData.redCards} onChange={handleInputChange} className={inputClass} /></div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                                <h5 className="font-bold text-xs mb-4 uppercase tracking-widest text-slate-400">Add History Event</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                                    <input value={newTransfer.from} onChange={e => setNewTransfer({...newTransfer, from: e.target.value})} placeholder="From Club" className="p-3 bg-white border rounded-xl text-sm shadow-inner" />
                                                    <input value={newTransfer.to} onChange={e => setNewTransfer({...newTransfer, to: e.target.value})} placeholder="To Club" className="p-3 bg-white border rounded-xl text-sm shadow-inner" />
                                                    <div className="flex gap-2">
                                                        <input type="number" value={newTransfer.year} onChange={e => setNewTransfer({...newTransfer, year: parseInt(e.target.value) || 2024})} className="p-3 bg-white border rounded-xl text-sm w-full shadow-inner" />
                                                        <button type="button" onClick={handleAddTransfer} className="bg-primary text-white p-3 rounded-xl shadow-lg"><PlusCircleIcon className="w-5 h-5"/></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {transferHistory.map((t, i) => (
                                                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group shadow-sm">
                                                        <div className="flex items-center gap-6 font-bold text-sm">
                                                            <span className="text-slate-400 tabular-nums">{t.year}</span>
                                                            <span className="text-slate-900">{t.from} &rarr; {t.to}</span>
                                                        </div>
                                                        <button type="button" onClick={() => setTransferHistory(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 opacity-0 group-hover:opacity-100 p-2"><TrashIcon className="w-4 h-4"/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <button type="button" onClick={() => editingId && updateFirestore(players.filter(p => p.id !== editingId))} disabled={!editingId || isSubmitting} className="text-red-600 text-xs font-black uppercase tracking-widest hover:underline disabled:opacity-20">Terminate Profile</button>
                                    <div className="flex gap-4 w-full sm:w-auto">
                                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Discard</Button>
                                        <Button type="submit" disabled={isSubmitting} className="flex-[2] sm:flex-none bg-primary text-white px-12 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95">
                                            {isSubmitting ? <Spinner className="w-5 h-5 border-white" /> : editingId ? 'Update Identity' : 'Create Profile'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamRosterModal;