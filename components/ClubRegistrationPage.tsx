
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllCompetitions, fetchAllTeams, submitClubRequest, PromoCode, processPayment, PaymentDetails, PaymentMethod } from '../services/api';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import TrophyIcon from './icons/TrophyIcon';
import TrashIcon from './icons/TrashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import SearchIcon from './icons/SearchIcon';
import LockIcon from './icons/LockIcon';
// Added missing import for InfoIcon
import InfoIcon from './icons/InfoIcon';
import { Team } from '../data/teams';

type RegStep = 'tier' | 'details' | 'divisions' | 'payment-method' | 'payment-details' | 'processing' | 'success';

interface Division {
    name: string;
    competitionId: string;
}

const ClubRegistrationPage: React.FC = () => {
    const { isLoggedIn, user, updateUser, openAuthModal } = useAuth();
    const navigate = useNavigate();
    
    // UI Flow State
    const [step, setStep] = useState<RegStep>('tier');
    const [competitions, setCompetitions] = useState<{ id: string, name: string }[]>([]);
    const [allExistingTeams, setAllExistingTeams] = useState<Team[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);
    
    // Form State
    const [clubName, setClubName] = useState('');
    const [repName, setRepName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    const [selectedTier, setSelectedTier] = useState('Professional'); 
    
    // Multi-Division State
    const [divisions, setDivisions] = useState<Division[]>([
        { name: 'Senior Team', competitionId: 'mtn-premier-league' }
    ]);
    
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ method: 'card' });
    const [processingStatus, setProcessingStatus] = useState('Validating Request...');
    const [transactionId, setTransactionId] = useState('');
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tiers = [
        { name: 'Basic', price: 0, priceStr: 'Free', features: ['Public Profile', 'Squad List', 'Fixtures & Logs'], color: 'border-gray-200' },
        { name: 'Professional', price: 120, priceStr: 'E120/mo', features: ['Admin Portal Access', 'Post Club News', 'Real-time Score Updates'], color: 'border-blue-500' },
        { name: 'Elite', price: 250, priceStr: 'E250/mo', features: ['Merchandise Store', 'Video Hub Integration', 'Priority Tech Support'], color: 'border-purple-600' },
        { name: 'Enterprise', price: 500, priceStr: 'E500/mo', features: ['Branded Club Hub', 'Ad-Free Experience', 'Premium Analytics'], color: 'border-gray-900' },
    ];

    const currentTierData = tiers.find(t => t.name === selectedTier) || tiers[0];

    const calculateFinalPrice = (): number => {
        if (currentTierData.price === 0) return 0;
        if (!discount) return currentTierData.price;
        if (discount.type === 'percentage') {
            return currentTierData.price - (currentTierData.price * (discount.value / 100));
        }
        return Math.max(0, currentTierData.price - discount.value);
    };

    const finalPrice = calculateFinalPrice();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [competitionsData, teamsData] = await Promise.all([
                    fetchAllCompetitions(),
                    fetchAllTeams()
                ]);
                const list = Object.entries(competitionsData).map(([id, c]) => ({
                    id, name: c.name || id
                })).sort((a,b) => a.name.localeCompare(b.name));
                setCompetitions(list);
                
                const uniqueTeams = Array.from(new Map(teamsData.map(t => [t.name.trim().toLowerCase(), t])).values());
                setAllExistingTeams(uniqueTeams);
            } catch (err) { console.error(err); }
        };
        loadInitialData();

        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync user data if it changes
    useEffect(() => {
        if (user) {
            setRepName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const filteredSuggestions = useMemo(() => {
        if (!clubName || clubName.length < 2) return [];
        return allExistingTeams.filter(t => 
            t.name.toLowerCase().includes(clubName.toLowerCase())
        ).slice(0, 5);
    }, [clubName, allExistingTeams]);

    const handleTierSubmit = () => setStep('details');

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStep('divisions');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddDivision = () => {
        setDivisions([...divisions, { name: '', competitionId: competitions[0]?.id || '' }]);
    };

    const handleRemoveDivision = (index: number) => {
        setDivisions(divisions.filter((_, i) => i !== index));
    };

    const updateDivision = (index: number, field: keyof Division, value: string) => {
        const updated = [...divisions];
        updated[index] = { ...updated[index], [field]: value };
        setDivisions(updated);
    };

    const handleDivisionsSubmit = () => {
        if (divisions.some(d => !d.name || !d.competitionId)) {
            return setError("Please fill in all division details or remove incomplete ones.");
        }
        if (selectedTier !== 'Basic' && finalPrice > 0) {
            setStep('payment-method');
        } else {
            processFreeRegistration();
        }
    };

    const getSubscriptionObject = (tier: string, txId?: string) => {
        const now = new Date();
        const renewal = new Date();
        renewal.setDate(renewal.getDate() + 30);
        
        return {
            tier: tier as any,
            status: 'active' as const,
            startDate: now.toISOString().split('T')[0],
            nextRenewalDate: renewal.toISOString().split('T')[0],
            autoRenew: true,
            lastTransactionId: txId
        };
    };

    const processFreeRegistration = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const subData = getSubscriptionObject(selectedTier);
            
            await submitClubRequest({
                userId: user.id, 
                clubName, repName, email, phone,
                tier: selectedTier,
                managedTeams: divisions.map(d => ({ teamName: d.name, competitionId: d.competitionId, role: 'club_admin' })),
                promoCode: discount?.code,
                paymentStatus: 'pending'
            });

            await updateUser({ subscription: subData });
            setStep('success');
        } catch (err: any) {
            setError(err.message || "Failed to submit registration.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setStep('processing');
        
        try {
            const result = await processPayment(finalPrice, paymentDetails);
            if (result.success) {
                const subData = getSubscriptionObject(selectedTier, result.transactionId);

                await submitClubRequest({
                    userId: user.id, 
                    clubName, repName, email, phone,
                    tier: selectedTier,
                    managedTeams: divisions.map(d => ({ teamName: d.name, competitionId: d.competitionId, role: 'club_admin' })),
                    promoCode: discount?.code,
                    paymentStatus: 'paid'
                });

                await updateUser({ subscription: subData });
                setStep('success');
            } else {
                setError(result.message);
                setStep('payment-details');
            }
        } catch (err) {
            setError("Technical error. Payment not processed.");
            setStep('payment-details');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="bg-gray-50 min-h-[80vh] flex items-center justify-center py-12 px-4">
                <Card className="max-w-md w-full shadow-2xl rounded-[2.5rem] border-0 text-center p-10 animate-fade-in">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LockIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4 uppercase tracking-tighter">Digital Identity Required</h2>
                    <p className="text-gray-600 mb-10 leading-relaxed">
                        To register and manage a club or team on Football Eswatini, you must first have a verified personal account.
                    </p>
                    <div className="space-y-4">
                        <Button onClick={openAuthModal} className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase shadow-xl tracking-widest text-xs">
                            Sign In / Join Hub
                        </Button>
                        <Button onClick={() => navigate('/')} variant="ghost" className="text-gray-400 font-bold">
                            Return Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const inputClass = "block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all";

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                
                {step === 'tier' && (
                    <div className="animate-fade-in space-y-12">
                        <div className="text-center max-w-2xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-4 tracking-tight">Select Your <span className="text-primary">Tier</span></h1>
                            <p className="text-gray-600">Choose the management package that fits your club's entire ecosystem.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {tiers.map(t => (
                                <Card 
                                    key={t.name} 
                                    className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border-2 ${selectedTier === t.name ? 'border-primary shadow-2xl ring-4 ring-primary/5 -translate-y-2' : 'border-white hover:border-gray-200 shadow-sm'}`}
                                    onClick={() => setSelectedTier(t.name)}
                                >
                                    <CardContent className="p-6 flex flex-col h-full">
                                        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">{t.name}</h3>
                                        <p className="text-3xl font-black text-gray-900 mb-6">{t.priceStr}</p>
                                        <ul className="space-y-3 mb-8 flex-grow">
                                            {t.features.map(f => (
                                                <li key={f} className="flex items-start gap-2 text-xs font-semibold text-gray-600">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button className={`w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest ${selectedTier === t.name ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-500 group-hover:bg-gray-100'}`}>
                                            {selectedTier === t.name ? 'SELECTED' : 'SELECT PLAN'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="flex justify-center pt-8">
                            <Button onClick={handleTierSubmit} className="bg-primary text-white h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                Next: Account Details <ArrowRightIcon className="w-5 h-5"/>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                    <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-0 animate-fade-in">
                        <div className="bg-primary p-8 text-white flex justify-between items-center">
                            <div><h2 className="text-2xl font-black font-display uppercase tracking-tight">Official Credentials</h2><p className="text-blue-100 text-xs">Plan: {selectedTier}</p></div>
                            <button onClick={() => setStep('tier')} className="text-xs font-bold text-white/60 hover:text-white underline">Change Plan</button>
                        </div>
                        <CardContent className="p-10">
                            <form onSubmit={handleDetailsSubmit} className="space-y-8">
                                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
                                <div className="space-y-6">
                                    <div className="relative" ref={suggestionRef}>
                                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">1. Global Club Name</label>
                                        <div className="relative">
                                            <Input 
                                                icon={<SearchIcon className="w-5 h-5 text-gray-400"/>}
                                                value={clubName} 
                                                onChange={e => {
                                                    setClubName(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                required 
                                                placeholder="Search or type club name..." 
                                            />
                                        </div>
                                        {showSuggestions && filteredSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggested From Directory</div>
                                                {filteredSuggestions.map((t, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setClubName(t.name);
                                                            setShowSuggestions(false);
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0 border-slate-50"
                                                    >
                                                        <div className="w-8 h-8 bg-white rounded-lg border flex items-center justify-center p-1 shadow-sm">
                                                            {t.crestUrl ? <img src={t.crestUrl} className="max-h-full max-w-full object-contain" alt="" /> : <TrophyIcon className="w-4 h-4 text-slate-200"/>}
                                                        </div>
                                                        <span className="font-bold text-slate-700">{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={repName} onChange={e => setRepName(e.target.value)} required placeholder="Official Representative" />
                                        <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Work Email" readOnly />
                                    </div>
                                    <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Official Contact Phone" />
                                    <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs flex items-start gap-3 border border-blue-100">
                                        <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <p>You are registering as a verified user. Your club profile will be linked to your existing Football Eswatini account for secure management.</p>
                                    </div>
                                </div>
                                <div className="pt-6 border-t flex gap-4">
                                    <Button type="button" variant="outline" onClick={() => setStep('tier')} className="flex-1 h-12">Back</Button>
                                    <Button type="submit" className="flex-[2] bg-primary text-white h-12 font-black uppercase tracking-widest shadow-xl">Define Divisions & Teams</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'divisions' && (
                    <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-0 animate-fade-in">
                        <div className="bg-primary p-8 text-white">
                            <h2 className="text-2xl font-black font-display uppercase tracking-tight">Multi-Team Setup</h2>
                            <p className="text-blue-100 text-xs">Define every division your club operates in Eswatini.</p>
                        </div>
                        <CardContent className="p-10 space-y-8">
                            <div className="space-y-4">
                                {divisions.map((div, index) => (
                                    <div key={index} className="p-6 bg-gray-50 border border-gray-200 rounded-[2rem] relative group animate-in slide-in-from-right-4">
                                        {divisions.length > 1 && (
                                            <button onClick={() => handleRemoveDivision(index)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Division Display Name</label>
                                                <input value={div.name} onChange={e => updateDivision(index, 'name', e.target.value)} className={inputClass} placeholder="e.g. Senior Team" required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Linked Competition Hub</label>
                                                <select value={div.competitionId} onChange={e => updateDivision(index, 'competitionId', e.target.value)} className={inputClass} required>
                                                    <option disabled value="">Select Hub...</option>
                                                    {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button onClick={handleAddDivision} variant="outline" className="w-full h-14 border-dashed border-2 border-gray-300 text-gray-400 hover:text-primary hover:border-primary rounded-[2rem] flex items-center justify-center gap-2">
                                    <PlusCircleIcon className="w-5 h-5" /> Add Another Division (U-15, U-17, etc.)
                                </Button>
                            </div>
                            <div className="pt-10 border-t flex gap-4">
                                <Button onClick={() => setStep('details')} variant="outline" className="flex-1 h-12">Back</Button>
                                <Button onClick={handleDivisionsSubmit} className="flex-[2] bg-primary text-white h-12 font-black uppercase tracking-widest shadow-xl">
                                    {finalPrice > 0 ? `Review & Pay (E${finalPrice})` : 'Finalize Registration'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {(step === 'payment-method' || step === 'payment-details' || step === 'processing') && (
                    <div className="max-w-md mx-auto space-y-6 py-12">
                        {step === 'payment-method' && (
                             <div className="space-y-4 animate-fade-in">
                                <div className="text-center mb-8"><h3 className="text-2xl font-black">Choose Payment</h3><p className="text-sm text-gray-500">Subscription for {selectedTier} plan.</p></div>
                                <button onClick={() => { setPaymentMethod('card'); setStep('payment-details'); }} className="w-full p-6 border rounded-3xl bg-white hover:border-blue-500 shadow-sm flex items-center gap-4 transition-all">
                                    <div className="bg-blue-100 p-4 rounded-2xl text-blue-600"><CreditCardIcon className="w-6 h-6"/></div>
                                    <div className="text-left"><p className="font-bold">Card Payment</p><p className="text-xs text-gray-400">Secure Visa/Mastercard</p></div>
                                </button>
                                <button onClick={() => { setPaymentMethod('momo'); setStep('payment-details'); }} className="w-full p-6 border rounded-3xl bg-white hover:border-yellow-500 shadow-sm flex items-center gap-4 transition-all">
                                    <div className="bg-yellow-100 p-4 rounded-2xl text-yellow-700"><PhoneIcon className="w-6 h-6"/></div>
                                    <div className="text-left"><p className="font-bold">MTN MoMo</p><p className="text-xs text-gray-400">Eswatini Mobile Money</p></div>
                                </button>
                             </div>
                        )}

                        {step === 'payment-details' && (
                            <Card className="shadow-2xl animate-fade-in border-0 rounded-[2.5rem]">
                                <div className="bg-slate-900 p-8 text-white rounded-t-[2.5rem] flex justify-between items-center">
                                    <div><p className="text-[10px] font-black uppercase opacity-60">Amount Due</p><p className="text-3xl font-black text-accent">E{finalPrice}</p></div>
                                    <ShieldCheckIcon className="w-8 h-8 text-accent" />
                                </div>
                                <CardContent className="p-8">
                                    <form onSubmit={handleFinalPayment} className="space-y-6">
                                        {paymentMethod === 'card' ? (
                                            <div className="space-y-4">
                                                <input required className={inputClass} placeholder="Card Number" maxLength={16} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} />
                                                <div className="grid grid-cols-2 gap-4"><input required className={inputClass} placeholder="MM/YY" onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} /><input type="password" required className={inputClass} placeholder="CVV" onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} /></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-yellow-50 p-4 rounded-xl text-xs text-yellow-800 border border-yellow-100">Keep your phone nearby for the MoMo prompt.</div>
                                                <input type="tel" required className={inputClass} placeholder="7xxxxxxx" maxLength={8} onChange={e => setPaymentDetails({...paymentDetails, momoNumber: e.target.value})} />
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full bg-primary text-white h-14 rounded-2xl font-black shadow-xl">Verify & Pay</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                        
                        {step === 'processing' && (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                                <Spinner className="w-20 h-20 mb-6" />
                                <h3 className="text-2xl font-black mb-2">{processingStatus}</h3>
                                <p className="text-gray-400 text-sm">Please do not refresh the page.</p>
                            </div>
                        )}
                    </div>
                )}

                {step === 'success' && (
                    <div className="bg-white min-h-screen flex items-center justify-center py-12 px-4 text-center">
                        <Card className="max-w-md w-full p-10 shadow-2xl rounded-[2.5rem] border-0">
                            <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircleIcon className="h-14 w-14 text-green-600" />
                            </div>
                            <h2 className="text-4xl font-display font-black text-gray-900 mb-4 uppercase tracking-tighter">Activated!</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Congratulations! <strong>{clubName}</strong> is now a verified digital member. Your {selectedTier} features are unlocked.
                            </p>
                            <Button onClick={() => navigate('/club-management')} className="w-full bg-primary text-white h-16 rounded-2xl font-black uppercase shadow-xl hover:scale-105 transition-transform">
                                Launch Management Portal
                            </Button>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubRegistrationPage;
