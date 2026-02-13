import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { fetchAllCompetitions } from '../services/api';
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
    
    // CONTEXTUAL LOCKING:
    // If coming from a specific page (like U-17), fixedCategory will be set.
    const fixedCategory = searchParams.get('fixedCategory');
    const typeName = searchParams.get('typeName') || 'New';

    const [requestType, setRequestType] = useState<'create' | 'manage'>('create');
    const [allLeagues, setAllLeagues] = useState<{id: string, name: string}[]>([]);
    const [loadingLeagues, setLoadingLeagues] = useState(false);

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
        if (requestType === 'manage') {
            const load = async () => {
                setLoadingLeagues(true);
                try {
                    const comps = await fetchAllCompetitions();
                    const list = Object.entries(comps).map(([id, c]) => ({ id, name: c.name || id }));
                    setAllLeagues(list.sort((a,b) => a.name.localeCompare(b.name)));
                    if (list.length > 0) setTargetLeagueId(list[0].id);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoadingLeagues(false);
                }
            };
            load();
        }
    }, [requestType]);

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
                region, // This determines which regional hub page it appears on
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
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4">
                <Card className="max-w-md w-full text-center p-8 rounded-[2.5rem] shadow-2xl border-0">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4 uppercase tracking-tighter">Request Sent!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Your request to {requestType === 'create' ? 'start' : 'manage'} the <strong>{requestType === 'create' ? leagueName : (allLeagues.find(l => l.id === targetLeagueId)?.name)}</strong> has been sent to our moderators.
                    </p>
                    <Button onClick={() => navigate('/regional')} className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase shadow-xl">
                        Back to Regional Hub
                    </Button>
                </Card>
            </div>
        );
    }

    const selectClass = "block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm h-[48px] font-bold bg-white outline-none";

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

                {/* Mode Selector */}
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
                            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 animate-fade-in">{error}</div>}
                            
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">1. League Identity</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                        {requestType === 'create' ? (
                                            <>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Full Competition Name</label>
                                                    <Input value={leagueName} onChange={e => setLeagueName(e.target.value)} required placeholder={fixedCategory ? `e.g. Malkerns ${typeName} League` : "e.g. Mhlume B Division"} />
                                                </div>
                                                
                                                {/* ONLY show dropdown if we are NOT on a youth page */}
                                                {!fixedCategory && (
                                                    <div>
                                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">League Category / Tier</label>
                                                        <select value={category} onChange={e => setCategory(e.target.value)} className={selectClass}>
                                                            <option value="promotion-league">Promotion League</option>
                                                            <option value="b-division">B Division (Lowest Tier)</option>
                                                        </select>
                                                        <p className="text-[10px] text-gray-400 mt-2 italic px-1">Restricted to community promotional tiers.</p>
                                                    </div>
                                                )}

                                                <div className={fixedCategory ? 'md:col-span-2' : ''}>
                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Target Region</label>
                                                    <select value={region} onChange={e => setRegion(e.target.value)} className={selectClass}>
                                                        <option>Hhohho</option>
                                                        <option>Manzini</option>
                                                        <option>Lubombo</option>
                                                        <option>Shiselweni</option>
                                                    </select>
                                                    <p className="text-[10px] text-gray-400 mt-2 italic px-1">Determines which regional hub this league appears in.</p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="md:col-span-2 space-y-6">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Select Official League Hub</label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                            {loadingLeagues ? <Spinner className="w-4 h-4 border-2" /> : <SearchIcon className="h-4 w-4 text-gray-400" />}
                                                        </span>
                                                        <select 
                                                            value={targetLeagueId} 
                                                            onChange={e => setTargetLeagueId(e.target.value)} 
                                                            className={`${selectClass} pl-10`}
                                                            required
                                                            disabled={loadingLeagues}
                                                        >
                                                            {allLeagues.length > 0 ? (
                                                                allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)
                                                            ) : (
                                                                <option disabled>Syncing hubs...</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-indigo-50 text-indigo-800 rounded-xl text-xs border border-indigo-100 flex gap-3">
                                                    <LayersIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                                    <p>Managing an existing hub allows you to edit fixtures and results for an official league. Vetting is mandatory.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!isLoggedIn && (
                                    <div className="space-y-6 pt-10 border-t border-gray-100 animate-fade-in">
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">2. Manager Account</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={managerName} onChange={e => setManagerName(e.target.value)} required placeholder="Full Legal Name" />
                                            <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address" />
                                        </div>
                                        <Input icon={<LockIcon className="w-5 h-5 text-gray-400" />} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Set Portal Password" />
                                    </div>
                                )}
                                
                                {isLoggedIn && (
                                     <div className="space-y-6 pt-10 border-t border-gray-100">
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">2. Contact Details</h3>
                                        <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Primary Contact Phone" />
                                    </div>
                                )}

                                <div className="space-y-6 pt-10 border-t border-gray-100">
                                    <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">3. Authority & Scope</h3>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                                            {requestType === 'create' ? 'League Format & Teams' : 'Nature of Association Role'}
                                        </label>
                                        <textarea 
                                            rows={4} 
                                            value={description} 
                                            onChange={e => setDescription(e.target.value)} 
                                            className="block w-full border border-gray-300 rounded-[1.5rem] shadow-sm py-4 px-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-gray-50/50 outline-none"
                                            placeholder={requestType === 'create' 
                                                ? "Describe the number of teams, match frequency, and why this hub is needed..." 
                                                : "Explain your role within the association (e.g. Secretary, Director)..."}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-16 text-lg shadow-xl font-black uppercase tracking-widest rounded-3xl hover:scale-[1.01] active:scale-95 transition-all">
                                        {isSubmitting ? <Spinner className="w-6 h-6 border-white border-2" /> : (requestType === 'create' ? `Initialize ${fixedCategory ? typeName : 'Hub'}` : 'Request Admin Access')}
                                    </Button>
                                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Verification is mandatory for live publishing</p>
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