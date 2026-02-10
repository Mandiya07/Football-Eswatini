
import React, { useState, useEffect } from 'react';
import { HybridTournament, ConfigTeam } from '../../data/international';
import { CompetitionFixture } from '../../data/teams';
import { Tournament } from '../../data/cups';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import { fetchCups, fetchCategories, Category, handleFirestoreError } from '../../services/api';
import Spinner from '../ui/Spinner';
import { compressImage } from '../../services/utils';
import ImageIcon from '../icons/ImageIcon';
import PencilIcon from '../icons/PencilIcon';

interface HybridTournamentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<HybridTournament, 'id'>, id?: string) => void;
    tournament: HybridTournament | null;
}

const HybridTournamentFormModal: React.FC<HybridTournamentFormModalProps> = ({ isOpen, onClose, onSave, tournament }) => {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [externalApiId, setExternalApiId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [teams, setTeams] = useState<ConfigTeam[]>([]);
    const [groups, setGroups] = useState<NonNullable<HybridTournament['groups']>>([]);
    const [matches, setMatches] = useState<CompetitionFixture[]>([]);
    const [bracketId, setBracketId] = useState<string>('');
    const [existingCups, setExistingCups] = useState<Tournament[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [imageProcessing, setImageProcessing] = useState(false);

    // Team form state
    const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
    const [teamForm, setTeamForm] = useState({ name: '', crestUrl: '' });
    const [teamProcessing, setTeamProcessing] = useState(false);

    // Other form inputs
    const [newGroupName, setNewGroupName] = useState('');
    const [newMatch, setNewMatch] = useState({ teamA: '', teamB: '', scoreA: '', scoreB: '', date: '', status: 'scheduled' as any });

    useEffect(() => {
        const loadMetadata = async () => {
            const [cups, cats] = await Promise.all([
                fetchCups(),
                fetchCategories()
            ]);
            setExistingCups(cups);
            setCategories(cats);
        };
        loadMetadata();
    }, []);

    useEffect(() => {
        if (tournament) {
            setId(tournament.id || '');
            setName(tournament.name || '');
            setDescription(tournament.description || '');
            setLogoUrl(tournament.logoUrl || '');
            setExternalApiId(tournament.externalApiId || '');
            setCategoryId(tournament.categoryId || '');
            setTeams(tournament.teams || []);
            setGroups(tournament.groups || []);
            setMatches(tournament.matches || []);
            setBracketId(tournament.bracketId || '');
        } else {
            setId('');
            setName('');
            setDescription('');
            setLogoUrl('');
            setExternalApiId('');
            setCategoryId('');
            setTeams([]);
            setGroups([]);
            setMatches([]);
            setBracketId('');
        }
    }, [tournament, isOpen]);

    const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setTeamProcessing(true);
            try {
                const base64 = await compressImage(e.target.files[0], 200, 0.7);
                setTeamForm(prev => ({ ...prev, crestUrl: base64 }));
            } catch (err) {
                console.error(err);
            } finally {
                setTeamProcessing(false);
            }
        }
    };

    const handleSaveTeam = () => {
        if (!teamForm.name) return;
        if (editingTeamIndex !== null) {
            const updated = [...teams];
            updated[editingTeamIndex] = { ...teamForm };
            setTeams(updated);
        } else {
            setTeams([...teams, { ...teamForm }]);
        }
        setTeamForm({ name: '', crestUrl: '' });
        setEditingTeamIndex(null);
    };

    const startEditTeam = (idx: number) => {
        setEditingTeamIndex(idx);
        setTeamForm({ ...teams[idx] });
    };

    const handleAddGroup = () => {
        if (!newGroupName) return;
        setGroups([...groups, { name: newGroupName, teamNames: [] }]);
        setNewGroupName('');
    };

    const handleToggleTeamInGroup = (groupIndex: number, teamName: string) => {
        const updatedGroups = [...groups];
        const group = updatedGroups[groupIndex];
        if (group.teamNames.includes(teamName)) {
            group.teamNames = group.teamNames.filter(n => n !== teamName);
        } else {
            group.teamNames.push(teamName);
        }
        setGroups(updatedGroups);
    };

    const handleAddMatch = () => {
        if (!newMatch.teamA || !newMatch.teamB || !newMatch.date) return;
        const dateObj = new Date(newMatch.date);
        const matchToAdd: CompetitionFixture = {
            id: Date.now(),
            teamA: newMatch.teamA,
            teamB: newMatch.teamB,
            scoreA: newMatch.scoreA !== '' ? parseInt(newMatch.scoreA) : undefined,
            scoreB: newMatch.scoreB !== '' ? parseInt(newMatch.scoreB) : undefined,
            status: newMatch.status,
            fullDate: newMatch.date,
            date: dateObj.getDate().toString(),
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            time: '15:00'
        };
        setMatches([...matches, matchToAdd]);
        setNewMatch({ teamA: '', teamB: '', scoreA: '', scoreB: '', date: '', status: 'scheduled' });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageProcessing(true);
            try {
                const base64 = await compressImage(e.target.files[0], 400, 0.7);
                setLogoUrl(base64);
            } catch (err) {
                console.error("Logo upload failed", err);
            } finally {
                setImageProcessing(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Omit<HybridTournament, 'id'> = {
            name,
            description,
            logoUrl,
            externalApiId,
            categoryId,
            type: 'hybrid',
            teams,
            groups,
            matches,
            bracketId
        };
        onSave(payload, id || undefined);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-4xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">{tournament ? 'Edit Hybrid Tournament' : 'Create Hybrid Tournament'}</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* 1. Basic Info */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600"/> 1. Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tournament ID (Slug)</label>
                                        <input 
                                            value={id} 
                                            onChange={e => setId(e.target.value.toLowerCase().replace(/\s+/g, '-'))} 
                                            required 
                                            className={inputClass} 
                                            placeholder="e.g. afcon-2025" 
                                            disabled={!!tournament} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                                        <input value={name} onChange={e => setName(e.target.value)} required className={inputClass} placeholder="e.g. Africa Cup of Nations 2025" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">App Section / Category</label>
                                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className={inputClass}>
                                            <option value="" disabled>-- Select Category --</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Tournament significance..." />
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-gray-50 relative group">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-32 object-contain" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">Tournament Logo</p>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                        <span className="text-white font-bold text-xs">Click to {logoUrl ? 'Change' : 'Upload'}</span>
                                        <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
                                    </label>
                                    {imageProcessing && <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl"><Spinner className="w-6 h-6" /></div>}
                                </div>
                            </div>
                        </section>

                        {/* 2. Team Definition */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">2. Participating Teams</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {teams.map((t, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img src={t.crestUrl} className="w-8 h-8 object-contain bg-gray-50 rounded p-0.5" alt="" />
                                            <span className="text-sm font-bold text-gray-800 truncate">{t.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => startEditTeam(idx)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><PencilIcon className="w-3.5 h-3.5"/></button>
                                            <button type="button" onClick={() => setTeams(teams.filter((_, i) => i !== idx))} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="w-3.5 h-3.5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-4">
                                <h4 className="font-bold text-sm text-gray-700 mb-4">{editingTeamIndex !== null ? 'Edit Team' : 'Add New Team'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Team Name</label>
                                        <input value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} className={inputClass} placeholder="e.g. Morocco" />
                                    </div>
                                    <div className="md:col-span-5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Logo URL or Upload</label>
                                        <div className="flex gap-2">
                                            <input value={teamForm.crestUrl} onChange={e => setTeamForm({...teamForm, crestUrl: e.target.value})} className={inputClass} placeholder="https://..." />
                                            <label className="bg-white border px-3 rounded cursor-pointer hover:bg-gray-100 flex items-center">
                                                {teamProcessing ? <Spinner className="w-4 h-4"/> : <ImageIcon className="w-4 h-4 text-gray-400"/>}
                                                <input type="file" className="hidden" onChange={handleTeamImageUpload} accept="image/*" />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Button type="button" onClick={handleSaveTeam} className="bg-primary text-white w-full h-10 shadow-lg">
                                            {editingTeamIndex !== null ? 'Update' : 'Add'}
                                        </Button>
                                    </div>
                                </div>
                                {teamForm.crestUrl && <img src={teamForm.crestUrl} className="mt-4 h-12 w-12 object-contain border rounded p-1 bg-white" />}
                            </div>
                        </section>

                        {/* 3. Group Config */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">3. Group Stage</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-grow">
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase">Group Name</label>
                                            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className={inputClass} placeholder="Group A" />
                                        </div>
                                        <Button type="button" onClick={handleAddGroup} className="bg-green-600 text-white h-9">Create</Button>
                                    </div>
                                    <div className="space-y-3">
                                        {groups.map((group, gIdx) => (
                                            <div key={gIdx} className="p-3 bg-white border rounded-lg shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-gray-800 text-sm">{group.name}</span>
                                                    <button type="button" onClick={() => setGroups(groups.filter((_, i) => i !== gIdx))} className="text-red-500 hover:text-red-700"><TrashIcon className="w-3 h-3"/></button>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {teams.map(team => (
                                                        <button 
                                                            key={team.name}
                                                            type="button"
                                                            onClick={() => handleToggleTeamInGroup(gIdx, team.name)}
                                                            className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${group.teamNames.includes(team.name) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                                        >
                                                            {team.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
                                    <p className="font-bold mb-1 underline">Point System Instructions:</p>
                                    <p>Standings will be automatically calculated based on matches involving teams in these groups.</p>
                                </div>
                            </div>
                        </section>

                        {/* 4. Match Records */}
                        <section className="space-y-4">
                            <h3 className="font-bold text-lg border-b pb-2">4. Match History & Schedule</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Home</label>
                                        <select value={newMatch.teamA} onChange={e => setNewMatch({...newMatch, teamA: e.target.value})} className={inputClass}>
                                            <option value="">Select...</option>
                                            {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Away</label>
                                        <select value={newMatch.teamB} onChange={e => setNewMatch({...newMatch, teamB: e.target.value})} className={inputClass}>
                                            <option value="">Select...</option>
                                            {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Date</label>
                                        <input type="date" value={newMatch.date} onChange={e => setNewMatch({...newMatch, date: e.target.value})} className={inputClass} />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="button" onClick={handleAddMatch} className="bg-green-600 text-white w-full h-9">Add</Button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {matches.map(m => (
                                        <div key={m.id} className="flex justify-between items-center bg-white p-2 border rounded text-xs">
                                            <span className="font-bold">{m.teamA} vs {m.teamB}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-500">{m.fullDate}</span>
                                                <button type="button" onClick={() => setMatches(matches.filter(match => match.id !== m.id))} className="text-red-500"><TrashIcon className="w-3.5 h-3.5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end gap-3 border-t pt-6">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white">Save Tournament</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default HybridTournamentFormModal;
