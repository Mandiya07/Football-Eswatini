
import React, { useState, useEffect } from 'react';
import { fetchRefereesData, updateRefereesData, handleFirestoreError } from '../../services/api';
import { Referee, Rule } from '../../data/referees';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import SaveIcon from '../icons/SaveIcon';
import RefereeFormModal from './RefereeFormModal';
import StarIcon from '../icons/StarIcon';

const RefereeManagement: React.FC = () => {
    const [referees, setReferees] = useState<Referee[]>([]);
    const [rule, setRule] = useState<Rule>({ id: '', title: '', summary: '', explanation: '' });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReferee, setEditingReferee] = useState<Referee | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await fetchRefereesData();
            setReferees(data.referees);
            setRule(data.ruleOfTheWeek);
        } catch (error) {
            console.error("Failed to load referee data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddReferee = () => {
        setEditingReferee(null);
        setIsModalOpen(true);
    };

    const handleEditReferee = (referee: Referee) => {
        setEditingReferee(referee);
        setIsModalOpen(true);
    };

    const handleDeleteReferee = async (id: string) => {
        if (!window.confirm("Delete this referee profile?")) return;
        const updatedReferees = referees.filter(r => r.id !== id);
        await saveData(updatedReferees, rule);
    };

    const handleSaveReferee = async (data: Partial<Referee>, id?: string) => {
        let updatedReferees = [...referees];
        
        if (id) {
            updatedReferees = updatedReferees.map(r => r.id === id ? { ...r, ...data } as Referee : r);
        } else {
            const newReferee = { 
                ...data, 
                id: `ref-${Date.now()}`,
                stats: data.stats || { matches: 0, yellowCards: 0, redCards: 0 }
            } as Referee;
            updatedReferees.push(newReferee);
        }

        // Ensure only one spotlight if the new/edited one is set to true (optional logic, but good UX)
        if (data.isSpotlight) {
            updatedReferees = updatedReferees.map(r => r.id === (id || updatedReferees[updatedReferees.length-1].id) ? r : { ...r, isSpotlight: false });
        }

        await saveData(updatedReferees, rule);
        setIsModalOpen(false);
    };

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveData(referees, rule);
        alert("Rule of the Week updated!");
    };

    const saveData = async (updatedReferees: Referee[], updatedRule: Rule) => {
        setIsSubmitting(true);
        try {
            await updateRefereesData({ referees: updatedReferees, ruleOfTheWeek: updatedRule });
            setReferees(updatedReferees);
            setRule(updatedRule);
        } catch (error) {
            handleFirestoreError(error, 'save referee data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Rule of the Week Section */}
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-bold font-display mb-4">Manage Rule of the Week</h3>
                    <form onSubmit={handleSaveRule} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Title</label>
                            <input 
                                type="text" 
                                value={rule.title} 
                                onChange={e => setRule({ ...rule, title: e.target.value })} 
                                className={inputClass} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                            <textarea 
                                value={rule.summary} 
                                onChange={e => setRule({ ...rule, summary: e.target.value })} 
                                className={inputClass} 
                                rows={2} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Explanation</label>
                            <textarea 
                                value={rule.explanation} 
                                onChange={e => setRule({ ...rule, explanation: e.target.value })} 
                                className={inputClass} 
                                rows={4} 
                                required 
                            />
                        </div>
                        <div className="text-right">
                            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 ml-auto">
                                {isSubmitting ? <Spinner className="w-4 h-4 border-2" /> : <><SaveIcon className="w-4 h-4" /> Update Rule</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Referee List Section */}
            <Card className="shadow-lg">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold font-display">Referees List</h3>
                        <Button onClick={handleAddReferee} className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Referee
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {referees.map(referee => (
                            <div key={referee.id} className="p-4 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <img src={referee.photoUrl} alt={referee.name} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900">{referee.name}</p>
                                            {referee.isSpotlight && (
                                                <span title="Spotlight Referee">
                                                    <StarIcon className="w-4 h-4 text-yellow-500" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">{referee.level} &bull; {referee.stats.matches} Matches</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <Button onClick={() => handleEditReferee(referee)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center"><PencilIcon className="w-4 h-4"/></Button>
                                    <Button onClick={() => handleDeleteReferee(referee.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center"><TrashIcon className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        ))}
                        {referees.length === 0 && <p className="text-center text-gray-500 py-8">No referees found.</p>}
                    </div>
                </CardContent>
            </Card>

            {isModalOpen && (
                <RefereeFormModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveReferee} 
                    referee={editingReferee} 
                />
            )}
        </div>
    );
};

export default RefereeManagement;
