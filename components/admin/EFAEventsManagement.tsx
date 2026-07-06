import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchEFAEvents, addEFAEvent, updateEFAEvent, deleteEFAEvent, EFAEvent } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import AdminPreviewModal from './AdminPreviewModal';

const EFAEventsManagement: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<EFAEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<EFAEvent>>({});
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchEFAEvents();
        setEvents(data);
        setLoading(false);
    };

    if (!user || (!user.canAccessEFADashboard && user.role !== 'super_admin')) {
        return <div className="p-4 text-red-500 font-bold">Unauthorized access to events management.</div>;
    }

    const handleSave = async () => {
        if (!formData.event || !formData.date || !formData.location) return;
        
        if (isEditing === 'new') {
            await addEFAEvent(formData as Omit<EFAEvent, 'id'>);
        } else if (isEditing) {
            await updateEFAEvent(isEditing, formData);
        }
        
        setIsEditing(null);
        setFormData({});
        loadData();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            await deleteEFAEvent(id);
            loadData();
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">Manage Upcoming Events</h3>
                <Button onClick={() => { setIsEditing('new'); setFormData({}); }}>
                    <PlusCircleIcon className="w-4 h-4 mr-2" /> Add Event
                </Button>
            </div>

            {isEditing && (
                <Card className="bg-slate-50 border-blue-100">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold mb-1">Event Name</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.event || ''} onChange={e => setFormData({...formData, event: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Date</label>
                                <input type="text" placeholder="e.g. 15 May" className="w-full border p-2 rounded" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Location</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setIsPreviewOpen(true)}>
                                Preview Event
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(null)}>Cancel</Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <AdminPreviewModal 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                type="event"
                data={formData}
            />

            <div className="space-y-4">
                {events.map(ev => (
                    <Card key={ev.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">{ev.event}</h4>
                                <p className="text-sm text-gray-500">{ev.date} • {ev.location}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setIsEditing(ev.id); setFormData(ev); }}><PencilIcon className="w-4 h-4" /></Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(ev.id)}><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EFAEventsManagement;
