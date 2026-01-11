
import React, { useState, useEffect, useMemo } from 'react';
import { Category, fetchCategories, deleteCategory, updateCategory, fetchAllCompetitions, fetchYouthData, handleFirestoreError } from '../../services/api';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import ImageIcon from '../icons/ImageIcon';
import XIcon from '../icons/XIcon';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import { db } from '../../services/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { compressImage, removeUndefinedProps } from '../../services/utils';

interface CompetitionSummary {
    id: string;
    name: string;
    logoUrl?: string;
    categoryId: string | null;
    externalApiId?: string;
    source?: 'competition' | 'youth';
}

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [entities, setEntities] = useState<CompetitionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // UI State
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isCompModalOpen, setIsCompModalOpen] = useState(false);
    const [editingComp, setEditingComp] = useState<CompetitionSummary | null>(null);
    
    // Forms
    const [catForm, setCatForm] = useState({ name: '', order: 100, logoUrl: '' });
    const [compForm, setCompForm] = useState({ name: '', logoUrl: '', categoryId: '', externalApiId: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [catData, compData, youthData] = await Promise.all([
                fetchCategories(),
                fetchAllCompetitions(),
                fetchYouthData()
            ]);
            
            setCategories(catData);
            
            // Standard Competitions
            const compArray = Object.entries(compData)
                .filter(([_, comp]) => comp && comp.name)
                .map(([id, comp]) => ({
                    id,
                    name: comp.name!,
                    logoUrl: comp.logoUrl,
                    categoryId: comp.categoryId || null,
                    externalApiId: comp.externalApiId,
                    source: 'competition' as const
                }));

            // Youth Competitions (Special Handling)
            const youthArray = youthData.map(y => ({
                id: y.id,
                name: y.name,
                logoUrl: y.logoUrl,
                // Default youth items to 'development' if not categorized
                categoryId: (y as any).categoryId || 'development',
                source: 'youth' as const
            }));

            const allEntities = [...compArray, ...youthArray];
            setEntities(allEntities.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
            
        } catch (err) { handleFirestoreError(err, 'load categories'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
    }, []);
    
    const groupedEntities = useMemo(() => {
        const groups: Record<string, CompetitionSummary[]> = { 'uncategorized': [] };
        categories.forEach(c => { groups[c.id] = []; });
        entities.forEach(ent => {
            if (ent.categoryId && groups[ent.categoryId]) groups[ent.categoryId].push(ent);
            else groups['uncategorized'].push(ent);
        });
        return groups;
    }, [categories, entities]);

    const openCatModal = (cat?: Category) => {
        if (cat) {
            setEditingCategory(cat);
            setCatForm({ name: cat.name, order: cat.order, logoUrl: cat.logoUrl || '' });
        } else {
            setEditingCategory(null);
            setCatForm({ name: '', order: (categories[categories.length-1]?.order || 0) + 10, logoUrl: '' });
        }
        setIsCatModalOpen(true);
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, catForm);
            } else {
                const newId = catForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                await addDoc(collection(db, 'categories'), { ...catForm, id: newId });
            }
            setIsCatModalOpen(false);
            loadData();
        } catch (err) { handleFirestoreError(err, 'save category'); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm("Delete this category? Any linked entities will become uncategorized.")) return;
        setIsSubmitting(true);
        try {
            await deleteCategory(id);
            loadData();
        } catch(err) { handleFirestoreError(err, 'delete category'); }
        finally { setIsSubmitting(false); }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cat' | 'comp') => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await compressImage(e.target.files[0], 400, 0.7);
                if (type === 'cat') setCatForm(prev => ({ ...prev, logoUrl: base64 }));
                else setCompForm(prev => ({ ...prev, logoUrl: base64 }));
            } catch (err) { console.error(err); }
        }
    };

    const openCompModal = (ent: CompetitionSummary) => {
        setEditingComp(ent);
        setCompForm({
            name: ent.name,
            logoUrl: ent.logoUrl || '',
            categoryId: ent.categoryId || '',
            externalApiId: ent.externalApiId || ''
        });
        setIsCompModalOpen(true);
    };

    const handleSaveEntity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComp) return;
        setIsSubmitting(true);
        try {
            const collectionName = editingComp.source === 'youth' ? 'youth' : 'competitions';
            const docRef = doc(db, collectionName, editingComp.id);
            
            const updates: any = {
                name: compForm.name,
                logoUrl: compForm.logoUrl,
                categoryId: compForm.categoryId || null
            };
            
            if (editingComp.source === 'competition') {
                updates.externalApiId = compForm.externalApiId || null;
            }

            await updateDoc(docRef, removeUndefinedProps(updates));
            setIsCompModalOpen(false);
            loadData();
        } catch (err) { handleFirestoreError(err, 'save entity'); }
        finally { setIsSubmitting(false); }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="shadow-lg border-0 overflow-hidden">
                <div className="bg-primary p-6 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold font-display">Categorization & Taxonomy</h3>
                        <p className="text-blue-100 text-sm">Organize leagues, edit logos, and define display order. All youth competitions are shown here.</p>
                    </div>
                    <Button onClick={() => openCatModal()} className="bg-accent text-primary-dark font-black px-4 flex items-center gap-2 shadow-lg">
                        <PlusCircleIcon className="w-5 h-5" /> New Category
                    </Button>
                </div>
                
                <CardContent className="p-6">
                    {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                        <div className="space-y-8">
                            {categories.map(cat => (
                                <div key={cat.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-gray-50 p-4 flex items-center justify-between border-b border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center p-1">
                                                {cat.logoUrl ? <img src={cat.logoUrl} className="max-h-full max-w-full object-contain" alt="" /> : <ImageIcon className="w-6 h-6 text-gray-300"/>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg leading-tight">{cat.name}</h4>
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Order: {cat.order}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openCatModal(cat)} className="p-2 text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-blue-100"><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-100"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {groupedEntities[cat.id]?.map(ent => (
                                            <div key={ent.id} onClick={() => openCompModal(ent)} className={`p-3 border rounded-xl transition-all cursor-pointer flex items-center gap-3 ${ent.source === 'youth' ? 'border-green-100 bg-green-50/20 hover:border-green-300' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/30'}`}>
                                                <div className="w-8 h-8 flex items-center justify-center bg-white rounded border border-gray-100">
                                                    {ent.logoUrl ? <img src={ent.logoUrl} className="max-h-full max-w-full object-contain" /> : <ImageIcon className="w-4 h-4 text-gray-300"/>}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{ent.name}</p>
                                                    <span className={`text-[8px] font-black uppercase ${ent.source === 'youth' ? 'text-green-600' : 'text-blue-500'}`}>
                                                        {ent.source === 'youth' ? 'Youth Program' : 'Std League'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {(groupedEntities[cat.id]?.length || 0) === 0 && <p className="text-xs text-gray-400 italic py-2 col-span-full">No entities assigned to this category.</p>}
                                    </div>
                                </div>
                            ))}

                            {/* Uncategorized Section */}
                            {groupedEntities['uncategorized'].length > 0 && (
                                <div className="border border-red-100 rounded-2xl overflow-hidden bg-red-50/30">
                                    <div className="p-4 border-b border-red-100">
                                        <h4 className="font-bold text-red-800">Uncategorized Entities</h4>
                                        <p className="text-xs text-red-600">These will not appear in dynamic site sections.</p>
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {groupedEntities['uncategorized'].map(ent => (
                                            <div key={ent.id} onClick={() => openCompModal(ent)} className="p-3 border border-red-200 bg-white rounded-xl hover:border-red-400 transition-all cursor-pointer flex items-center gap-3">
                                                <img src={ent.logoUrl || 'https://via.placeholder.com/64?text=?'} className="w-8 h-8 object-contain bg-gray-50 rounded" />
                                                <span className="text-sm font-bold text-gray-800 truncate">{ent.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Category Edit Modal */}
            {isCatModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsCatModalOpen(false)}>
                    <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold mb-6">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                            <form onSubmit={handleSaveCategory} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Category Name</label>
                                    <input value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Order Position (lower = first)</label>
                                    <input type="number" value={catForm.order} onChange={e => setCatForm({...catForm, order: parseInt(e.target.value) || 0})} className={inputClass} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Category Logo</label>
                                    <div className="flex items-center gap-2">
                                        <input value={catForm.logoUrl} onChange={e => setCatForm({...catForm, logoUrl: e.target.value})} className={inputClass} placeholder="URL..." />
                                        <label className="bg-white border p-2 rounded cursor-pointer hover:bg-gray-50"><ImageIcon className="w-5 h-5 text-gray-400"/><input type="file" className="hidden" onChange={e => handleFileChange(e, 'cat')} accept="image/*" /></label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" onClick={() => setIsCatModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">{isSubmitting ? 'Saving...' : 'Save Category'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Entity Edit Modal */}
            {isCompModalOpen && editingComp && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsCompModalOpen(false)}>
                    <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <CardContent className="p-8">
                            <h3 className="text-2xl font-bold mb-6">Edit Entity Info</h3>
                            <form onSubmit={handleSaveEntity} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
                                    <input value={compForm.name} onChange={e => setCompForm({...compForm, name: e.target.value})} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Section / Category</label>
                                    <select value={compForm.categoryId} onChange={e => setCompForm({...compForm, categoryId: e.target.value})} className={inputClass}>
                                        <option value="">-- No Category --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Logo / Trophy Image</label>
                                    <div className="flex items-center gap-2">
                                        <input value={compForm.logoUrl} onChange={e => setCompForm({...compForm, logoUrl: e.target.value})} className={inputClass} placeholder="URL..." />
                                        <label className="bg-white border p-2 rounded cursor-pointer hover:bg-gray-50"><ImageIcon className="w-5 h-5 text-gray-400"/><input type="file" className="hidden" onChange={e => handleFileChange(e, 'comp')} accept="image/*" /></label>
                                    </div>
                                    {compForm.logoUrl && <img src={compForm.logoUrl} className="h-16 mx-auto mt-4 object-contain border p-2 rounded bg-gray-50" />}
                                </div>
                                {editingComp.source === 'competition' && (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">External API ID</label>
                                        <input value={compForm.externalApiId} onChange={e => setCompForm({...compForm, externalApiId: e.target.value})} className={inputClass} placeholder="e.g. 2021" />
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" onClick={() => setIsCompModalOpen(false)} className="bg-gray-100 text-gray-700">Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
