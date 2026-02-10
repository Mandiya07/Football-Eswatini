
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { fetchAllCompetitions, handleFirestoreError, Competition } from '../../services/api';
import { db } from '../../services/firebase';
import { doc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import SearchIcon from '../icons/SearchIcon';
import TrophyIcon from '../icons/TrophyIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import PencilIcon from '../icons/PencilIcon';
import TrashIcon from '../icons/TrashIcon';
import UsersIcon from '../icons/UsersIcon';
import CalendarIcon from '../icons/CalendarIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import CompetitionFormModal from './CompetitionFormModal';
import { removeUndefinedProps } from '../../services/utils';

interface CompetitionItem extends Competition {
    id: string;
}

const CompetitionManager: React.FC = () => {
    const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComp, setEditingComp] = useState<CompetitionItem | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchAllCompetitions();
            const list = Object.entries(data).map(([id, comp]) => ({
                id,
                ...comp
            } as CompetitionItem));
            setCompetitions(list.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Failed to load competitions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredCompetitions = useMemo(() => {
        return competitions.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [competitions, searchTerm]);

    const handleAddNew = () => {
        setEditingComp(null);
        setIsModalOpen(true);
    };

    const handleEdit = (comp: CompetitionItem) => {
        setEditingComp(comp);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this competition? This will remove all associated teams, fixtures, and results. This action is irreversible.")) return;
        
        setProcessingId(id);
        try {
            await deleteDoc(doc(db, 'competitions', id));
            setCompetitions(prev => prev.filter(c => c.id !== id));
            alert("Competition deleted successfully.");
        } catch (error) {
            handleFirestoreError(error, 'delete competition');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSave = async (data: Partial<Omit<Competition, 'teams' | 'fixtures' | 'results'>>, id: string) => {
        setLoading(true);
        try {
            const docRef = doc(db, 'competitions', id);
            await setDoc(docRef, removeUndefinedProps(data), { merge: true });
            setIsModalOpen(false);
            await loadData();
        } catch (error) {
            handleFirestoreError(error, 'save competition');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div>
                            <h3 className="text-2xl font-bold font-display text-gray-800">League & Tournament Center</h3>
                            <p className="text-sm text-gray-600">Global control for all competition metadata and structures.</p>
                        </div>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> New League
                        </Button>
                    </div>

                    <div className="relative mb-6">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Filter by name or ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><Spinner /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredCompetitions.length > 0 ? filteredCompetitions.map(comp => (
                                <div key={comp.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center p-2 border border-gray-100 group-hover:border-primary/30 transition-colors">
                                                {comp.logoUrl ? (
                                                    <img src={comp.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                                                ) : (
                                                    <TrophyIcon className="w-8 h-8 text-gray-300" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 line-clamp-1">{comp.name}</h4>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{comp.id}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <UsersIcon className="w-3 h-3" /> {comp.teams?.length || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                                        <CalendarIcon className="w-3 h-3" /> {(comp.fixtures?.length || 0) + (comp.results?.length || 0)}
                                                    </span>
                                                    {comp.externalApiId && (
                                                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">API Linked</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => handleEdit(comp)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Settings"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(comp.id)}
                                                disabled={processingId === comp.id}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Competition"
                                            >
                                                {processingId === comp.id ? <Spinner className="w-4 h-4 border-2 border-red-600"/> : <TrashIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl">
                                    <p className="text-gray-500">No competitions found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {isModalOpen && (
                <CompetitionFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    competition={editingComp ? {
                        id: editingComp.id,
                        name: editingComp.name,
                        logoUrl: editingComp.logoUrl,
                        externalApiId: editingComp.externalApiId
                    } : { id: '', name: '' }}
                />
            )}
        </div>
    );
};

export default CompetitionManager;
