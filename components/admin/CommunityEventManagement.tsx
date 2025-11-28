
import React, { useState, useEffect } from 'react';
import { CommunityEvent, fetchAllCommunityEvents, updateCommunityEventStatus, deleteCommunityEvent, handleFirestoreError } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import XIcon from '../icons/XIcon';
import TrashIcon from '../icons/TrashIcon';
import CalendarIcon from '../icons/CalendarIcon';

const CommunityEventManagement: React.FC = () => {
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const loadEvents = async () => {
        setLoading(true);
        const data = await fetchAllCommunityEvents();
        setEvents(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleStatusChange = async (id: string, status: CommunityEvent['status']) => {
        try {
            await updateCommunityEventStatus(id, status);
            loadEvents();
        } catch (error) {
            handleFirestoreError(error, 'update event status');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this event?")) {
            try {
                await deleteCommunityEvent(id);
                loadEvents();
            } catch (error) {
                handleFirestoreError(error, 'delete event');
            }
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    const pendingEvents = events.filter(e => e.status === 'pending');
    const approvedEvents = events.filter(e => e.status === 'approved');

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h3 className="text-2xl font-bold font-display mb-6">Community Events Management</h3>

                <div className="mb-8">
                    <h4 className="text-lg font-bold text-yellow-700 mb-4 flex items-center gap-2">
                        Pending Approvals ({pendingEvents.length})
                    </h4>
                    {pendingEvents.length === 0 ? <p className="text-gray-500 italic">No pending events.</p> : (
                        <div className="space-y-4">
                            {pendingEvents.map(event => (
                                <div key={event.id} className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="font-bold text-gray-800">{event.title}</h5>
                                            <div className="text-sm text-gray-600 mt-1">
                                                <span className="font-semibold">{event.eventType}</span> • {event.date} @ {event.time}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                                            <div className="text-xs text-gray-500 mt-2">
                                                Organizer: {event.organizer} ({event.contactName} - {event.contactPhone})
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleStatusChange(event.id, 'approved')} className="bg-green-600 text-white h-8 px-3 text-xs flex items-center gap-1">
                                                <CheckCircleIcon className="w-4 h-4" /> Approve
                                            </Button>
                                            <Button onClick={() => handleDelete(event.id)} className="bg-red-600 text-white h-8 px-3 text-xs flex items-center gap-1">
                                                <XIcon className="w-4 h-4" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                        Active Events ({approvedEvents.length})
                    </h4>
                    {approvedEvents.length === 0 ? <p className="text-gray-500 italic">No active events.</p> : (
                        <div className="space-y-4">
                            {approvedEvents.map(event => (
                                <div key={event.id} className="border border-gray-200 p-4 rounded-lg flex justify-between items-center bg-white">
                                    <div>
                                        <h5 className="font-bold text-gray-800">{event.title}</h5>
                                        <div className="text-sm text-gray-500">
                                            {event.date} • {event.venue}
                                        </div>
                                    </div>
                                    <Button onClick={() => handleDelete(event.id)} className="bg-gray-100 text-red-600 hover:bg-red-50 h-8 w-8 p-0 flex items-center justify-center rounded">
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CommunityEventManagement;
