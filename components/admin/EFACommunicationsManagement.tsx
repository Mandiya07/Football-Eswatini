import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchEFACommunications, addEFACommunication, updateEFACommunication, deleteEFACommunication, EFACommunication } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import AdminPreviewModal from './AdminPreviewModal';

const EFACommunicationsManagement: React.FC = () => {
    const { user } = useAuth();
    const [communications, setCommunications] = useState<EFACommunication[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<EFACommunication>>({});
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await fetchEFACommunications();
        setCommunications(data);
        setLoading(false);
    };

    if (!user || (!user.canAccessEFADashboard && user.role !== 'super_admin')) {
        return <div className="p-4 text-red-500 font-bold">Unauthorized access to communications management.</div>;
    }

    const handleSave = async () => {
        if (!formData.title || !formData.date || !formData.summary) return;
        
        if (isEditing === 'new') {
            await addEFACommunication(formData as Omit<EFACommunication, 'id'>);
        } else if (isEditing) {
            await updateEFACommunication(isEditing, formData);
        }
        
        setIsEditing(null);
        setFormData({});
        loadData();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this communication?')) {
            await deleteEFACommunication(id);
            loadData();
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">Manage Communications</h3>
                <Button onClick={() => { setIsEditing('new'); setFormData({ category: 'Governance', iconType: 'file' }); }}>
                    <PlusCircleIcon className="w-4 h-4 mr-2" /> Add Notice
                </Button>
            </div>

            {isEditing && (
                <Card className="bg-slate-50 border-blue-100">
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Title</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Date</label>
                                <input type="text" placeholder="e.g. April 25, 2024" className="w-full border p-2 rounded" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Category</label>
                                <input type="text" className="w-full border p-2 rounded" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Icon Type</label>
                                <select className="w-full border p-2 rounded" value={formData.iconType || 'file'} onChange={e => setFormData({...formData, iconType: e.target.value as any})}>
                                    <option value="file">File</option>
                                    <option value="shield">Shield</option>
                                    <option value="building">Building</option>
                                    <option value="megaphone">Megaphone</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1">Summary</label>
                            <textarea className="w-full border p-2 rounded h-24" value={formData.summary || ''} onChange={e => setFormData({...formData, summary: e.target.value})} />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => setIsPreviewOpen(true)}>
                                Preview Notice
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
                type="communication"
                data={formData}
            />

            <div className="space-y-4">
                {communications.map(comm => (
                    <Card key={comm.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold">{comm.title}</h4>
                                <p className="text-sm text-gray-500">{comm.date} • {comm.category}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setIsEditing(comm.id); setFormData(comm); }}><PencilIcon className="w-4 h-4" /></Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(comm.id)}><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default EFACommunicationsManagement;
