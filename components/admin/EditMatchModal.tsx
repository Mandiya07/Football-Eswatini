
import React, { useState, useEffect, useMemo } from 'react';
import { CompetitionFixture, Team, MatchEvent, Player } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PhotoIcon from '../icons/PhotoIcon';

interface EditMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedMatch: CompetitionFixture) => void;
    match: CompetitionFixture;
    teams: Team[];
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ isOpen, onClose, onSave, match, teams }) => {
    const [formData, setFormData] = useState<CompetitionFixture>({ ...match });
    
    // Events State
    const [events, setEvents] = useState<MatchEvent[]>(match.events || []);
    const [newEvent, setNewEvent] = useState<{minute: string, type: MatchEvent['type'], description: string}>({
        minute: '', type: 'goal', description: ''
    });

    // Gallery State
    const [galleryImages, setGalleryImages] = useState<string[]>(match.galleryImages || []);

    useEffect(() => {
        setFormData({ ...match });
        setEvents(match.events || []);
        setGalleryImages(match.galleryImages || []);
    }, [match, isOpen]);
    
    // Find team objects for player selection
    const teamAObj = useMemo(() => teams.find(t => t.name === formData.teamA), [teams, formData.teamA]);
    const teamBObj = useMemo(() => teams.find(t => t.name === formData.teamB), [teams, formData.teamB]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? undefined : parseInt(value, 10)
        }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value; // YYYY-MM-DD
        if(!dateStr) return;
        const dateObj = new Date(dateStr);
        setFormData(prev => ({
            ...prev,
            fullDate: dateStr,
            date: dateObj.getDate().toString(),
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
        }));
    }

    // --- Events Logic ---
    const handleAddEvent = () => {
        if (!newEvent.minute || !newEvent.description) return;
        
        const event: MatchEvent = {
            minute: parseInt(newEvent.minute, 10),
            type: newEvent.type,
            description: newEvent.description
        };
        
        setEvents(prev => [...prev, event].sort((a,b) => a.minute - b.minute));
        setNewEvent({ minute: '', type: 'goal', description: '' });
    };

    const handleDeleteEvent = (index: number) => {
        setEvents(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuickDescription = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const playerId = parseInt(e.target.value, 10);
        if (!playerId) return;
        
        let player: Player | undefined;
        let teamName = '';
        
        // Search in Team A
        player = teamAObj?.players?.find(p => p.id === playerId);
        if (player) teamName = teamAObj?.name || '';
        
        // Search in Team B
        if (!player) {
            player = teamBObj?.players?.find(p => p.id === playerId);
            if (player) teamName = teamBObj?.name || '';
        }

        if (player) {
            const prefix = newEvent.type === 'goal' ? 'Goal by' : 
                           newEvent.type === 'yellow-card' ? 'Yellow Card for' :
                           newEvent.type === 'red-card' ? 'Red Card for' :
                           newEvent.type === 'substitution' ? 'Substitution:' : 'Event:';
            
            setNewEvent(prev => ({
                ...prev, 
                description: `${prefix} ${player!.name} (${teamName})`
            }));
        }
    };

    // --- Gallery Logic ---
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
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
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

                        {(formData.status === 'finished' || formData.status === 'live' || formData.status === 'abandoned') && (
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Score</label>
                                    <input type="number" name="scoreA" value={formData.scoreA ?? ''} onChange={handleNumberChange} className={inputClass} min="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Away Score</label>
                                    <input type="number" name="scoreB" value={formData.scoreB ?? ''} onChange={handleNumberChange} className={inputClass} min="0" />
                                </div>
                            </div>
                        )}
                        
                        {/* Match Events Section */}
                        <div className="border-t pt-4 mt-4">
                             <h3 className="font-bold text-lg mb-2 text-gray-800">Match Events (Goals, Cards, Subs)</h3>
                             <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                                <div className="grid grid-cols-[80px_120px_1fr] gap-2 mb-2">
                                    <input type="number" placeholder="Min" value={newEvent.minute} onChange={e => setNewEvent({...newEvent, minute: e.target.value})} className="p-2 border rounded text-sm" />
                                    <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="p-2 border rounded text-sm">
                                        <option value="goal">Goal</option>
                                        <option value="yellow-card">Yellow Card</option>
                                        <option value="red-card">Red Card</option>
                                        <option value="substitution">Substitution</option>
                                        <option value="info">Info</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Description (e.g. Goal by Moloto)" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="p-2 border rounded text-sm w-full" />
                                        <Button type="button" onClick={handleAddEvent} className="bg-blue-600 text-white h-9 px-3"><PlusCircleIcon className="w-5 h-5"/></Button>
                                    </div>
                                </div>
                                {/* Quick Player Selector Helper */}
                                <div className="flex gap-2 items-center text-xs text-gray-600">
                                    <span>Quick Fill from Roster:</span>
                                    <select onChange={handleQuickDescription} className="border rounded p-1 max-w-[150px]">
                                        <option value="">Select Player</option>
                                        <optgroup label={teamAObj?.name || 'Home Team'}>
                                            {teamAObj?.players?.map(p => <option key={p.id} value={p.id}>{p.number} - {p.name}</option>)}
                                        </optgroup>
                                        <optgroup label={teamBObj?.name || 'Away Team'}>
                                            {teamBObj?.players?.map(p => <option key={p.id} value={p.id}>{p.number} - {p.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                             </div>
                             
                             <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 border rounded p-2">
                                 {events.length > 0 ? events.map((ev, idx) => (
                                     <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded shadow-sm">
                                         <div className="flex gap-2">
                                             <span className="font-bold w-8 text-center">{ev.minute}'</span>
                                             <span className={`uppercase text-xs font-bold px-1 rounded flex items-center ${ev.type === 'goal' ? 'bg-green-100 text-green-800' : ev.type.includes('card') ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{ev.type}</span>
                                             <span>{ev.description}</span>
                                         </div>
                                         <button type="button" onClick={() => handleDeleteEvent(idx)} className="text-red-500 hover:text-red-700"><XIcon className="w-4 h-4"/></button>
                                     </div>
                                 )) : <p className="text-xs text-gray-400 text-center">No events added yet.</p>}
                             </div>
                        </div>

                        {/* Match Gallery Section */}
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