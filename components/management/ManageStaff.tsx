import React, { useState, useEffect } from 'react';
import { fetchCompetition, handleFirestoreError } from '../../services/api';
import { StaffMember, Team, Competition } from '../../data/teams';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import PlusCircleIcon from '../icons/PlusCircleIcon';
import TrashIcon from '../icons/TrashIcon';
import PencilIcon from '../icons/PencilIcon';
import PhoneIcon from '../icons/PhoneIcon';
import MailIcon from '../icons/MailIcon';
import { db } from '../../services/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { removeUndefinedProps } from '../../services/utils';

const StaffForm: React.FC<{
    staffMember: Partial<StaffMember> | 'new';
    onSave: (data: Partial<StaffMember>) => void;
    onCancel: () => void;
}> = ({ staffMember, onSave, onCancel }) => {
    const isNew = staffMember === 'new';
    const [formData, setFormData] = useState(isNew ? { name: '', role: 'Head Coach' as const, email: '', phone: '' } : staffMember);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border rounded-lg mb-4 space-y-4 animate-fade-in">
            <h4 className="font-bold">{isNew ? 'New Staff Member Details' : 'Edit Staff Member'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name" required className={inputClass} />
                <select name="role" value={formData.role || 'Head Coach'} onChange={handleChange} required className={inputClass}>
                    <option>Head Coach</option>
                    <option>Assistant Coach</option>
                    <option>Goalkeeper Coach</option>
                    <option>Physiotherapist</option>
                    <option>Team Doctor</option>
                    <option>Kit Manager</option>
                </select>
                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="Email Address" required className={inputClass} />
                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="Phone Number" required className={inputClass} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800">Cancel</Button>
                <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">Save</Button>
            </div>
        </form>
    );
};


const ManageStaff: React.FC<{ clubName: string }> = ({ clubName }) => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | 'new' | null>(null);

    const COMPETITION_ID = 'mtn-premier-league';

    useEffect(() => {
        const loadStaff = async () => {
            setLoading(true);
            const competitionData = await fetchCompetition(COMPETITION_ID);
            const team = competitionData?.teams?.find(t => t.name === clubName);
            setStaff(team?.staff || []);
            setLoading(false);
        };
        loadStaff();
    }, [clubName]);

    const updateFirestoreStaff = async (updatedStaff: StaffMember[]) => {
        setIsSubmitting(true);
        const docRef = doc(db, 'competitions', COMPETITION_ID);
        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error("Competition document not found!");
                }
                const competition = docSnap.data() as Competition;
                const updatedTeams = competition.teams.map(team =>
                    team.name === clubName
                        ? { ...team, staff: updatedStaff }
                        : team
                );
                // CRITICAL: Sanitize the entire teams array payload.
                transaction.update(docRef, { teams: removeUndefinedProps(updatedTeams) });
            });
            setStaff(updatedStaff);
        } catch (error) {
            handleFirestoreError(error, 'update team staff');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSave = async (data: Partial<StaffMember>) => {
        let updatedStaff: StaffMember[];
        if (editingMember === 'new') {
            const newMember: StaffMember = { id: Date.now(), ...data } as StaffMember;
            updatedStaff = [...staff, newMember];
        } else if (editingMember) {
            updatedStaff = staff.map(s => s.id === editingMember.id ? { ...s, ...data } as StaffMember : s);
        } else {
            return;
        }
        await updateFirestoreStaff(updatedStaff);
        setEditingMember(null);
    };
    
    const handleRemove = async (id: number) => {
        if (window.confirm("Are you sure you want to remove this staff member?")) {
            const updatedStaff = staff.filter(s => s.id !== id);
            await updateFirestoreStaff(updatedStaff);
        }
    };
    
    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold font-display">Manage Team Staff</h3>
                    {!editingMember && (
                        <Button onClick={() => setEditingMember('new')} className="bg-primary text-white hover:bg-primary-dark focus:ring-primary-light inline-flex items-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" /> Add Staff
                        </Button>
                    )}
                </div>
                
                {editingMember && <StaffForm staffMember={editingMember} onSave={handleSave} onCancel={() => setEditingMember(null)} />}

                {(loading || isSubmitting) && <div className="flex justify-center py-8"><Spinner /></div>}
                
                {!loading && !isSubmitting && (
                    staff.length > 0 ? (
                        <div className="space-y-3">
                            {staff.map(member => (
                                <div key={member.id} className="p-3 bg-white border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-gray-800">{member.name}</p>
                                        <p className="text-sm font-semibold text-primary">{member.role}</p>
                                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
                                            <span className="inline-flex items-center gap-1.5"><MailIcon className="w-3.5 h-3.5"/> {member.email}</span>
                                            <span className="inline-flex items-center gap-1.5"><PhoneIcon className="w-3.5 h-3.5"/> {member.phone}</span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                        <Button onClick={() => setEditingMember(member)} className="bg-blue-100 text-blue-700 h-8 w-8 p-0 flex items-center justify-center" aria-label={`Edit ${member.name}`}>
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                        <Button onClick={() => handleRemove(member.id)} className="bg-red-100 text-red-700 h-8 w-8 p-0 flex items-center justify-center" aria-label={`Remove ${member.name}`}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-center text-gray-500 py-8">No staff members have been added yet.</p>
                    )
                )}
            </CardContent>
        </Card>
    );
};

export default ManageStaff;