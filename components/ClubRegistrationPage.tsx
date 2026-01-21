
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

type RegStep = 'form' | 'payment-method' | 'payment-details' | 'processing' | 'success';

const ClubRegistrationPage: React.FC = () => {
    const { signup, user } = useAuth();
    const navigate = useNavigate();
    
    // UI Flow State
    const [step, setStep] = useState<RegStep>('form');
    const [allTeams, setAllTeams] = useState<string[]>([]);
    
    // Form State
    const [clubName, setClubName] = useState('');
    const [repName, setRepName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    const [selectedTier, setSelectedTier] = useState('Basic');
    
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ method: 'card' });
    const [processingStatus, setProcessingStatus] = useState('Validating Request...');
    const [transactionId, setTransactionId] = useState('');
    
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tiers = [
        { name: 'Basic', price: 0, priceStr: 'Free', features: 'Public Profile, Squad List, Fixtures & Results' },
        { name: 'Professional', price: 120, priceStr: 'E120/mo', features: 'Admin Portal Access, Post News, Update Scores' },
        { name: 'Elite', price: 250, priceStr: 'E250/mo', features: 'Merchandise Store, Video Hub Embedding, Sponsor Slots' },
        { name: 'Enterprise', price: 500, priceStr: 'E500/mo', features: 'Branded Club Hub (Ad-free), Sponsorship Analytics, Dedicated Manager' },
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

    const handleInitialSubmit = async (e: React.FormEvent) => {
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

        if (finalPrice > 0) {
            setStep('payment-method');
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

    const inputClass = "block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (step === 'success') {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 text-center animate-fade-in">
                <Card className="max-w-md w-full p-8 shadow-2xl">
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-6" />
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Registration Complete!</h2>
                    <p className="text-gray-600 mb-6">
                        Your request to manage <strong>{clubName}</strong> is now being verified. 
                        {finalPrice > 0 && <span className="block mt-2 font-bold text-green-700">Transaction ID: {transactionId}</span>}
                    </p>
                    <Button onClick={() => navigate('/profile')} className="w-full bg-primary text-white h-12 font-bold">
                        Go to My Profile
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12 animate-fade-in">
                    <ShieldIcon className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                        {step === 'form' ? 'Club Official Registration' : 
                         step === 'payment-method' ? 'Secure Checkout' : 'Enter Payment Info'}
                    </h1>
                </div>

                {step === 'form' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
                        <div className="space-y-8">
                            <ClubBenefitsInfographic />
                            <Card className="shadow-lg border-l-4 border-blue-600">
                                <CardContent className="p-6">
                                    <h3 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-widest">Select Management Tier</h3>
                                    <div className="space-y-3">
                                        {tiers.map(t => (
                                            <label key={t.name} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedTier === t.name ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" checked={selectedTier === t.name} onChange={() => setSelectedTier(t.name)} className="h-4 w-4 text-blue-600" />
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">{t.name}</p>
                                                        <p className="text-[10px] text-gray-500 line-clamp-1">{t.features}</p>
                                                    </div>
                                                </div>
                                                <span className="font-black text-xs text-blue-700">{t.priceStr}</span>
                                            </label>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-2xl">
                            <CardContent className="p-8">
                                <form onSubmit={handleInitialSubmit} className="space-y-5">
                                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-bold border border-red-100">{error}</div>}
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-1">Target Club</label>
                                        <input list="team-names" value={clubName} onChange={e => setClubName(e.target.value)} required className={inputClass} placeholder="Search or type club name..." />
                                        <datalist id="team-names">{allTeams.map(n => <option key={n} value={n} />)}</datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Full Name</label><Input icon={<UserIcon className="w-5 h-5 text-gray-400"/>} value={repName} onChange={e => setRepName(e.target.value)} required placeholder="Official Name" /></div>
                                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Official Email</label><Input icon={<MailIcon className="w-5 h-5 text-gray-400"/>} type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                                    </div>
                                    <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Contact Phone</label><Input icon={<PhoneIcon className="w-5 h-5 text-gray-400"/>} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required /></div>
                                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Set Password</label><Input icon={<LockIcon className="w-5 h-5 text-gray-400"/>} type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Confirm</label><Input icon={<LockIcon className="w-5 h-5 text-gray-400"/>} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
                                    </div>
                                    <PromoCodeInput onApply={setDiscount} label="Referral/Discount Code" />
                                    <div className="pt-6 border-t"><Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-12 text-lg shadow-xl font-bold flex items-center justify-center gap-3">{isSubmitting ? <Spinner className="w-5 h-5 border-2" /> : finalPrice > 0 ? `Secure Payment (E${finalPrice})` : 'Register Free Club'}<ShieldCheckIcon className="w-5 h-5" /></Button></div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 'payment-method' && (
                    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
                        <p className="text-center text-gray-500 font-medium">Select a payment method for your <strong>{selectedTier}</strong> plan.</p>
                        <button onClick={() => { setPaymentMethod('card'); setStep('payment-details'); }} className="w-full p-6 border-2 border-gray-100 bg-white rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><CreditCardIcon className="w-6 h-6"/></div>
                                <div className="text-left"><p className="font-bold text-gray-900">Credit / Debit Card</p><p className="text-xs text-gray-400">VISA / Mastercard Secure</p></div>
                            </div>
                        </button>
                        <button onClick={() => { setPaymentMethod('momo'); setStep('payment-details'); }} className="w-full p-6 border-2 border-gray-100 bg-white rounded-2xl hover:border-yellow-500 hover:bg-yellow-50 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="bg-yellow-100 p-3 rounded-xl text-yellow-700 group-hover:bg-yellow-500 group-hover:text-white transition-colors"><PhoneIcon className="w-6 h-6"/></div>
                                <div className="text-left"><p className="font-bold text-gray-900">MTN MoMo</p><p className="text-xs text-gray-400">Official Mobile Money</p></div>
                            </div>
                        </button>
                    </div>
                )}

                {step === 'payment-details' && (
                    <Card className="max-w-md mx-auto shadow-2xl animate-fade-in">
                        <CardContent className="p-8">
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold">{error}</div>}
                            <form onSubmit={handleFinalPayment} className="space-y-6">
                                {paymentMethod === 'card' ? (
                                    <div className="space-y-4">
                                        <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Card Number</label><input required className={inputClass} placeholder="0000 0000 0000 0000" maxLength={16} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Expiry</label><input required className={inputClass} placeholder="MM/YY" maxLength={5} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} /></div>
                                            <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">CVV</label><input type="password" required className={inputClass} placeholder="***" maxLength={3} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} /></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div><label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Mobile Money Number</label><input type="tel" required className={inputClass} placeholder="7xxxxxxx" maxLength={8} onChange={e => setPaymentDetails({...paymentDetails, momoNumber: e.target.value})} /></div>
                                )}
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white h-12 font-bold shadow-lg">Confirm & Pay E{finalPrice}</Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
                        <Spinner className="w-20 h-20 border-t-primary border-gray-100" />
                        <p className="mt-8 text-xl font-bold text-gray-900">{processingStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClubRegistrationPage;
