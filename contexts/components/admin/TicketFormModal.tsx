import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import XIcon from '../icons/XIcon';
import { fetchAllCompetitions } from '../../services/api';
import { Competition, CompetitionFixture } from '../../data/teams';
import Spinner from '../ui/Spinner';

interface TicketFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

const TicketFormModal: React.FC<TicketFormModalProps> = ({ isOpen, onClose, onSave }) => {
    const [competitions, setCompetitions] = useState<{ id: string, name: string, fixtures: CompetitionFixture[] }[]>([]);
    const [selectedComp, setSelectedComp] = useState('');
    const [selectedFixtureId, setSelectedFixtureId] = useState('');
    const [price, setPrice] = useState('');
    const [purchaseUrl, setPurchaseUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const allComps = await fetchAllCompetitions();
            const list = Object.entries(allComps).map(([id, c]) => ({
                id,
                name: c.name,
                fixtures: (c.fixtures || []).filter(f => f.status === 'scheduled')
            }));
            setCompetitions(list);
            setLoading(false);
        };
        load();
    }, [isOpen]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComp || !selectedFixtureId || !price) return;

        const comp = competitions.find(c => c.id === selectedComp);
        const fixture = comp?.fixtures.find(f => String(f.id) === selectedFixtureId);
        
        if (!comp || !fixture) return;

        onSave({
            fixtureId: fixture.id,
            competitionId: comp.id,
            teamA: fixture.teamA,
            teamB: fixture.teamB,
            date: fixture.fullDate || new Date().toISOString().split('T')[0],
            time: fixture.time || '15:00',
            venue: fixture.venue || 'TBA',
            price: parseFloat(price),
            purchaseUrl: purchaseUrl || undefined,
            status: 'available'
        });
    };

    if (!isOpen) return null;
    
    const activeFixtures = competitions.find(c => c.id === selectedComp)?.fixtures || [];

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto animate-fade-in" onClick={onClose}>
            <Card className="w-full max-w-md mb-8 relative animate-slide-up" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"><XIcon className="w-6 h-6"/></button>
                <CardContent className="p-8">
                    <h2 className="text-2xl font-bold font-display mb-6">Add Match Ticket</h2>
                    
                    {loading ? <div className="flex justify-center"><Spinner /></div> : (
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Competition</label>
                                <select 
                                    value={selectedComp} 
                                    onChange={e => { setSelectedComp(e.target.value); setSelectedFixtureId(''); }} 
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>Select Competition</option>
                                    {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Fixture</label>
                                <select 
                                    value={selectedFixtureId} 
                                    onChange={e => setSelectedFixtureId(e.target.value)} 
                                    className={inputClass}
                                    required
                                    disabled={!selectedComp}
                                >
                                    <option value="" disabled>Select Fixture</option>
                                    {activeFixtures.map(f => (
                                        <option key={f.id} value={f.id}>{f.teamA} vs {f.teamB} ({f.date})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price (SZL)</label>
                                <input 
                                    type="number" 
                                    value={price} 
                                    onChange={e => setPrice(e.target.value)} 
                                    className={inputClass} 
                                    placeholder="e.g. 50" 
                                    min="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Link (Optional)</label>
                                <input 
                                    type="url" 
                                    value={purchaseUrl} 
                                    onChange={e => setPurchaseUrl(e.target.value)} 
                                    className={inputClass} 
                                    placeholder="Link to external booking site" 
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" onClick={onClose} className="bg-gray-200 text-gray-800">Cancel</Button>
                                <Button type="submit" className="bg-green-600 text-white">List Ticket</Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TicketFormModal;