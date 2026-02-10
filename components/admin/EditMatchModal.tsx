
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CompetitionFixture, Team, MatchEvent } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import RefreshIcon from '../icons/RefreshIcon';
import WhistleIcon from '../icons/WhistleIcon';
import PhotoIcon from '../icons/PhotoIcon';
import MedalIcon from '../icons/MedalIcon';
import UserIcon from '../icons/UserIcon';
import { superNormalize } from '../../services/utils';

interface EditMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedMatch: CompetitionFixture) => void;
    match: CompetitionFixture;
    teams: Team[];
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ isOpen, onClose, onSave, match, teams }) => {
    const [formData, setFormData] = useState<CompetitionFixture>(({ ...match }));
    const [events, setEvents] = useState<MatchEvent[]>(match.events || []);
    const [galleryImages, setGalleryImages] = useState<string[]>(match.galleryImages || []);
    
    const [newEvent, setNewEvent] = useState<{
        minute: string, 
        type: MatchEvent['type'], 
        description: string,
        teamSide: 'home' | 'away' | '',
        playerName: string
    }>({
        minute: '', type: 'goal', description: '', teamSide: '', playerName: ''
    });

    const [showPlayerSuggestions, setShowPlayerSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setFormData({ ...match });
        setEvents(match.events || []);
        setGalleryImages(match.galleryImages || []);
        
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowPlayerSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [match, isOpen]);
    
    const teamAObj = useMemo(() => teams.find(t => superNormalize(t.name) === superNormalize(formData.teamA)), [teams, formData.teamA]);
    const teamBObj = useMemo(() => teams.find(t => superNormalize(t.name) === superNormalize(formData.teamB)), [teams, formData.teamB]);

    const activeRoster = useMemo(() => {
        if (newEvent.teamSide === 'home') return teamAObj?.players || [];
        if (newEvent.teamSide === 'away') return teamBObj?.players || [];
        return [];
    }, [newEvent.teamSide, teamAObj, teamBObj]);

    const filteredSuggestions = useMemo(() => {
        if (!newEvent.playerName || newEvent.playerName.length < 1) return activeRoster.slice(0, 5);
        const term = newEvent.playerName.toLowerCase();
        return activeRoster.filter(p => 
            p.name.toLowerCase().includes(term) || 
            String(p.number).includes(term)
        ).slice(0, 5);
    }, [activeRoster, newEvent.playerName]);

    const combinedRoster = useMemo(() => {
        const list: { name: string; teamName: string; playerID: number }[] = [];
        if (teamAObj) {
            teamAObj.players?.forEach(p => list.push({ name: p.name, teamName: teamAObj.name, playerID: p.id }));
        }
        if (teamBObj) {
            teamBObj.players?.forEach(p => list.push({ name: p.name, teamName: teamBObj.name, playerID: p.id }));
        }
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [teamAObj, teamBObj]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? undefined : parseInt(value, 10)
        }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        if(!dateStr) return;
        const dateObj = new Date(dateStr);
        setFormData(prev => ({
            ...prev,
            fullDate: dateStr,
            date: dateObj.getDate().toString(),
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
        }));
    };

    const handleAddEvent = () => {
        if (!newEvent.playerName && !newEvent.description) {
            alert("Please provide a player or description.");
            return;
        }
        
        const teamName = newEvent.teamSide === 'home' ? formData.teamA : 
                         newEvent.teamSide === 'away' ? formData.teamB : undefined;

        const playerNameTrimmed = newEvent.playerName.trim();
        const existingPlayer = activeRoster.find(p => superNormalize(p.name) === superNormalize(playerNameTrimmed));

        const event: MatchEvent = {
            minute: newEvent.minute ? parseInt(newEvent.minute, 10) : undefined,
            type: newEvent.type,
            description: newEvent.description || `${newEvent.type.toUpperCase()}${playerNameTrimmed ? ' - ' + playerNameTrimmed : ''}`,
            teamName: teamName,
            playerName: playerNameTrimmed || undefined,
            playerID: existingPlayer?.id
        };
        
        setEvents(prev => [...prev, event].sort((a,b) => (a.minute || 0) - (b.minute || 0)));
        setNewEvent({ minute: '', type: 'goal', description: '', teamSide: '', playerName: '' });
        setShowPlayerSuggestions(false);
    };

    const handleDeleteEvent = (index: number) => {
        setEvents(prev => prev.filter((_, i) => i !== index));
    };

    const syncScoreFromEvents = () => {
        const goalsA = events.filter(e => (String(e.type).toLowerCase() === 'goal') && e.teamName === formData.teamA).length;
        const goalsB = events.filter(e => (String(e.type).toLowerCase() === 'goal') && e.teamName === formData.teamB).length;
        setFormData(prev => ({ ...prev, scoreA: goalsA, scoreB: goalsB }));
    };

    const handlePotmChange = (val: string) => {
        if (!val) {
            setFormData(prev => ({ ...prev, playerOfTheMatch: undefined }));
            return;
        }
        const [playerIDStr, teamName] = val.split('|');
        const playerID = parseInt(playerIDStr);
        const player = combinedRoster.find(p => p.playerID === playerID);
        if (player) {
            setFormData(prev => ({
                ...prev,
                playerOfTheMatch: {
                    name: player.name,
                    playerID: player.playerID,
                    teamName: teamName
                }
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ 
            ...formData, 
            events: events,
            galleryImages: galleryImages 
        });
    };
    
    if (!isOpen) return null;

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
         <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close edit form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">Edit Match Data & Stats</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Home Team</label>
                                <select name="teamA" value={formData.teamA} onChange={handleChange} className={inputClass}>
                                    {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Away Team</label>
                                <select name="teamB" value={formData.teamB} onChange={handleChange} className={inputClass}>
                                    {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" name="fullDate" value={formData.fullDate || ''} onChange={handleDateChange} className={inputClass} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input type="time" name="time" value={formData.time || ''} onChange={handleChange} className={inputClass} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                                <input type="text" name="venue" value={formData.venue || ''} onChange={handleChange} className={inputClass} />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matchday</label>
                                <input type="number" name="matchday" value={formData.matchday || ''} onChange={handleNumberChange} className={inputClass} />
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><WhistleIcon className="w-4 h-4 text-gray-400" /> Match Referee</label>
                            <input type="text" name="referee" value={formData.referee || ''} onChange={handleChange} className={inputClass} placeholder="Referee Name" />
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                             <select name="status" value={formData.status || 'scheduled'} onChange={handleChange} className={inputClass}>
                                <option value="scheduled">Scheduled</option>
                                <option value="live">Live</option>
                                <option value="finished">Finished</option>
                                <option value="postponed">Postponed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="abandoned">Abandoned</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>

                        {(formData.status === 'finished' || formData.status === 'live' || formData.status === 'abandoned' || formData.status === 'suspended') && (
                            <>
                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-gray-700">Live Score</label>
                                        <button 
                                            type="button" 
                                            onClick={syncScoreFromEvents} 
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                                        >
                                            <RefreshIcon className="w-3" /> Sync from Goals
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" name="scoreA" value={formData.scoreA ?? ''} onChange={handleNumberChange} className={inputClass} placeholder={`${formData.teamA} Score`} min="0" />
                                        <input type="number" name="scoreB" value={formData.scoreB ?? ''} onChange={handleNumberChange} className={inputClass} placeholder={`${formData.teamB} Score`} min="0" />
                                    </div>
                                </div>

                                {formData.status === 'finished' && (
                                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 shadow-inner">
                                        <label className="block text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                            <MedalIcon className="w-4 h-4" /> Player of the Match
                                        </label>
                                        <select 
                                            value={formData.playerOfTheMatch ? `${formData.playerOfTheMatch.playerID}|${formData.playerOfTheMatch.teamName}` : ''}
                                            onChange={e => handlePotmChange(e.target.value)}
                                            className="w-full p-2 border border-yellow-300 rounded-lg text-sm bg-white"
                                        >
                                            <option value="">-- No MVP Selected --</option>
                                            {combinedRoster.map(p => (
                                                <option key={`${p.playerID}-${p.teamName}`} value={`${p.playerID}|${p.teamName}`}>
                                                    {p.name} ({p.teamName})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-yellow-600 mt-2 font-medium italic">MVP selection impacts Player of the Month rankings.</p>
                                    </div>
                                )}
                            </>
                        )}
                        
                        <div className="border-t pt-4 mt-4">
                             <h3 className="font-bold text-lg mb-2 text-gray-800">Match Events Reconciler</h3>
                             <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100 space-y-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400">Team</label>
                                        <select value={newEvent.teamSide} onChange={e => setNewEvent({...newEvent, teamSide: e.target.value as any, playerName: ''})} className="w-full p-2 border rounded-lg text-sm">
                                            <option value="">-- Choose Side --</option>
                                            <option value="home">{formData.teamA}</option>
                                            <option value="away">{formData.teamB}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400">Type</label>
                                        <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="w-full p-2 border rounded-lg text-sm">
                                            <option value="goal">⚽ Goal</option>
                                            <option value="yellow-card">🟨 Yellow Card</option>
                                            <option value="red-card">🟥 Red Card</option>
                                            <option value="substitution">🔄 Substitution</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Minute</label>
                                        <input type="number" value={newEvent.minute} onChange={e => setNewEvent({...newEvent, minute: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="Min" />
                                    </div>
                                </div>

                                <div className="relative" ref={suggestionRef}>
                                    <label className="text-[10px] font-black uppercase text-gray-400">Player Name</label>
                                    <input 
                                        type="text" 
                                        value={newEvent.playerName} 
                                        onChange={e => {
                                            setNewEvent({...newEvent, playerName: e.target.value});
                                            setShowPlayerSuggestions(true);
                                        }} 
                                        onFocus={() => setShowPlayerSuggestions(true)}
                                        className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                        placeholder={newEvent.teamSide ? "Start typing player name..." : "Select team first..."}
                                        disabled={!newEvent.teamSide}
                                    />
                                    {showPlayerSuggestions && newEvent.teamSide && (
                                        <div className="absolute z-[400] w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            {filteredSuggestions.length > 0 ? (
                                                filteredSuggestions.map(p => (
                                                    <button 
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setNewEvent({...newEvent, playerName: p.name});
                                                            setShowPlayerSuggestions(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center justify-between border-b last:border-0 border-gray-50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border text-[10px] font-black text-gray-400">
                                                                {p.number || <UserIcon className="w-4 h-4"/>}
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-800">{p.name}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{p.position}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center">
                                                    <p className="text-xs text-gray-500 font-medium italic">No matches. Use custom name below.</p>
                                                </div>
                                            )}
                                            <button 
                                                type="button"
                                                onClick={() => setShowPlayerSuggestions(false)}
                                                className="w-full py-2 bg-gray-50 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors border-t"
                                            >
                                                Close Suggestions
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Description (Optional)</label>
                                        <input type="text" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Scored a volley" />
                                    </div>
                                    <Button type="button" onClick={handleAddEvent} className="bg-blue-600 text-white h-9 px-4 rounded-lg shadow-sm"><PlusCircleIcon className="w-4 h-4 mr-2" />Add</Button>
                                </div>
                             </div>
                             
                             <div className="space-y-1 max-h-40 overflow-y-auto bg-gray-50 border rounded-xl p-2">
                                 {events.length > 0 ? events.map((ev, idx) => (
                                     <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                         <div className="flex gap-3 overflow-hidden items-center">
                                             <span className="font-black w-8 text-slate-400">{ev.minute ? `${ev.minute}'` : '-'}</span>
                                             <span className={`uppercase text-[9px] font-black px-1.5 py-0.5 rounded-full ${ev.type === 'goal' ? 'bg-green-100 text-green-700' : ev.type.includes('card') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{ev.type}</span>
                                             <div className="min-w-0">
                                                <span className="font-bold text-gray-900 truncate block">{ev.playerName}</span>
                                                <span className="text-[9px] text-gray-400 truncate block">{ev.teamName}</span>
                                             </div>
                                         </div>
                                         <button type="button" onClick={() => handleDeleteEvent(idx)} className="text-red-400 hover:text-red-600 p-1"><TrashIcon className="w-4 h-4"/></button>
                                     </div>
                                 )) : <p className="text-xs text-gray-400 text-center py-4 italic">No events recorded for this match.</p>}
                             </div>
                        </div>

                         <div className="flex justify-end gap-2 pt-6 mt-4 border-t">
                            <Button type="button" onClick={onClose} variant="ghost">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark px-10 h-11 font-black uppercase tracking-widest text-[10px] shadow-lg">Save & Sync Hub</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
         </div>
    );
};

export default EditMatchModal;
