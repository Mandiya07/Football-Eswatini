
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { fetchDirectoryEntries, addStandaloneMatch, fetchStandaloneMatches, deleteStandaloneMatch, updateStandaloneMatch, StandaloneMatch } from '../../services/api';
import { DirectoryEntity } from '../../data/directory';
import { superNormalize, findInMap } from '../../services/utils';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import GlobeIcon from '../icons/GlobeIcon';
import CalendarIcon from '../icons/CalendarIcon';
import MapPinIcon from '../icons/MapPinIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XIcon from '../icons/XIcon';
import PlayIcon from '../icons/PlayIcon';
import PencilIcon from '../icons/PencilIcon';

const ManageFriendlies: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [matches, setMatches] = useState<StandaloneMatch[]>([]);
    const [directory, setDirectory] = useState<DirectoryEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [isManualOpponent, setIsManualOpponent] = useState(false);

    const [form, setForm] = useState({
        opponent: '',
        date: '',
        time: '15:00',
        venue: '',
        status: 'scheduled' as StandaloneMatch['status'],
        scoreA: '',
        scoreB: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [dir, standalone] = await Promise.all([
                fetchDirectoryEntries(),
                fetchStandaloneMatches(clubName)
            ]);
            setDirectory(dir.filter(e => superNormalize(e.name) !== superNormalize(clubName)));
            setMatches(standalone);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [clubName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.opponent || !form.date) return;
        
        setIsSubmitting(true);
        try {
            const dateObj = new Date(form.date);
            const matchData: Omit<StandaloneMatch, 'id'> = {
                teamA: clubName,
                teamB: form.opponent,
                fullDate: form.date,
                date: dateObj.getDate().toString(),
                day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                time: form.time,
                venue: form.venue || 'TBA',
                status: form.status,
                scoreA: form.scoreA !== '' ? parseInt(form.scoreA) : undefined,
                scoreB: form.scoreB !== '' ? parseInt(form.scoreB) : undefined,
                isFriendly: true,
                managedByTeam: clubName,
                competition: 'Independent Match'
            };

            await addStandaloneMatch(matchData);
            setSuccessMsg("Match record created!");
            setShowForm(false);
            setForm({ opponent: '', date: '', time: '15:00', venue: '', status: 'scheduled', scoreA: '', scoreB: '' });
            await loadData();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert("Failed to log match.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Remove this match record?")) return;
        await deleteStandaloneMatch(id);
        loadData();
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm outline-none transition-all";

    return (
        <Card className="shadow-lg animate-fade-in border-t-4 border-blue-500">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold font-display">Independent Match Controller</h3>
                        <p className="text-sm text-gray-500">Log friendlies and matches against unlisted or community teams.</p>
                    </div>
                    {!showForm && (
                        <Button onClick={() => setShowForm(true)} className="bg-primary text-white flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Log New Match
                        </Button>
                    )}
                </div>

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 border border-green-100 animate-in fade-in">
                        <CheckCircleIcon className="w-5 h-5"/> {successMsg}
                    </div>
                )}

                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-10 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h4 className="font-black text-xs uppercase tracking-widest text-primary">Match Configuration</h4>
                            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-600 transition-colors"><XIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-gray-600">Opponent Team</label>
                                    <button 
                                        type="button" 
                                        onClick={() => { setIsManualOpponent(!isManualOpponent); setForm({...form, opponent: ''}); }}
                                        className="text-[10px] font-black uppercase text-blue-600 hover:underline"
                                    >
                                        {isManualOpponent ? "Pick from Directory" : "Team not listed? Type Name"}
                                    </button>
                                </div>
                                {isManualOpponent ? (
                                    <input 
                                        value={form.opponent} 
                                        onChange={e => setForm({...form, opponent: e.target.value})} 
                                        placeholder="Type Team Name..." 
                                        className={inputClass} 
                                        required 
                                    />
                                ) : (
                                    <select value={form.opponent} onChange={e => setForm({...form, opponent: e.target.value})} className={inputClass} required>
                                        <option value="" disabled>-- Select From Directory --</option>
                                        {directory.map(e => <option key={e.id} value={e.name}>{e.name} ({e.category})</option>)}
                                    </select>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Time</label>
                                    <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Venue</label>
                                <input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} placeholder="e.g. Community Pitch" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Match Status</label>
                                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className={inputClass}>
                                    <option value="scheduled">Upcoming / Scheduled</option>
                                    <option value="live">In Progress / Live</option>
                                    <option value="finished">Finished / Full Time</option>
                                </select>
                            </div>
                            {(form.status === 'finished' || form.status === 'live') && (
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" placeholder={clubName.substring(0,5)} value={form.scoreA} onChange={e => setForm({...form, scoreA: e.target.value})} className={inputClass} />
                                    <input type="number" placeholder="Opp." value={form.scoreB} onChange={e => setForm({...form, scoreB: e.target.value})} className={inputClass} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t gap-3">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 font-bold shadow-lg">
                                {isSubmitting ? <Spinner className="w-4 h-4 border-white"/> : 'Commit Record'}
                            </Button>
                        </div>
                    </form>
                )}

                {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
                    <div className="space-y-4">
                        {matches.length > 0 ? matches.map(m => (
                            <div key={m.id} className="p-5 border border-gray-100 bg-white rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="bg-blue-50 p-3 rounded-2xl text-primary">
                                        <GlobeIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-gray-900 text-lg">{m.teamA} <span className="text-gray-300 font-medium mx-1">vs</span> {m.teamB}</span>
                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">Independent</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 font-bold uppercase tracking-tight">
                                            <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> {m.fullDate}</span>
                                            <span className="flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5"/> {m.venue}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                                    <div className="flex-grow sm:flex-grow-0">
                                        {m.status === 'finished' ? (
                                            <div className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-xl shadow-inner border-b-2 border-primary">
                                                {m.scoreA} : {m.scoreB}
                                            </div>
                                        ) : (
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${m.status === 'live' ? 'bg-red-600 text-white animate-pulse border-red-400' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {m.status}
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => handleDelete(m.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" title="Delete record">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 border-2 border-dashed rounded-[2.5rem] bg-gray-50">
                                <GlobeIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-500 font-bold">No independent match history for your club.</p>
                                <p className="text-xs text-gray-400 mt-2">Add friendlies and community games to keep your profile active.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ManageFriendlies;
