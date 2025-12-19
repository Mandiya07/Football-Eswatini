import React, { useState, useEffect } from 'react';
import { fetchHybridTournaments, addHybridTournament, updateHybridTournament, deleteHybridTournament, handleFirestoreError } from '../../services/api';
import { HybridTournament } from '../../data/international';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import GlobeIcon from '../icons/GlobeIcon';
import HybridTournamentFormModal from './HybridTournamentFormModal';

const HybridTournamentManagement: React.FC = () => {
    const [tournaments, setTournaments] = useState<HybridTournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<HybridTournament | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchHybridTournaments();
            setTournaments(data);
        } catch (error) {
            console.error("Failed to load hybrid tournaments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: HybridTournament) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this international tournament? This action cannot be undone.")) return;
        try {
            await deleteHybridTournament(id);
            loadData();
        } catch (error) {
            handleFirestoreError(error, 'delete hybrid tournament');
        }
    };

    const handleSave = async (data: Omit<HybridTournament, 'id'>, id?: string) => {
        try {
            if (id) {
                await updateHybridTournament(id, data);
            } else {
                await addHybridTournament(data);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            handleFirestoreError(error, 'save hybrid tournament');
            alert("Failed to save tournament.");
        }
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <GlobeIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold font-display">International Hub Manager</h3>
                                <p className="text-sm text-gray-500">Manage multi-stage tournaments like CAF CL or World Cup Qualifiers.</p>
                            </div>
                        </div>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Tournament
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                        <div className="grid grid-cols-1 gap-4">
                            {tournaments.length > 0 ? tournaments.map(item => (
                                <div key={item.id} className="p-4 bg-white border rounded-xl flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <img src={item.logoUrl || 'https://via.placeholder.com/64?text=Cup'} alt="" className="w-12 h-12 object-contain bg-gray-50 rounded p-1 border" />
                                        <div>
                                            <p className="font-bold text-lg text-gray-900">{item.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{item.groups?.length || 0} Groups</span>
                                                <span>•</span>
                                                <span>{item.matches?.length || 0} Matches</span>
                                                {item.externalApiId && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-purple-600 font-bold">API ID: {item.externalApiId}</span>
                                                    </>
                                                )}
                                                {item.bracketId && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-blue-600 font-bold">Knockout Linked</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={() => handleEdit(item)} className="bg-blue-100 text-blue-700 h-9 w-9 p-0 flex items-center justify-center rounded-full"><PencilIcon className="w-4 h-4" /></Button>
                                        <Button onClick={() => handleDelete(item.id)} className="bg-red-100 text-red-700 h-9 w-9 p-0 flex items-center justify-center rounded-full"><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                    <p className="text-gray-500">No international tournaments created yet.</p>
                                    <Button onClick={handleAddNew} className="mt-4 bg-gray-100 text-gray-700 hover:bg-gray-200">Create Your First Tournament</Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <HybridTournamentFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} tournament={editingItem} />}
        </>
    );
};

export default HybridTournamentManagement;