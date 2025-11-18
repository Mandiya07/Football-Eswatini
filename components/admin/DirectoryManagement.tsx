import React, { useState, useEffect } from 'react';
import { addDirectoryEntry, deleteDirectoryEntry, fetchDirectoryEntries, updateDirectoryEntry } from '../../services/api';
import { DirectoryEntity } from '../../data/directory';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import DirectoryFormModal from './DirectoryFormModal';

const DirectoryManagement: React.FC = () => {
    const [entries, setEntries] = useState<DirectoryEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DirectoryEntity | null>(null);

    const loadEntries = async () => {
        setLoading(true);
        const data = await fetchDirectoryEntries();
        setEntries(data);
        setLoading(false);
    };

    useEffect(() => {
        loadEntries();
    }, []);

    const handleAddNew = () => {
        setEditingEntry(null);
        setIsModalOpen(true);
    };

    const handleEdit = (entry: DirectoryEntity) => {
        setEditingEntry(entry);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this directory entry?")) {
            await deleteDirectoryEntry(id);
            loadEntries();
        }
    };

    const handleSave = async (data: Omit<DirectoryEntity, 'id'>, id?: string) => {
        if (id) {
            await updateDirectoryEntry(id, data);
        } else {
            await addDirectoryEntry(data);
        }
        setIsModalOpen(false);
        loadEntries();
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-2xl font-bold font-display">Directory Management</h3>
                        <Button onClick={handleAddNew} className="bg-primary text-white hover:bg-primary-dark inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Entry
                        </Button>
                    </div>
                    
                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-3">
                            {entries.map(entry => (
                                <div key={entry.id} className="p-3 bg-white border rounded-lg flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{entry.name}</p>
                                        <p className="text-xs text-gray-500">{entry.category} &bull; {entry.region}</p>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <Button onClick={() => handleEdit(entry)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4" /></Button>
                                        <Button onClick={() => handleDelete(entry.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"><TrashIcon className="w-4 h-4" /></Button>
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