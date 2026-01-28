
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllCompetitions, submitClubRequest, PromoCode, processPayment, PaymentDetails, PaymentMethod } from '../services/api';
import ShieldIcon from './icons/ShieldIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import LockIcon from './icons/LockIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import PromoCodeInput from './ui/PromoCodeInput';
import { ClubBenefitsInfographic } from './ui/Infographics';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import TrophyIcon from './icons/TrophyIcon';

type RegStep = 'tier' | 'details' | 'payment-method' | 'payment-details' | 'processing' | 'success';

const ClubRegistrationPage: React.FC = () => {
    const { signup, user } = useAuth();
    const navigate = useNavigate();
    
    // UI Flow State
    const [step, setStep] = useState<RegStep>('tier');
    const [allTeams, setAllTeams] = useState<string[]>([]);
    
    // Form State
    const [clubName, setClubName] = useState('');
    const [repName, setRepName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    const [selectedTier, setSelectedTier] = useState('Professional'); // Default to Pro
    
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
        const loadTeams = async () => {
            try {
                const competitionsData = await fetchAllCompetitions();
                const localTeamNames = new Set<string>();
                Object.values(competitionsData).forEach(comp => {
                    comp.teams?.forEach(t => localTeamNames.add(t.name.trim()));
                });
                setAllTeams(Array.from(localTeamNames).sort());
            } catch (err) { console.error(err); }
        };
        loadTeams();
    }, []);

    const handleTierSubmit = () => {
        setStep('details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (selectedTier !== 'Basic' && finalPrice > 0) {
            setStep('payment-method');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            processFreeRegistration();
        }
    };

    const processFreeRegistration = async () => {
        setIsSubmitting(true);
        try {
            if (!user) {
                await signup({ name: repName, email, password });
            }
            await submitClubRequest({
                userId: user?.id || 'new_user', 
                clubName,
                repName,
                email,
                phone,
                tier: selectedTier,
                promoCode: discount ? discount.code : undefined,
                paymentStatus: 'pending'
            });
            setStep('success');
        } catch (err: any) {
            setError(err.message || "Failed to submit registration.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        setError('');
        
        const stages = ["Encrypting Details...", "Processing Subscription...", "Verifying Payment...", "Registering Club..."];
        let currentStage = 0;
        const interval = setInterval(() => {
            if (currentStage < stages.length) {
                setProcessingStatus(stages[currentStage]);
                currentStage++;
            }
        }, 800);

        try {
            const result = await processPayment(finalPrice, paymentDetails);
            
            if (result.success) {
                setTransactionId(result.transactionId);
                if (!user) await signup({ name: repName, email, password });

                await submitClubRequest({
                    userId: user?.id || 'new_user', 
                    clubName,
                    repName,
                    email,
                    phone,
                    tier: selectedTier,
                    promoCode: discount ? discount.code : undefined,
                    paymentStatus: 'paid'
                });

                clearInterval(interval);
                setStep('success');
            } else {
                clearInterval(interval);
                setError(result.message);
                setStep('payment-details');
            }
        } catch (err: any) {
            clearInterval(interval);
            setError("Technical error. Payment not processed.");
            setStep('payment-details');
        }
    };

    const inputClass = "block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all";

    const StepIndicator = () => {
        const steps = [
            { id: 'tier', label: 'Plan' },
            { id: 'details', label: 'Details' },
            { id: 'payment-method', label: 'Pay' }
        ];
        
        const currentIdx = steps.findIndex(s => s.id === step || (step === 'payment-details' && s.id === 'payment-method') || (step === 'processing' && s.id === 'payment-method'));

        return (
            <div className="flex justify-center items-center gap-2 mb-12">
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                                idx <= currentIdx ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400'
                            }`}>
                                {idx < currentIdx ? <CheckCircleIcon className="w-5 h-5"/> : idx + 1}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${idx <= currentIdx ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`w-12 h-0.5 mb-4 rounded ${idx < currentIdx ? 'bg-primary' : 'bg-gray-200'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (step === 'success') {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 text-center animate-fade-in">
                <Card className="max-w-md w-full p-8 shadow-2xl rounded-[2.5rem] border-0">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircleIcon className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-display font-black text-gray-900 mb-4 uppercase tracking-tighter">Welcome Aboard!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Your request to manage <strong>{clubName}</strong> is now being verified. 
                        {finalPrice > 0 && (
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100 mt-4">
                                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Transaction Confirmed</p>
                                <p className="font-mono text-sm font-bold text-green-800">{transactionId}</p>
                            </div>
                        )}
                    </p>
                    <Button onClick={() => navigate('/profile')} className="w-full bg-primary text-white h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                        Go to My Profile
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                
                {step !== 'success' && <StepIndicator />}

                {step === 'tier' && (
                    <div className="animate-fade-in space-y-12">
                        <div className="text-center max-w-2xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-4 tracking-tight">Select Your <span className="text-primary">Tier</span></h1>
                            <p className="text-gray-600">Choose the management package that fits your club's needs. Upgrade anytime.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {tiers.map(t => (
                                <Card 
                                    key={t.name} 
                                    className={`cursor-pointer transition-all duration-300 relative overflow-hidden group border-2 ${selectedTier === t.name ? 'border-primary shadow-2xl ring-4 ring-primary/5 -translate-y-2' : 'border-white hover:border-gray-200 shadow-sm'}`}
                                    onClick={() => setSelectedTier(t.name)}
                                >
                                    {selectedTier === t.name && (
                                        <div className="absolute top-0 right-0 p-2 text-primary">
                                            <CheckCircleIcon className="w-6 h-6" />
                                        </div>
                                    )}
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

                                        <Button 
                                            className={`w-full h-11 rounded-xl font-bold uppercase text-[10px] tracking-widest ${selectedTier === t.name ? 'bg-primary text-white shadow-lg' : 'bg-gray-50 text-gray-500 group-hover:bg-gray-100'}`}
                                        >
                                            {selectedTier === t.name ? 'SELECTED' : 'SELECT PLAN'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="max-w-4xl mx-auto">
                            <ClubBenefitsInfographic />
                        </div>

                        <div className="flex justify-center pt-8">
                            <Button onClick={handleTierSubmit} className="bg-primary text-white h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                Next: Account Details <ArrowRightIcon className="w-5 h-5"/>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                    <div className="max-w-4xl mx-auto animate-fade-in">
                        <Card className="shadow-2xl rounded-[2.5rem] overflow-hidden border-0">
                            <div className="bg-primary p-8 text-white flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black font-display uppercase tracking-tight">Club Information</h2>
                                    <p className="text-blue-100 text-xs">Registering for {selectedTier} Tier</p>
                                </div>
                                <button onClick={() => setStep('tier')} className="text-xs font-bold text-white/60 hover:text-white underline">Change Plan</button>
                            </div>
                            <CardContent className="p-10">
                                <form onSubmit={handleDetailsSubmit} className="space-y-8">
                                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 tracking-widest">1. Your Organization</label>
                                            <div className="relative">
                                                <input list="team-names" value={clubName} onChange={e => setClubName(e.target.value)} required className={inputClass} placeholder="Enter official club name..." />
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20"><TrophyIcon className="w-5 h-5" /></div>
                                                <datalist id="team-names">{allTeams.map(n => <option key={n} value={n} />)}</datalist>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 tracking-widest">2. Official Representative</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={repName} onChange={e => setRepName(e.target.value)} required placeholder="Full Name & Title" />
                                                <Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Work Email" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 tracking-widest">3. Secure Portal Access</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Input icon={<LockIcon className="w-5 h-5 text-gray-400"/>} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Set Password" />
                                                <Input icon={<LockIcon className="w-5 h-5 text-gray-400"/>} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm Password" />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 tracking-widest">4. Contact</label>
                                            <Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Phone Number" />
                                        </div>

                                        <div className="pt-4">
                                            <PromoCodeInput onApply={setDiscount} label="Referral/Discount Code (Optional)" />
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t flex flex-col md:flex-row gap-4">
                                        <Button type="button" variant="outline" onClick={() => setStep('tier')} className="flex-1 h-14 rounded-2xl border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to Plans
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-primary text-white h-14 text-lg shadow-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all">
                                            {isSubmitting ? <Spinner className="w-5 h-5 border-white border-2" /> : finalPrice > 0 ? `Secure & Continue (E${finalPrice})` : 'Finalize Registration'}
                                            <ShieldCheckIcon className="w-6 h-6" />
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 'payment-method' && (
                    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-gray-900 mb-2">Secure Checkout</h3>
                            <p className="text-sm text-gray-500">Select payment method for your <strong>{selectedTier}</strong> subscription.</p>
                        </div>

                        <div className="space-y-4">
                            <button onClick={() => { setPaymentMethod('card'); setStep('payment-details'); }} className="w-full p-6 border border-gray-200 bg-white rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><CreditCardIcon className="w-7 h-7"/></div>
                                    <div className="text-left"><p className="font-black text-gray-900">Corporate Card</p><p className="text-xs text-gray-400">Secure Visa/Mastercard</p></div>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </button>
                            <button onClick={() => { setPaymentMethod('momo'); setStep('payment-details'); }} className="w-full p-6 border border-gray-200 bg-white rounded-[2rem] hover:border-yellow-500 hover:shadow-xl transition-all flex items-center justify-between group shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-yellow-100 p-4 rounded-2xl text-yellow-700 group-hover:bg-yellow-500 group-hover:text-white transition-colors"><PhoneIcon className="w-7 h-7"/></div>
                                    <div className="text-left"><p className="font-black text-gray-900">MTN MoMo</p><p className="text-xs text-gray-400">Official Mobile Money</p></div>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>

                        <Button variant="ghost" onClick={() => setStep('details')} className="w-full text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-8">
                            <ArrowLeftIcon className="w-3 h-3 mr-2" /> Back to details
                        </Button>
                    </div>
                )}

                {step === 'payment-details' && (
                    <Card className="max-w-md mx-auto shadow-2xl animate-fade-in border-0 rounded-[2.5rem]">
                         <div className="bg-gray-900 p-8 text-white rounded-t-[2.5rem] flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Total to Pay</p>
                                <p className="text-3xl font-black text-accent leading-none">E{finalPrice}</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl"><ShieldCheckIcon className="w-8 h-8 text-white"/></div>
                        </div>
                        <CardContent className="p-8">
                            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold">{error}</div>}
                            <form onSubmit={handleFinalPayment} className="space-y-6">
                                {paymentMethod === 'card' ? (
                                    <div className="space-y-4">
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Card Number</label><input required className={inputClass} placeholder="0000 0000 0000 0000" maxLength={16} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Expiry</label><input required className={inputClass} placeholder="MM/YY" maxLength={5} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} /></div>
                                            <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">CVV</label><input type="password" required className={inputClass} placeholder="***" maxLength={3} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} /></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-xs font-medium leading-relaxed border border-yellow-100">
                                            Ensure your MTN phone is nearby. You will receive an on-screen prompt to authorize the <strong>E{finalPrice}</strong> payment.
                                        </div>
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Mobile Number</label><input type="tel" required className={inputClass} placeholder="7xxxxxxx" maxLength={8} onChange={e => setPaymentDetails({...paymentDetails, momoNumber: e.target.value})} /></div>
                                    </div>
                                )}
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-14 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all">Confirm & Pay</Button>
                                <button type="button" onClick={() => setStep('payment-method')} className="w-full text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-primary transition-colors">Change Payment Method</button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
                        <div className="relative mb-8">
                            <Spinner className="w-24 h-24 border-gray-100 border-t-primary" />
                            <div className="absolute inset-0 flex items-center justify-center"><ShieldCheckIcon className="w-10 h-10 text-primary opacity-20"/></div>
                        </div>
                        <h3 className="text-3xl font-display font-black text-gray-900 mb-2 uppercase tracking-tighter">Securing Hub</h3>
                        <p className="text-gray-500 font-bold animate-pulse">{processingStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubRegistrationPage;
