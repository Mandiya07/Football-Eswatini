
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import GlobeIcon from './icons/GlobeIcon';
import LockIcon from './icons/LockIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import SchoolIcon from './icons/SchoolIcon';
import SparklesIcon from './icons/SparklesIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

const LeagueRegistrationPage: React.FC = () => {
    const { user, isLoggedIn, openAuthModal, signup } = useAuth();
    const navigate = useNavigate();
    
    // Request Type: 'create' for brand new, 'manage' for existing in DB
    const [requestType, setRequestType] = useState<'create' | 'manage'>('create');
    const [allLeagues, setAllLeagues] = useState<{id: string, name: string}[]>([]);
    const [loadingLeagues, setLoadingLeagues] = useState(false);

    const [leagueName, setLeagueName] = useState('');
    const [targetLeagueId, setTargetLeagueId] = useState('');
    const [category, setCategory] = useState('regional-leagues');
    const [region, setRegion] = useState('Hhohho');
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (requestType === 'manage') {
            const load = async () => {
                setLoadingLeagues(true);
                const comps = await fetchAllCompetitions();
                const list = Object.entries(comps).map(([id, c]) => ({ id, name: c.name || id }));
                setAllLeagues(list.sort((a,b) => a.name.localeCompare(b.name)));
                setLoadingLeagues(false);
            };
            load();
        }
    }, [requestType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // 1. Handle Account Creation if not logged in
            if (!isLoggedIn) {
                if (!password) {
                    throw new Error("Password is required to create a manager account.");
                }
                await signup({ name: managerName, email, password });
            }

            // Determine final name
            const finalLeagueName = requestType === 'manage' 
                ? (allLeagues.find(l => l.id === targetLeagueId)?.name || 'Existing League')
                : leagueName;

            // 2. Submit League Request
            await addDoc(collection(db, 'leagueRequests'), {
                leagueName: finalLeagueName,
                targetLeagueId: requestType === 'manage' ? targetLeagueId : null,
                requestType,
                region,
                categoryId: category,
                managerName: isLoggedIn ? user?.name : managerName,
                managerEmail: isLoggedIn ? user?.email : email,
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
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4 uppercase tracking-tighter">Request Received!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Your request to {requestType === 'create' ? 'initialize' : 'manage'} the <strong>{requestType === 'create' ? leagueName : (allLeagues.find(l => l.id === targetLeagueId)?.name)}</strong> has been sent to our committee.
                    </p>
                    <Button onClick={() => navigate('/regional')} className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase shadow-xl">
                        Return to Hub
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                         <TrophyIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-2 uppercase tracking-tighter">League Manager Portal</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Join the Kingdom's official digital football network. Digitize your scores, standings, and rosters.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={() => setRequestType('create')}
                        className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 shadow-sm ${requestType === 'create' ? 'border-primary bg-white ring-4 ring-primary/5 shadow-xl' : 'bg-gray-100/50 border-transparent text-gray-500'}`}
                    >
                        <div className={`p-3 rounded-2xl w-fit ${requestType === 'create' ? 'bg-blue-100 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-lg uppercase tracking-tight">Create New League</p>
                            <p className="text-xs opacity-70">Initialize a brand new competition center.</p>
                        </div>
                    </button>
                    <button 
                        onClick={() => setRequestType('manage')}
                        className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 shadow-sm ${requestType === 'manage' ? 'border-primary bg-white ring-4 ring-primary/5 shadow-xl' : 'bg-gray-100/50 border-transparent text-gray-500'}`}
                    >
                        <div className={`p-3 rounded-2xl w-fit ${requestType === 'manage' ? 'bg-blue-100 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-lg uppercase tracking-tight">Manage Existing League</p>
                            <p className="text-xs opacity-70">Request admin access to a league already in the app.</p>
                        </div>
                    </button>
                </div>

                <Card className="shadow-2xl rounded-[2.5rem] border-0 overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100 animate-fade-in">{error}</div>}
                            
                            <div className="space-y-8">
                                {/* SECTION 1: COMPETITION IDENTITY */}
                                <div className="space-y-6">
                                    <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">1. Competition Identity</h3>
                                    
                                    {requestType === 'create' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">League Display Name</label>
                                                <Input value={leagueName} onChange={e => setLeagueName(e.target.value)} required placeholder="e.g. Malkerns Under-15 League" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Hub Category</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button type="button" onClick={() => setCategory('regional-leagues')} className={`p-3 border rounded-xl text-xs font-bold transition-all ${category === 'regional-leagues' ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-gray-100'}`}>Regional</button>
                                                    <button type="button" onClick={() => setCategory('schools')} className={`p-3 border rounded-xl text-xs font-bold transition-all ${category === 'schools' ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-gray-100'}`}>Schools</button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Primary Region</label>
                                                <select value={region} onChange={e => setRegion(e.target.value)} className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm h-[48px]">
                                                    <option>Hhohho</option><option>Manzini</option><option>Lubombo</option><option>Shiselweni</option><option>National</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-fade-in">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Select League from Database</label>
                                                {loadingLeagues ? <Spinner className="w-6 h-6" /> : (
                                                    <select 
                                                        value={targetLeagueId} 
                                                        onChange={e => setTargetLeagueId(e.target.value)}
                                                        className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 sm:text-sm h-[52px] font-bold text-gray-900"
                                                        required
                                                    >
                                                        <option value="" disabled>-- Select a Competition --</option>
                                                        {allLeagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 2: MANAGER PROFILE */}
                                {!isLoggedIn && (
                                    <div className="space-y-6 pt-10 border-t border-gray-100 animate-fade-in">
                                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">2. Manager Credentials</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Legal Full Name</label>
                                                <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={managerName} onChange={e => setManagerName(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Official Email</label>
                                                <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Set Portal Password</label>
                                            <Input icon={<LockIcon className="w-5 h-5 text-gray-400" />} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 6 characters" />
                                        </div>
                                    </div>
                                )}

                                {/* SECTION 3: REASONING */}
                                <div className="space-y-6 pt-10 border-t border-gray-100">
                                    <h3 className="font-black text-xs uppercase tracking-[0.3em] text-primary">3. Motivation & Context</h3>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                                            {requestType === 'create' ? 'Describe the competition format & teams' : 'Reason for management request'}
                                        </label>
                                        <textarea 
                                            rows={4} 
                                            value={description} 
                                            onChange={e => setDescription(e.target.value)} 
                                            className="block w-full border border-gray-300 rounded-[1.5rem] shadow-sm py-4 px-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-gray-50/50"
                                            placeholder={requestType === 'create' 
                                                ? "How many teams? Is it a knockout or round-robin? Frequency of matches..." 
                                                : "Please state your official role and why you require admin privileges for this league."
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-16 text-lg shadow-xl font-black uppercase tracking-widest rounded-3xl hover:scale-[1.01] active:scale-95 transition-all">
                                        {isSubmitting ? <Spinner className="w-6 h-6 border-white border-2" /> : `Submit ${requestType === 'create' ? 'Initialization' : 'Access'} Request`}
                                    </Button>
                                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Identity verification required upon approval</p>
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
