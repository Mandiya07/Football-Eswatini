
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
        // API calls have their own error handling (alerts).
        // Here we just process the data they return.
        const [catData, compData] = await Promise.all([
            fetchCategories(),
            fetchAllCompetitions(),
        ]);
        
        // If fetchCategories failed, it will alert and return an empty array.
        // We add a specific error message for the component UI in that case.
        if (catData.length === 0 && Object.keys(compData).length > 0) { // check compData to distinguish from empty DB
            setError("Could not load categories due to a possible permissions issue. Check console for details.");
        }
        
        setCategories(catData);
        const compArray = Object.entries(compData).map(([id, comp]) => ({
            id,
            name: comp.name,
            logoUrl: comp.logoUrl,
            categoryId: comp.categoryId || null,
            externalApiId: comp.externalApiId
        }));
        setCompetitions(compArray.sort((a,b) => a.name.localeCompare(b.name)));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);
    
    const groupedCompetitions = useMemo(() => {
        const groups: Record<string, CompetitionSummary[]> = { 'uncategorized': [] };
        categories.forEach(c => {
            groups[c.id] = [];
        });

        competitions.forEach(comp => {
            if (comp.categoryId && groups[comp.categoryId]) {
                groups[comp.categoryId].push(comp);
            } else {
                groups['uncategorized'].push(comp);
            }
        });
        return groups;
    }, [categories, competitions]);


    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        setIsSubmitting(true);
        setError('');
        try {
            await addDoc(collection(db, 'categories'), { name: newCategoryName, order: newCategoryOrder });
            setNewCategoryName('');
            setNewCategoryOrder(prev => prev + 10);
            await loadData();
        } catch (err) {
            handleFirestoreError(err, 'add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this category? Competitions within it will become uncategorized.")) {
            setIsSubmitting(true);
            setError('');
            try {
                const compsToUpdate = competitions.filter(c => c.categoryId === id);
                for (const comp of compsToUpdate) {
                    const compDocRef = doc(db, 'competitions', comp.id);
                    await updateDoc(compDocRef, { categoryId: null });
                }
                
                await deleteCategory(id);
                
                await loadData();
            } catch(err) {
                // Let the API layer handle the alert for consistency.
                handleFirestoreError(err, 'delete category');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleUpdateCompetitionCategory = async (competitionId: string, newCategoryId: string) => {
        const categoryIdToSet = newCategoryId === 'uncategorized' ? null : newCategoryId;
        
        const originalCompetitions = [...competitions];
        setCompetitions(prev => prev.map(c => 
            c.id === competitionId ? { ...c, categoryId: categoryIdToSet } : c
        ));
        setError('');

        try {
            const compDocRef = doc(db, 'competitions', competitionId);
            await updateDoc(compDocRef, { categoryId: categoryIdToSet });
        } catch (error) {
            handleFirestoreError(error, 'update competition category');
            setCompetitions(originalCompetitions); // Revert UI on error
        }
    };

    const handleEditCompetition = (comp: CompetitionSummary) => {
        setEditingCompetition(comp);
        setIsModalOpen(true);
    };

    const handleSaveCompetition = async (data: Partial<Omit<Competition, 'teams' | 'fixtures' | 'results'>>, id: string) => {
        setIsSubmitting(true);
        try {
            await updateDoc(doc(db, "competitions", id), data);
            setIsModalOpen(false);
            await loadData();
        } catch (error) {
            handleFirestoreError(error, 'save competition');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <>
            <Card className="shadow-lg animate-fade-in">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-4">Category Management</h3>
                    
                    <form onSubmit={handleAddCategory} className="p-4 bg-gray-50 border rounded-lg mb-6 space-y-4">
                        <h4 className="font-bold">Create New Category</h4>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
                            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Category Name" required className={inputClass} />
                            <input type="number" value={newCategoryOrder} onChange={e => setNewCategoryOrder(parseInt(e.target.value, 10))} placeholder="Order" required className={`${inputClass} w-24`} />
                            <Button type="submit" className="bg-primary text-white hover:bg-primary-dark" disabled={isSubmitting}>
                                {isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : 'Create'}
                            </Button>
                        </div>
                    </form>

                    {error && (
                        <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-md text-sm animate-fade-in" role="alert">
                            <p className="font-bold">Operation Failed</p>
                            <p>{error}</p>
                        </div>
                    )}


                    {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
                        <div className="space-y-6">
                            {categories.map(cat => (
                                <div key={cat.id}>
                                    <div className="flex justify-between items-center bg-gray-100 p-2 rounded-t-lg border-b">
                                        <h4 className="font-bold">{cat.name}</h4>
                                        <Button onClick={() => handleDeleteCategory(cat.id)} disabled={isSubmitting} className="bg-red-100 text-red-700 h-7 w-7 p-0 flex items-center justify-center" aria-label={`Delete ${cat.name}`}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="border border-t-0 rounded-b-lg p-2 space-y-2">
                                        {groupedCompetitions[cat.id]?.length > 0 ? groupedCompetitions[cat.id].map(comp => (
                                            <div key={comp.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <Button onClick={() => handleEditCompetition(comp)} className="bg-gray-200 text-gray-600 h-6 w-6 p-0 flex items-center justify-center" aria-label={`Edit ${comp.name}`}><PencilIcon className="w-3 h-3"/></Button>
                                                    <span className="text-sm">{comp.name}</span>
                                                </div>
                                                <select 
                                                    value={comp.categoryId || 'uncategorized'} 
                                                    onChange={(e) => handleUpdateCompetitionCategory(comp.id, e.target.value)} 
                                                    className="text-xs border-gray-300 rounded-md shadow-sm"
                                                    disabled={isSubmitting}
                                                >
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    <option value="uncategorized">Uncategorized</option>
                                                </select>
                                            </div>
                                        )) : <p className="text-xs text-gray-500 p-2 italic">No competitions in this category.</p>}
                                    </div>
                                </div>
                            ))}
                            
                            {groupedCompetitions['uncategorized']?.length > 0 && (
                                <div>
                                    <h4 className="font-bold bg-gray-100 p-2 rounded-t-lg border-b">Uncategorized</h4>
                                    <div className="border border-t-0 rounded-b-lg p-2 space-y-2">
                                        {groupedCompetitions['uncategorized'].map(comp => (
                                            <div key={comp.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <Button onClick={() => handleEditCompetition(comp)} className="bg-gray-200 text-gray-600 h-6 w-6 p-0 flex items-center justify-center" aria-label={`Edit ${comp.name}`}><PencilIcon className="w-3 h-3"/></Button>
                                                    <span className="text-sm">{comp.name}</span>
                                                </div>
                                                <select 
                                                    value="uncategorized" 
                                                    onChange={(e) => handleUpdateCompetitionCategory(comp.id, e.target.value)}
                                                    className="text-xs border-gray-300 rounded-md shadow-sm"
                                                    disabled={isSubmitting}
                                                >
                                                    <option value="uncategorized" disabled>Select Category</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {isModalOpen && editingCompetition && (
                <CompetitionFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCompetition}
                    competition={editingCompetition}
                />
            )}
        </>
    );
};

export default CategoryManagement;
