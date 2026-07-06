
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllUsers, updateUserRole, updateUserPermissions, handleFirestoreError, addNotification, OperationType } from '../../services/api';
import { User } from '../../types/auth';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import ConfirmationModal from '../ui/ConfirmationModal';
import SearchIcon from '../icons/SearchIcon';
import ShieldIcon from '../icons/ShieldIcon';
import UserIcon from '../icons/UserIcon';
import TrophyIcon from '../icons/TrophyIcon';
import NewspaperIcon from '../icons/NewspaperIcon';
import BadgeCheckIcon from '../icons/BadgeCheckIcon';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmRoleChange, setConfirmRoleChange] = useState<{ userId: string, newRole: User['role'] } | null>(null);
    const [confirmPermissionChange, setConfirmPermissionChange] = useState<{ userId: string, canAccess: boolean } | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await fetchAllUsers();
            setUsers(data);
        } catch (err) {
            handleFirestoreError(err, OperationType.GET, 'users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.journalismCredentials?.outlet?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handlePermissionChange = async () => {
        if (!confirmPermissionChange) return;
        const { userId, canAccess } = confirmPermissionChange;
        setIsProcessing(true);
        try {
            await updateUserPermissions(userId, { canAccessEFADashboard: canAccess });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, canAccessEFADashboard: canAccess } : u));
            setConfirmPermissionChange(null);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRoleChange = async () => {
        if (!confirmRoleChange) return;
        const { userId, newRole } = confirmRoleChange;
        setIsProcessing(true);
        try {
            await updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            
            // Notify user of role change
            await addNotification({
                userId: userId,
                title: 'Account Status Updated',
                message: `Your account role has been updated to ${newRole.replace('_', ' ')}. Check your new permissions.`,
                type: 'success'
            });
            setConfirmRoleChange(null);
        } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const getRoleBadge = (role: User['role']) => {
        switch (role) {
            case 'super_admin': return <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">System Admin</span>;
            case 'league_admin': return <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">League Admin</span>;
            case 'club_admin': return <span className="bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">Club Admin</span>;
            case 'journalist': return <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1"><BadgeCheckIcon className="w-3 h-3"/> Journalist</span>;
            default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border">Fan Account</span>;
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in border-0 overflow-hidden">
            <div className="bg-primary p-6 text-white">
                <h3 className="text-2xl font-bold font-display">Identity & Permissions</h3>
                <p className="text-blue-100 text-sm opacity-80">Moderation center for Club Officials, League Managers, and Verified Press.</p>
            </div>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="relative w-full md:w-96">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Find user by name, email, or media outlet..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <Button onClick={loadUsers} variant="outline" className="text-xs h-10 px-6 border-gray-200 font-bold hover:bg-slate-50 transition-colors">Refresh System</Button>
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-3">
                        {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <div key={u.id} className="p-5 bg-white border border-gray-100 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 min-w-0">
                                    <img src={u.avatar} alt="" className="w-14 h-14 rounded-2xl border border-gray-100 bg-gray-50 shadow-sm flex-shrink-0 object-cover" />
                                    <div className="min-w-0">
                                        <p className="font-black text-gray-900 leading-tight truncate text-lg">{u.name}</p>
                                        <p className="text-xs text-gray-400 font-medium mb-2">{u.email}</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getRoleBadge(u.role)}
                                            {u.club && <span className="text-[10px] text-red-600 font-black uppercase tracking-tight bg-red-50 px-2 rounded-full border border-red-100">{u.club}</span>}
                                            {u.journalismCredentials?.outlet && <span className="text-[10px] text-indigo-600 font-black uppercase tracking-tight bg-indigo-50 px-2 rounded-full border border-indigo-100">{u.journalismCredentials.outlet}</span>}
                                            {u.canAccessEFADashboard && <span className="text-[10px] text-blue-600 font-black uppercase tracking-tight bg-blue-50 px-2 rounded-full border border-blue-100 flex items-center gap-1"><ShieldIcon className="w-3 h-3" /> EFA Access</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0">
                                    <Button 
                                        onClick={() => setConfirmPermissionChange({ userId: u.id, canAccess: !u.canAccessEFADashboard })}
                                        disabled={isProcessing && confirmPermissionChange?.userId === u.id}
                                        variant={u.canAccessEFADashboard ? "secondary" : "outline"}
                                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                                    >
                                        {isProcessing && confirmPermissionChange?.userId === u.id ? <Spinner className="w-3 h-3 border-white border-2" /> : <ShieldIcon className="w-4 h-4" />}
                                        {u.canAccessEFADashboard ? 'Revoke EFA Access' : 'Grant EFA Access'}
                                    </Button>
                                    {u.role !== 'journalist' && (
                                        <Button 
                                            onClick={() => setConfirmRoleChange({ userId: u.id, newRole: 'journalist' })}
                                            disabled={isProcessing && confirmRoleChange?.userId === u.id}
                                            className="bg-indigo-600 text-white text-[10px] h-9 px-4 font-black uppercase tracking-widest flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                                        >
                                            {isProcessing && confirmRoleChange?.userId === u.id ? <Spinner className="w-3 h-3 border-white border-2" /> : <NewspaperIcon className="w-4 h-4 text-white" />}
                                            Make Journalist
                                        </Button>
                                    )}
                                    {u.role !== 'super_admin' && (
                                        <Button 
                                            onClick={() => setConfirmRoleChange({ userId: u.id, newRole: 'super_admin' })}
                                            disabled={isProcessing && confirmRoleChange?.userId === u.id}
                                            className="bg-slate-900 text-white text-[10px] h-9 px-4 font-black uppercase tracking-widest flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                                        >
                                            {isProcessing && confirmRoleChange?.userId === u.id ? <Spinner className="w-3 h-3 border-white border-2" /> : <ShieldIcon className="w-4 h-4 text-white" />}
                                            Make Admin
                                        </Button>
                                    )}
                                    {u.role !== 'user' && (
                                        <Button 
                                            onClick={() => setConfirmRoleChange({ userId: u.id, newRole: 'user' })}
                                            disabled={isProcessing && confirmRoleChange?.userId === u.id}
                                            variant="secondary"
                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        >
                                            Revoke Privileges
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-gray-50">
                                <UserIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No matching identities found</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <ConfirmationModal 
                isOpen={!!confirmRoleChange}
                onClose={() => setConfirmRoleChange(null)}
                onConfirm={handleRoleChange}
                title="Change User Role"
                message={`Are you sure you want to change this user's role to ${confirmRoleChange?.newRole.replace('_', ' ').toUpperCase()}?`}
                confirmText="Confirm Change"
                variant="primary"
            />

            <ConfirmationModal 
                isOpen={!!confirmPermissionChange}
                onClose={() => setConfirmPermissionChange(null)}
                onConfirm={handlePermissionChange}
                title="Change Special Permissions"
                message={confirmPermissionChange?.canAccess 
                    ? "Are you sure you want to grant this user access to the Strategic EFA Dashboard?" 
                    : "Are you sure you want to revoke this user's access to the Strategic EFA Dashboard?"}
                confirmText="Confirm Action"
                variant="primary"
            />
        </Card>
    );
};

export default UserManagement;
