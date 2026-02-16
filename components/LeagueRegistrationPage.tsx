
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { fetchAllCompetitions, fetchCategories, Category as DBCategory } from '../services/api';
import TrophyIcon from './icons/TrophyIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import LockIcon from './icons/LockIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import SearchIcon from './icons/SearchIcon';
import LayersIcon from './icons/LayersIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import PhoneIcon from './icons/PhoneIcon';

const LeagueRegistrationPage: React.FC = () => {
    const { user, isLoggedIn, openAuthModal, signup } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const fixedCategory = searchParams.get('fixedCategory');
    const typeName = searchParams.get('typeName') || 'New';

    const [requestType, setRequestType] = useState<'create' | 'manage'>('create');
    const [allLeagues, setAllLeagues] = useState<{id: string, name: string}[]>([]);
    const [allCategories, setAllCategories] = useState<DBCategory[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const [leagueName, setLeagueName] = useState('');
    const [targetLeagueId, setTargetLeagueId] = useState('');
    const [category, setCategory] = useState(fixedCategory || 'promotion-league');
    const [region, setRegion] = useState('Hhohho');
    const [managerName, setManagerName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoadingData(true);
            try {
                const [comps, cats] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchCategories()
                ]);
                
                const list = Object.entries(comps).map(([id, c]) => ({ id, name: c.displayName || c.name || id }));
                setAllLeagues(list.sort((a,b) => a.name.localeCompare(b.name)));
                setAllCategories(cats);
                
                if (list.length > 0) setTargetLeagueId(list[0].id);
                if (cats.length > 0 && !fixedCategory) setCategory(cats[0].id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingData(false);
            }
        };
        load();
    }, [fixedCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (requestType === 'manage' && !targetLeagueId) {
            setError("Please select an existing league to manage.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (!isLoggedIn && !user) {
                if (!password) throw new Error("Password is required to create a manager account.");
                await signup({ name: managerName, email, password });
            }

            const finalLeagueName = requestType === 'manage' 
                ? (allLeagues.find(l => l.id === targetLeagueId)?.name || 'Existing League')
                : leagueName;

            await addDoc(collection(db, 'leagueRequests'), {
                leagueName: finalLeagueName,
                targetLeagueId: requestType === 'manage' ? targetLeagueId : null,
                requestType,
                region, 
                categoryId: requestType === 'manage' ? 'existing' : (fixedCategory || category),
                managerName: isLoggedIn && user ? user.name : managerName,
                managerEmail: isLoggedIn && user ? user.email : email,
                managerId: user?.id || 'new_user',
                description,
                status: 'pending',
                submittedAt: serverTimestamp()
            });

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || "An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 text-center">
                <Card className="max-w-md w-full p-10 rounded-[2.5rem] shadow-2xl border-0">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4 uppercase tracking-tighter">Request Received</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Your request to manage the <strong>{requestType === 'create' ? leagueName : (allLeagues.find(l => l.id === targetLeagueId)?.name)}</strong> has been sent to our moderators. You will be notified once approved.
                    </p>
                    <Button onClick={() => navigate('/regional')} className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase shadow-xl tracking-widest text-xs">
                        Back to Hub
                    </Button>
                </Card>
            </div>
        );
    }

    const selectClass = "block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm h-[52px] font-bold bg-white outline-none transition-all";

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                         <TrophyIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-2 uppercase tracking-tighter">
                        {fixedCategory ? `${typeName} Manager Entry` : 'League Manager Portal'}
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                        {requestType === 'create' 
                            ? `Initialize a professional digital space for a ${fixedCategory ? typeName : 'new'} competition hub.` 
                            : 'Apply for administrative access to an existing official league.'}
                    </p>
                </div>

                <div className="flex justify-center mb-10">
                    <div className="bg-white p-1.5 rounded-2xl shadow-xl border border-slate-200 inline-flex">
                        <button 
                            type="button"
                            onClick={() => setRequestType('create')} 
                            className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3 tracking-widest uppercase ${requestType === 'create' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <PlusCircleIcon className="w-4 h-4" /> {fixedCategory ? 'Initialize Hub' : 'Create New'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setRequestType('manage')} 
                            className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3 tracking-widest uppercase ${requestType === 'manage' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ShieldCheckIcon className="w-4 h-4" /> Manage Existing
                        </button>
                    </div>
                </div>

                <Card className="shadow-2xl rounded-[2.5rem] border-0 overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary border-b pb-2">1. League Metadata</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {requestType === 'create' ? (
                                            <>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Competition Display Name</label>
                                                    <Input value={leagueName} onChange={e => setLeagueName(e.target.value)} required placeholder={fixedCategory ? `e.g. Malkerns ${typeName} League` : "e.g. Mhlume B Division"} />
                                                </div>
                                                
                                                {!fixedCategory && (
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Placement Category</label>
                                                        <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
                                                            {allCategories.map(cat => (
                                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                            ))}
                                                        </select>
                                                        <p className="text-[9px] text-gray-400 mt-2 italic px-1">Determines which page this hub appears on (e.g. Youth, Schools, etc.)</p>
                                                    </div>
                                                )}

                                                <div className={fixedCategory ? 'md:col-span-2' : ''}>
                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Official Region</label>
                                                    <select value={region} onChange={e => setRegion(e.target.value)} className={selectClass}>
                                                        <option>Hhohho</option><option>Manzini</option><option>Lubombo</option><option>Shiselweni</option><option>National</option>
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="md:col-span-2 space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Select Managed Hub</label>
                                                    <select 
                                                        value={targetLeagueId} 
                                                        onChange={e => setTargetLeagueId(e.target.value)} 
                                                        className={selectClass}
                                                        required
                                                    >
                                                        {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="p-4 bg-indigo-50 text-indigo-800 rounded-xl text-xs border border-indigo-100 flex gap-3">
                                                    <LayersIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                                    <p>Managing an existing hub allows you to edit fixtures, results, and league settings. Authorization from the relevant association is required.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!isLoggedIn ? (
                                    <div className="space-y-6 pt-10 border-t border-gray-100">
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary border-b pb-2">2. Portal Access</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={managerName} onChange={e => setManagerName(e.target.value)} required placeholder="Legal Name" />
                                            <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Official Email" />
                                        </div>
                                        <Input icon={<LockIcon className="w-5 h-5 text-gray-400" />} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Set Access Password" />
                                    </div>
                                ) : (
                                     <div className="space-y-6 pt-10 border-t border-gray-100">
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary border-b pb-2">2. Official Contact</h3>
                                        <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Primary Phone Number" />
                                    </div>
                                )}

                                <div className="space-y-6 pt-10 border-t border-gray-100">
                                    <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary border-b pb-2">3. Strategic Context</h3>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                                            Role & Objective
                                        </label>
                                        <textarea 
                                            rows={4} 
                                            value={description} 
                                            onChange={e => setDescription(e.target.value)} 
                                            className="block w-full border border-gray-300 rounded-[1.5rem] shadow-sm py-4 px-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-gray-50/50 outline-none"
                                            placeholder="Explain your organizational role and the goals for this digital hub..."
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-16 text-lg shadow-xl font-black uppercase tracking-widest rounded-3xl hover:scale-[1.01] active:scale-95 transition-all">
                                        {isSubmitting ? <Spinner className="w-6 h-6 border-white border-2" /> : (requestType === 'create' ? `Launch ${fixedCategory ? typeName : 'Hub'}` : 'Submit Management Request')}
                                    </Button>
                                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Verified credentials are required for live publishing</p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LeagueRegistrationPage;
