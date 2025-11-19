
import React, { useState, useEffect } from 'react';
import { CompetitionFixture, Team } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';

interface EditMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedMatch: CompetitionFixture) => void;
    match: CompetitionFixture;
    teams: Team[];
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ isOpen, onClose, onSave, match, teams }) => {
    const [formData, setFormData] = useState<CompetitionFixture>({ ...match });

    useEffect(() => {
        setFormData({ ...match });
    }, [match, isOpen]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    if (!isOpen) return null;

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-slide-up" onClick={e => e.stopPropagation()}>
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

                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                             <input type="text" name="venue" value={formData.venue || ''} onChange={handleChange} className={inputClass} />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matchday</label>
                                <input type="number" name="matchday" value={formData.matchday || ''} onChange={handleNumberChange} className={inputClass} />
                            </div>
                            <div className="col-span-2">
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

                         <div className="flex justify-end gap-2 pt-4">
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
