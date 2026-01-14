
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllUsers, updateUserRole, handleFirestoreError } from '../../services/api';
import { User } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import SearchIcon from '../icons/SearchIcon';
import ShieldIcon from '../icons/ShieldIcon';
import UserIcon from '../icons/UserIcon';
import TrophyIcon from '../icons/TrophyIcon';
import GlobeIcon from '../icons/GlobeIcon';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        const data = await fetchAllUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleRoleChange = async (userId: string, newRole: User['role']) => {
        if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
        
        setProcessingId(userId);
        try {
            await updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            handleFirestoreError(error, 'change role');
        } finally {
            setProcessingId(null);
        }
    };

    const getRoleBadge = (role: User['role']) => {
        switch (role) {
            case 'super_admin': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Super Admin</span>;
            case 'league_admin': return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">League Admin</span>;
            case 'club_admin': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Club Admin</span>;
            default: return <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">User</span>;
        }
    };

    return (
        <Card className="shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-2xl font-bold font-display">User & Permissions</h3>
                        <p className="text-sm text-gray-500">Manage access levels for club officials and admins.</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-sm"
                        />
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
                    <div className="space-y-3">
                        {filteredUsers.length > 0 ? filteredUsers.map(u => (
                            <div key={u.id} className="p-4 bg-white border border-gray-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={u.avatar} alt="" className="w-12 h-12 rounded-full border border-gray-200 shadow-sm" />
                                    <div>
                                        <p className="font-bold text-gray-900">{u.name}</p>
                                        <p className="text-xs text-gray-500 mb-1">{u.email}</p>
                                        <div className="flex items-center gap-2">
                                            {getRoleBadge(u.role)}
                                            {u.club && <span className="text-[10px] text-gray-400 italic">Club: {u.club}</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                    {u.role !== 'super_admin' && (
                                        <Button 
                                            onClick={() => handleRoleChange(u.id, 'super_admin')}
                                            disabled={processingId === u.id}
                                            className="bg-blue-600 text-white text-[10px] h-8 px-3 font-bold flex items-center gap-1.5"
                                        >
                                            {processingId === u.id ? <Spinner className="w-3 h-3 border-white border-2" /> : <ShieldIcon className="w-3 h-3" />}
                                            Super Admin
                                        </Button>
                                    )}
                                    {u.role !== 'club_admin' && (
                                        <Button 
                                            onClick={() => handleRoleChange(u.id, 'club_admin')}
                                            disabled={processingId === u.id}
                                            className="bg-red-50 text-red-600 border border-red-100 text-[10px] h-8 px-3 font-bold flex items-center gap-1.5"
                                        >
                                            <TrophyIcon className="w-3 h-3" /> Club Admin
                                        </Button>
                                    )}
                                    {u.role !== 'user' && (
                                        <Button 
                                            onClick={() => handleRoleChange(u.id, 'user')}
                                            disabled={processingId === u.id}
                                            className="bg-gray-100 text-gray-600 text-[10px] h-8 px-3 font-bold"
                                        >
                                            Demote to User
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                <UserIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-400">No users found matching your search.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default UserManagement;
