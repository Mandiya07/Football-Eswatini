import React, { useState, useEffect, useMemo } from 'react';
import { CompetitionFixture, Team, MatchEvent } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PhotoIcon from '../icons/PhotoIcon';
import RefreshIcon from '../icons/RefreshIcon';
import WhistleIcon from '../icons/WhistleIcon';

interface EditMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedMatch: CompetitionFixture) => void;
    match: CompetitionFixture;
    teams: Team[];
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ isOpen, onClose, onSave, match, teams }) => {
    const [formData, setFormData] = useState<CompetitionFixture>({ ...match });
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

    useEffect(() => {
        setFormData({ ...match });
        setEvents(match.events || []);
        setGalleryImages(match.galleryImages || []);
    }, [match, isOpen]);
    
    const teamAObj = useMemo(() => teams.find(t => t.name === formData.teamA), [teams, formData.teamA]);
    const teamBObj = useMemo(() => teams.find(t => t.name === formData.teamB), [teams, formData.teamB]);

    const activeRoster = useMemo(() => {
        if (newEvent.teamSide === 'home') return teamAObj?.players || [];
        if (newEvent.teamSide === 'away') return teamBObj?.players || [];
        return [];
    }, [newEvent.teamSide, teamAObj, teamBObj]);

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
        if (!newEvent.description) {
            alert("Please enter a description for the event.");
            return;
        }
        
        const teamName = newEvent.teamSide === 'home' ? formData.teamA : 
                         newEvent.teamSide === 'away' ? formData.teamB : undefined;

        const playerNameTrimmed = newEvent.playerName.trim();
        const existingPlayer = activeRoster.find(p => p.name.trim().toLowerCase() === playerNameTrimmed.toLowerCase());

        const event: MatchEvent = {
            minute: newEvent.minute ? parseInt(newEvent.minute, 10) : undefined,
            type: newEvent.type,
            description: newEvent.description,
            teamName: teamName,
            playerName: playerNameTrimmed || undefined,
            playerID: existingPlayer?.id
        };
        
        setEvents(prev => [...prev, event].sort((a,b) => (a.minute || 0) - (b.minute || 0)));
        setNewEvent({ minute: '', type: 'goal', description: '', teamSide: '', playerName: '' });
    };

    const handleDeleteEvent = (index: number) => {
        setEvents(prev => prev.filter((_, i) => i !== index));
    };

    const syncScoreFromEvents = () => {
        const goalsA = events.filter(e => e.type === 'goal' && e.teamName === formData.teamA).length;
        const goalsB = events.filter(e => e.type === 'goal' && e.teamName === formData.teamB).length;
        setFormData(prev => ({ ...prev, scoreA: goalsA, scoreB: goalsB }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setGalleryImages(prev => [...prev, reader.result as string]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (index: number) => {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
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
         <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800" aria-label="Close edit form"><XIcon className="w-6 h-6" /></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">Edit Match Details</h2>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><WhistleIcon className="w-4 h-4" /> Match Referee</label>
                            <input type="text" name="referee" value={formData.referee || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Thulani Sibandze" />
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
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-700">Scoreline</label>
                                    <button 
                                        type="button" 
                                        onClick={syncScoreFromEvents} 
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                                    >
                                        <RefreshIcon className="w-3 h-3" /> Sync from Events
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Home ({formData.teamA})</label>
                                        <input type="number" name="scoreA" value={formData.scoreA ?? ''} onChange={handleNumberChange} className={inputClass} min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Away ({formData.teamB})</label>
                                        <input type="number" name="scoreB" value={formData.scoreB ?? ''} onChange={handleNumberChange} className={inputClass} min="0" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="border-t pt-4 mt-4">
                             <h3 className="font-bold text-lg mb-2 text-gray-800">Match Events</h3>
                             <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                                <div className="grid grid-cols-[60px_1fr_1fr] gap-2 mb-2">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Min</label>
                                        <input type="number" value={newEvent.minute} onChange={e => setNewEvent({...newEvent, minute: e.target.value})} className="p-2 border rounded text-sm w-full" placeholder="?" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Type</label>
                                        <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="p-2 border rounded text-sm w-full">
                                            <option value="goal">Goal</option>
                                            <option value="yellow-card">Yellow Card</option>
                                            <option value="red-card">Red Card</option>
                                            <option value="substitution">Substitution</option>
                                            <option value="info">Info/Status</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500">Team</label>
                                        <select value={newEvent.teamSide} onChange={e => setNewEvent({...newEvent, teamSide: e.target.value as 'home' | 'away' | ''})} className="p-2 border rounded text-sm w-full">
                                            <option value="">-- Select --</option>
                                            <option value="home">{formData.teamA}</option>
                                            <option value="away">{formData.teamB}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="text-xs font-bold text-gray-500">Player Name</label>
                                    <input 
                                        type="text" 
                                        value={newEvent.playerName} 
                                        onChange={e => setNewEvent({...newEvent, playerName: e.target.value})} 
                                        className="p-2 border rounded text-sm w-full" 
                                        placeholder="e.g. Kenneth Moloto"
                                        disabled={!newEvent.teamSide}
                                    />
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <label className="text-xs font-bold text-gray-500">Description</label>
                                        <input type="text" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="p-2 border rounded text-sm w-full" />
                                    </div>
                                    <Button type="button" onClick={handleAddEvent} className="bg-blue-600 text-white h-9 px-3 mb-0.5"><PlusCircleIcon className="w-5 h-5"/></Button>
                                </div>
                             </div>
                             
                             <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 border rounded p-2">
                                 {events.length > 0 ? events.map((ev, idx) => (
                                     <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded shadow-sm">
                                         <div className="flex gap-2 overflow-hidden">
                                             <span className="font-bold w-8 text-center flex-shrink-0">{ev.minute ? `${ev.minute}'` : '-'}</span>
                                             <span className={`uppercase text-xs font-bold px-1 rounded flex items-center flex-shrink-0 h-fit ${ev.type === 'goal' ? 'bg-green-100 text-green-800' : ev.type.includes('card') ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{ev.type}</span>
                                             <span className="truncate">{ev.description}</span>
                                         </div>
                                         <button type="button" onClick={() => handleDeleteEvent(idx)} className="text-red-500 hover:text-red-700 flex-shrink-0"><TrashIcon className="w-4 h-4"/></button>
                                     </div>
                                 )) : <p className="text-xs text-gray-400 text-center">No events added yet.</p>}
                             </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-bold text-lg mb-2 text-gray-800 flex items-center gap-2">
                                <PhotoIcon className="w-5 h-5 text-gray-600"/> Match Gallery
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-md border">
                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md shadow-sm text-sm font-medium inline-flex items-center gap-2 mb-4">
                                    <PlusCircleIcon className="w-4 h-4" /> Add Photos
                                    <input type="file" onChange={handleImageUpload} accept="image/*" className="sr-only" />
                                </label>
                                
                                {galleryImages.length > 0 ? (
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="relative flex-shrink-0 w-24 h-24 group">
                                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover rounded-md border" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic">No images in gallery yet.</p>
                                )}
                            </div>
                        </div>

                         <div className="flex justify-end gap-2 pt-4 mt-2 border-t">
                            <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
         </div>
    );
};

export default EditMatchModal;