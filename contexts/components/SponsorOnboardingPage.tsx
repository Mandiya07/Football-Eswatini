
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { submitSponsorRequest, PromoCode, processPayment, PaymentMethod, PaymentDetails } from '../services/api';
import BriefcaseIcon from './icons/BriefcaseIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import BuildingIcon from './icons/BuildingIcon';
import PromoCodeInput from './ui/PromoCodeInput';
import { SponsorEcosystemInfographic } from './ui/Infographics';
import PhoneIcon from './icons/PhoneIcon';
import CreditCardIcon from './icons/CreditCardIcon';

type SponStep = 'form' | 'payment-method' | 'payment-details' | 'processing' | 'success';

const SponsorOnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    
    // UI State
    const [step, setStep] = useState<SponStep>('form');
    const [brandName, setBrandName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [sponsorshipTier, setSponsorshipTier] = useState('Bronze');
    const [goals, setGoals] = useState('');
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ method: 'card' });
    const [transactionId, setTransactionId] = useState('');
    const [error, setError] = useState('');

    const tiers = [
        { name: 'Bronze', price: 10000, desc: 'Digital section branding' },
        { name: 'Silver', price: 20000, desc: 'Section naming rights' },
        { name: 'Gold', price: 35000, desc: 'Title features & widespread visibility' },
        { name: 'Platinum', price: 60000, desc: 'Total ecosystem integration' }
    ];

    const currentTier = tiers.find(t => t.name === sponsorshipTier) || tiers[0];
    const finalPrice = discount ? (discount.type === 'percentage' ? currentTier.price * (1 - discount.value / 100) : Math.max(0, currentTier.price - discount.value)) : currentTier.price;

    const handleInitialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('payment-method');
    };

    const handleFinalPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        
        try {
            const result = await processPayment(finalPrice, paymentDetails);
            if (result.success) {
                setTransactionId(result.transactionId);
                await submitSponsorRequest({
                    brandName, contactName, email, phone, sponsorshipTier, goals,
                    promoCode: discount?.code, status: 'paid', paymentTransactionId: result.transactionId
                });
                setStep('success');
            } else {
                setError(result.message);
                setStep('payment-details');
            }
        } catch (err) {
            setError("Network failure.");
            setStep('payment-details');
        }
    };

    if (step === 'success') {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-20 px-4 text-center">
                <Card className="max-w-md w-full p-10 shadow-2xl">
                    <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Partner Authenticated</h2>
                    <p className="text-gray-600 mb-8">Thank you for committing to the <strong>{sponsorshipTier}</strong> tier. Your transaction has been logged.</p>
                    <p className="text-xs font-mono text-gray-400 mb-8">ID: {transactionId}</p>
                    <Button onClick={() => navigate('/')} className="w-full bg-primary text-white h-12 font-bold">Return to Dashboard</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <BriefcaseIcon className="w-12 h-12 mx-auto text-green-700 mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900">Partner Program</h1>
                </div>

                {step === 'form' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <SponsorEcosystemInfographic />
                        <Card className="shadow-2xl">
                            <CardContent className="p-8">
                                <form onSubmit={handleInitialSubmit} className="space-y-6">
                                    <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Brand Name</label><Input value={brandName} onChange={e => setBrandName(e.target.value)} required /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Marketing Contact</label><Input value={contactName} onChange={e => setContactName(e.target.value)} required /></div>
                                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Official Email</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                                    </div>
                                    <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Select Tier (Annual)</label>
                                        <select value={sponsorshipTier} onChange={e => setSponsorshipTier(e.target.value)} className="block w-full p-2.5 border rounded-lg text-sm font-bold">
                                            {tiers.map(t => <option key={t.name} value={t.name}>{t.name} (E{t.price.toLocaleString()})</option>)}
                                        </select>
                                    </div>
                                    <PromoCodeInput onApply={setDiscount} />
                                    <div className="pt-4 border-t"><Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-12">Initiate Partnership (E{finalPrice.toLocaleString()})</Button></div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 'payment-method' && (
                    <div className="max-w-md mx-auto space-y-4">
                        <button onClick={() => { setPaymentMethod('card'); setStep('payment-details'); }} className="w-full p-6 border rounded-2xl bg-white hover:border-primary flex justify-between items-center group transition-all">
                            <span className="font-bold">Corporate Card</span>
                            <CreditCardIcon className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                        </button>
                        <button onClick={() => { setPaymentMethod('momo'); setStep('payment-details'); }} className="w-full p-6 border rounded-2xl bg-white hover:border-green-600 flex justify-between items-center group transition-all">
                            <span className="font-bold">Business MoMo</span>
                            <PhoneIcon className="w-6 h-6 text-gray-400 group-hover:text-green-600" />
                        </button>
                    </div>
                )}

                {step === 'payment-details' && (
                    <Card className="max-w-md mx-auto shadow-2xl">
                        <CardContent className="p-8">
                            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold mb-4">{error}</div>}
                            <form onSubmit={handleFinalPayment} className="space-y-6">
                                {paymentMethod === 'card' ? (
                                    <div className="space-y-4">
                                        <input required className="w-full p-2 border rounded" placeholder="Card Number" maxLength={16} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required className="w-full p-2 border rounded" placeholder="MM/YY" maxLength={5} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} />
                                            <input type="password" required className="w-full p-2 border rounded" placeholder="CVV" maxLength={3} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} />
                                        </div>
                                    </div>
                                ) : (
                                    <input type="tel" required className="w-full p-2 border rounded" placeholder="7xxxxxxx" maxLength={8} onChange={e => setPaymentDetails({...paymentDetails, momoNumber: e.target.value})} />
                                )}
                                <Button type="submit" className="w-full bg-green-700 text-white h-12 font-bold shadow-xl">Authorize Payment</Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Spinner className="w-16 h-16 border-t-green-600" />
                        <p className="mt-6 font-bold text-gray-600">Verifying Corporate Transaction...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SponsorOnboardingPage;
