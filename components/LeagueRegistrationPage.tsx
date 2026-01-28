
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import TrophyIcon from './icons/TrophyIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import GlobeIcon from './icons/GlobeIcon';
// Added missing import for LockIcon
import LockIcon from './icons/LockIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import SchoolIcon from './icons/SchoolIcon';

const LeagueRegistrationPage: React.FC = () => {
    const { user, isLoggedIn, openAuthModal, signup } = useAuth();
    const navigate = useNavigate();
    
    const [leagueName, setLeagueName] = useState('');
    const [category, setCategory] = useState('regional-leagues');
    const [region, setRegion] = useState('Hhohho');
    const [managerName, setManagerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

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

            // 2. Submit League Request
            await addDoc(collection(db, 'leagueRequests'), {
                leagueName,
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
            setError(err.message || "An error occurred.");
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
                        Your request to create the <strong>{leagueName}</strong> has been sent to the Football Eswatini Technical Committee. We will verify your credentials and initialize your portal.
                    </p>
                    <Button onClick={() => navigate(category === 'schools' ? '/schools' : '/regional')} className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase shadow-xl">
                        Return to Hub
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                         {category === 'schools' ? <SchoolIcon className="w-10 h-10 text-primary" /> : <TrophyIcon className="w-10 h-10 text-primary" />}
                    </div>
                    <h1 className="text-4xl font-display font-black text-gray-900 mb-2 uppercase tracking-tighter">League Manager Portal</h1>
                    <p className="text-lg text-gray-600">
                        Register your competition and join the official Eswatini digital football network.
                    </p>
                </div>

                <Card className="shadow-2xl rounded-[2.5rem] border-0 overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">1. Competition Category</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setCategory('regional-leagues')}
                                            className={`p-4 border-2 rounded-2xl flex flex-col items-center text-center transition-all ${category === 'regional-leagues' ? 'border-primary bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <GlobeIcon className={`w-8 h-8 mb-2 ${category === 'regional-leagues' ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className="font-bold text-sm">Regional League</span>
                                            <span className="text-[10px] opacity-50 uppercase">Super Leagues & Promotional</span>
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setCategory('schools')}
                                            className={`p-4 border-2 rounded-2xl flex flex-col items-center text-center transition-all ${category === 'schools' ? 'border-primary bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <SchoolIcon className={`w-8 h-8 mb-2 ${category === 'schools' ? 'text-primary' : 'text-gray-400'}`} />
                                            <span className="font-bold text-sm">Schools Tournament</span>
                                            <span className="text-[10px] opacity-50 uppercase">Inter-School & Scholastic Cups</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">2. League Name</label>
                                        <Input value={leagueName} onChange={e => setLeagueName(e.target.value)} required placeholder="e.g. Malkerns Under-15 League" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">3. Primary Region</label>
                                        <select 
                                            value={region} 
                                            onChange={e => setRegion(e.target.value)}
                                            className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm h-[48px]"
                                        >
                                            <option>Hhohho</option>
                                            <option>Manzini</option>
                                            <option>Lubombo</option>
                                            <option>Shiselweni</option>
                                            <option>National</option>
                                        </select>
                                    </div>
                                </div>

                                {!isLoggedIn && (
                                    <div className="space-y-6 pt-6 border-t border-gray-100">
                                        <h3 className="font-black text-xs uppercase tracking-widest text-primary">Manager Account Security</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Full Name</label>
                                                <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={managerName} onChange={e => setManagerName(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Contact Email</label>
                                                <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Portal Password</label>
                                            {/* Added missing import for LockIcon and fixed usage */}
                                            <Input icon={<LockIcon className="w-5 h-5 text-gray-400" />} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 6 characters" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">4. Context & Format</label>
                                    <textarea 
                                        rows={4} 
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                                        placeholder="Describe the competition format, participating schools/teams, and frequency of matches..."
                                        required
                                    />
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-14 text-lg shadow-xl font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                                        {isSubmitting ? <Spinner className="w-6 h-6 border-white border-2" /> : 'Submit League Application'}
                                    </Button>
                                    <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-wider px-10">
                                        Submissions are reviewed within 24 hours. You will receive an in-app notification once your portal is active.
                                    </p>
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
