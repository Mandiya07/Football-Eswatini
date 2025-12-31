import React, { useState, useEffect, useMemo } from 'react';
import { Category, fetchCategories, deleteCategory, fetchAllCompetitions, Competition, handleFirestoreError } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import { db } from '../../services/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import CompetitionFormModal from './CompetitionFormModal';

interface CompetitionSummary {
    id: string;
    name: string;
    logoUrl?: string;
    categoryId: string | null;
    externalApiId?: string;
}

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [competitions, setCompetitions] = useState<CompetitionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryOrder, setNewCategoryOrder] = useState(100);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompetition, setEditingCompetition] = useState<CompetitionSummary | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError('');
        const [catData, compData] = await Promise.all([
            fetchCategories(),
            fetchAllCompetitions(),
        ]);
        
        setCategories(catData);
        const compArray = Object.entries(compData)
            .filter(([_, comp]) => comp && comp.name)
            .map(([id, comp]) => ({
                id,
                name: comp.name,
                logoUrl: comp.logoUrl,
                categoryId: comp.categoryId || null,
                externalApiId: comp.externalApiId
            }));
        setCompetitions(compArray.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);
    
    const groupedCompetitions = useMemo(() => {
        const groups: Record<string, CompetitionSummary[]> = { 'uncategorized': [] };
        categories.forEach(c => { groups[c.id] = []; });
        competitions.forEach(comp => {
            if (comp.categoryId && groups[comp.categoryId]) groups[comp.categoryId].push(comp);
            else groups['uncategorized'].push(comp);
        });
        return groups;
    }, [categories, competitions]);


    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'categories'), { name: newCategoryName, order: newCategoryOrder });
            setNewCategoryName('');
            await loadData();
        } catch (err) { handleFirestoreError(err, 'add category'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm("Delete this category?")) return;
        setIsSubmitting(true);
        try {
            await deleteCategory(id);
            await loadData();
        } catch(err) { handleFirestoreError(err, 'delete category'); }
        finally { setIsSubmitting(false); }
    };

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-4">Category Management</h3>
                    <form onSubmit={handleAddCategory} className="p-4 bg-gray-50 border rounded-lg mb-6 flex gap-2">
                        <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category Name" required className="flex-grow border rounded p-2 text-sm" />
                        <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">{isSubmitting ? '...' : 'Create'}</Button>
                    </form>

                    {loading ? <Spinner /> : (
                        <div className="space-y-6">
                            {categories.map(cat => (
                                <div key={cat.id} className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 p-2 font-bold flex justify-between">{cat.name} <button onClick={() => handleDeleteCategory(cat.id)}><TrashIcon className="w-4 h-4 text-red-600"/></button></div>
                                    <div className="p-2">
                                        {groupedCompetitions[cat.id]?.map(comp => (
                                            <div key={comp.id} className="text-sm p-1">{comp.name}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default CategoryManagement;