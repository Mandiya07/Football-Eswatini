import React, { useState, useEffect, useMemo } from 'react';
import { addDirectoryEntry, deleteDirectoryEntry, fetchDirectoryEntries, updateDirectoryEntry, fetchAllCompetitions, handleFirestoreError } from '../../services/api';
import { DirectoryEntity } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import SearchIcon from '../icons/SearchIcon';
import FilterIcon from '../icons/FilterIcon';
import RefreshIcon from '../icons/RefreshIcon';
import DirectoryFormModal from './DirectoryFormModal';

const DirectoryManagement: React.FC = () => {
    const [entries, setEntries] = useState<DirectoryEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DirectoryEntity | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const loadEntries = async () => {
        setLoading(true);
        const data = await fetchDirectoryEntries();
        setEntries(data || []);
        setLoading(false);
    };

    useEffect(() => {
        loadEntries();
    }, []);

    const filteredEntries = useMemo(() => {
        return (entries || [])
            .filter(entry => {
                if (!entry || !entry.name) return false;
                const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [entries, searchTerm, selectedCategory]);

    const handleAddNew = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (entry: DirectoryEntity) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this entry?")) {
            await deleteDirectoryEntry(id);
            loadEntries();
        }
    };

    const handleSave = async (data: any, id?: string) => {
        if (id) await updateDirectoryEntry(id, data);
        else await addDirectoryEntry(data);
        setIsModalOpen(false);
        loadEntries();
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in max-w-full overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold font-display">Directory</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white flex items-center gap-1"><PlusCircleIcon className="w-5 h-5" /> Add</Button>
                    </div>
                    
                    <div className="flex gap-2 mb-6">
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="flex-grow border rounded p-2 text-sm" />
                    </div>

                    {loading ? <Spinner /> : (
                        <div className="space-y-2">
                            {filteredEntries.map(entry => (
                                <div key={entry.id} className="p-3 bg-white border rounded flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900">{entry.name}</p>
                                        <p className="text-xs text-gray-500">{entry.category} • {entry.region}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(entry)} className="p-1 bg-blue-50 text-blue-600 rounded"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(entry.id)} className="p-1 bg-red-50 text-red-600 rounded"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && <DirectoryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} entry={editingEntry} />}
        </>
    );
};

export default DirectoryManagement;