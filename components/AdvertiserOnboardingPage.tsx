
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { submitAdvertiserRequest, PromoCode, processPayment, PaymentMethod, PaymentDetails } from '../services/api';
import MegaphoneIcon from './icons/MegaphoneIcon';
import UserIcon from './icons/UserIcon';
import MailIcon from './icons/MailIcon';
import PhoneIcon from './icons/PhoneIcon';
import Spinner from './ui/Spinner';
import CheckCircleIcon from './icons/CheckCircleIcon';
import BuildingIcon from './icons/BuildingIcon';
import PromoCodeInput from './ui/PromoCodeInput';
import { AdvertiserValueInfographic } from './ui/Infographics';
import CreditCardIcon from './icons/CreditCardIcon';

type AdStep = 'form' | 'payment-method' | 'payment-details' | 'processing' | 'success';

const AdvertiserOnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    
    // UI State
    const [step, setStep] = useState<AdStep>('form');
    const [companyName, setCompanyName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [industry, setIndustry] = useState('');
    const [budgetRange, setBudgetRange] = useState('E1,000 - E5,000');
    const [interestedPlacements, setInterestedPlacements] = useState<string[]>([]);
    const [discount, setDiscount] = useState<PromoCode | null>(null);
    
    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ method: 'card' });
    const [processingStatus, setProcessingStatus] = useState('Validating Hub Access...');
    const [transactionId, setTransactionId] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const placementOptions = [
        { label: 'Homepage Banner', price: 1200 },
        { label: 'Fixtures & Results', price: 1500 },
        { label: 'Live Scoreboard', price: 800 },
        { label: 'News Articles', price: 600 },
        { label: 'Community Hub', price: 400 }
    ];

    const totalPrice = interestedPlacements.reduce((sum, p) => sum + (placementOptions.find(opt => opt.label === p)?.price || 0), 0);
    const finalPrice = discount ? (discount.type === 'percentage' ? totalPrice * (1 - discount.value / 100) : Math.max(0, totalPrice - discount.value)) : totalPrice;

    const handleCheckboxChange = (option: string) => {
        setInterestedPlacements(prev => 
            prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
        );
    };

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (interestedPlacements.length === 0) return alert("Select at least one placement.");
        setStep('payment-method');
    };

    const handleFinalPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        
        try {
            const result = await processPayment(finalPrice, paymentDetails);
            if (result.success) {
                setTransactionId(result.transactionId);
                await submitAdvertiserRequest({
                    companyName, contactName, email, phone, industry, budgetRange, interestedPlacements,
                    promoCode: discount?.code, status: 'paid', paymentTransactionId: result.transactionId
                });
                setStep('success');
            } else {
                setError(result.message);
                setStep('payment-details');
            }
        } catch (err) {
            setError("Payment failure. Try again.");
            setStep('payment-details');
        }
    };

    const inputClass = "block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    if (step === 'success') {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 text-center">
                <Card className="max-w-md w-full p-8 shadow-2xl">
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-6" />
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Space Secured!</h2>
                    <p className="text-gray-600 mb-8">
                        Your advertising space for <strong>{companyName}</strong> has been paid and reserved. Our creative team will contact you at <strong>{email}</strong> to collect your assets.
                    </p>
                    <p className="text-xs font-mono text-gray-400 mb-8">TX: {transactionId}</p>
                    <Button onClick={() => navigate('/')} className="w-full bg-primary text-white">Back to Home</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <MegaphoneIcon className="w-12 h-12 mx-auto text-yellow-600 mb-4" />
                    <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Advertiser Hub</h1>
                </div>

                {step === 'form' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <AdvertiserValueInfographic />
                        <Card className="shadow-2xl">
                            <CardContent className="p-8">
                                <form onSubmit={handleInitialSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-black uppercase text-gray-400">Company</label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} required /></div>
                                        <div><label className="block text-xs font-black uppercase text-gray-400">Industry</label><Input value={industry} onChange={e => setIndustry(e.target.value)} required /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-black uppercase text-gray-400">Contact</label><Input value={contactName} onChange={e => setContactName(e.target.value)} required /></div>
                                        <div><label className="block text-xs font-black uppercase text-gray-400">Email</label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-gray-400 mb-3">Select Placements (Monthly)</label>
                                        <div className="space-y-2">
                                            {placementOptions.map(opt => (
                                                <label key={opt.label} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer ${interestedPlacements.includes(opt.label) ? 'bg-yellow-50 border-yellow-400' : 'hover:bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" checked={interestedPlacements.includes(opt.label)} onChange={() => handleCheckboxChange(opt.label)} className="h-4 w-4 text-yellow-600" />
                                                        <span className="text-sm font-bold">{opt.label}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-gray-400">E{opt.price}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <PromoCodeInput onApply={setDiscount} />
                                    <div className="pt-4 border-t"><Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12">Secure Placements (E{finalPrice})</Button></div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {step === 'payment-method' && (
                    <div className="max-w-md mx-auto space-y-4">
                        <button onClick={() => { setPaymentMethod('card'); setStep('payment-details'); }} className="w-full p-6 border rounded-2xl bg-white hover:border-blue-500 flex justify-between items-center group">
                            <span className="font-bold">Pay with Card</span>
                            <CreditCardIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                        </button>
                        <button onClick={() => { setPaymentMethod('momo'); setStep('payment-details'); }} className="w-full p-6 border rounded-2xl bg-white hover:border-yellow-500 flex justify-between items-center group">
                            <span className="font-bold">Pay with MoMo</span>
                            <PhoneIcon className="w-6 h-6 text-gray-400 group-hover:text-yellow-500" />
                        </button>
                    </div>
                )}

                {step === 'payment-details' && (
                    <Card className="max-w-md mx-auto shadow-2xl">
                        <CardContent className="p-8">
                            <form onSubmit={handleFinalPayment} className="space-y-6">
                                {paymentMethod === 'card' ? (
                                    <div className="space-y-4">
                                        <input required className={inputClass} placeholder="Card Number" maxLength={16} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input required className={inputClass} placeholder="MM/YY" maxLength={5} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} />
                                            <input type="password" required className={inputClass} placeholder="CVV" maxLength={3} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})} />
                                        </div>
                                    </div>
                                ) : (
                                    <input type="tel" required className={inputClass} placeholder="7xxxxxxx" maxLength={8} onChange={e => setPaymentDetails({...paymentDetails, momoNumber: e.target.value})} />
                                )}
                                <Button type="submit" className="w-full bg-primary text-white h-12 font-bold">Authorize E{finalPrice}</Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Spinner className="w-16 h-16" />
                        <p className="mt-6 font-bold text-gray-600">Processing Secure Transaction...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvertiserOnboardingPage;
