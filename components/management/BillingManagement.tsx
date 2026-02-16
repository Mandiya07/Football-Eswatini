
import React, { useState } from 'react';
import { useAuth, SubscriptionInfo } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import CreditCardIcon from '../icons/CreditCardIcon';
import PhoneIcon from '../icons/PhoneIcon';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import AlertTriangleIcon from '../icons/AlertTriangleIcon';
import { processPayment, PaymentMethod, PaymentDetails } from '../../services/api';

const BillingManagement: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [step, setStep] = useState<'overview' | 'payment-method' | 'payment-details' | 'processing' | 'success'>('overview');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ method: 'card' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [transactionId, setTransactionId] = useState('');

    const sub = user?.subscription;
    
    // Tiers mapping for pricing
    const tierPrices: Record<string, number> = {
        'Basic': 0,
        'Professional': 120,
        'Elite': 250,
        'Enterprise': 350
    };

    const currentPrice = sub ? (tierPrices[sub.tier] || 0) : 0;

    const handleRenewClick = () => {
        setStep('payment-method');
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('processing');
        
        try {
            const result = await processPayment(currentPrice, paymentDetails);
            if (result.success) {
                setTransactionId(result.transactionId);
                
                // Update next renewal date in Firestore (add 30 days)
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + 30);
                
                const updatedSub: SubscriptionInfo = {
                    ...sub!,
                    status: 'active',
                    nextRenewalDate: nextDate.toISOString().split('T')[0],
                    lastTransactionId: result.transactionId
                };
                
                await updateUser({ subscription: updatedSub });
                setStep('success');
            } else {
                alert(result.message);
                setStep('payment-details');
            }
        } catch (error) {
            alert("Renewal failed due to a technical error.");
            setStep('overview');
        }
    };

    if (!sub) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-gray-500 italic">No active billing profile found for this account.</p>
                </CardContent>
            </Card>
        );
    }

    const isExpiringSoon = sub.status === 'expiring' || sub.status === 'past_due';

    return (
        <div className="space-y-6 animate-fade-in">
            {step === 'overview' && (
                <div className="space-y-6">
                    <Card className={`border-l-4 ${isExpiringSoon ? 'border-red-500' : 'border-green-500 shadow-lg'}`}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold font-display text-gray-900">{sub.tier} Subscription</h3>
                                    <p className="text-sm text-gray-500">Club Management & Digital Hub Package</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                    sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'
                                }`}>
                                    {sub.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Monthly Cost</p>
                                    <p className="text-xl font-bold text-gray-800">E{currentPrice.toFixed(2)}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Next Renewal</p>
                                    <p className="text-xl font-bold text-gray-800">{sub.nextRenewalDate}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Payment Method</p>
                                    <p className="text-xl font-bold text-gray-800">{sub.autoRenew ? 'Automatic' : 'Manual'}</p>
                                </div>
                            </div>

                            {isExpiringSoon && (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-4 mb-6">
                                    <AlertTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-red-800">Payment Required</p>
                                        <p className="text-sm text-red-700">Your subscription has expired or is about to expire. Renew now to avoid service interruption to your Club Hub.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                                <Button onClick={handleRenewClick} className="bg-primary text-white hover:bg-primary-dark shadow-lg px-8">
                                    Renew Subscription
                                </Button>
                                <Button variant="outline" className="text-gray-600 border-gray-300">
                                    Change Plan
                                </Button>
                                <Button variant="ghost" className="text-red-500 hover:bg-red-50 sm:ml-auto">
                                    Cancel Subscription
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardContent className="p-6">
                            <h4 className="font-bold text-gray-800 mb-4">Billing History</h4>
                            <div className="space-y-3">
                                {sub.lastTransactionId && (
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                        <div>
                                            <p className="font-bold text-gray-800">Renewal: {sub.tier} Plan</p>
                                            <p className="text-xs text-gray-400">TX: {sub.lastTransactionId}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">E{currentPrice.toFixed(2)}</p>
                                            <p className="text-[10px] text-green-600 font-bold uppercase">Paid</p>
                                        </div>
                                    </div>
                                )}
                                <p className="text-center text-xs text-gray-400 py-2">View all previous invoices in the Archive.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {step === 'payment-method' && (
                <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
                    <h3 className="text-xl font-bold text-center mb-6">Select Payment Method</h3>
                    <button onClick={() => { setPaymentMethod('card'); setStep('payment-details'); }} className="w-full p-6 border border-gray-200 bg-white rounded-2xl hover:border-primary transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><CreditCardIcon className="w-6 h-6"/></div>
                            <div className="text-left"><p className="font-bold">Credit / Debit Card</p><p className="text-xs text-gray-500">Secure Visa/Mastercard</p></div>
                        </div>
                    </button>
                    <button onClick={() => { setPaymentMethod('momo'); setStep('payment-details'); }} className="w-full p-6 border border-gray-200 bg-white rounded-2xl hover:border-yellow-500 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-100 p-3 rounded-xl text-yellow-700"><PhoneIcon className="w-6 h-6"/></div>
                            <div className="text-left"><p className="font-bold">MTN MoMo</p><p className="text-xs text-gray-500">Fast Mobile Money</p></div>
                        </div>
                    </button>
                    <Button onClick={() => setStep('overview')} variant="ghost" className="w-full text-gray-500 mt-4">Cancel</Button>
                </div>
            )}

            {step === 'payment-details' && (
                <Card className="max-w-lg mx-auto animate-fade-in">
                    <CardContent className="p-8">
                        <h3 className="text-xl font-bold mb-6">Confirm Renewal (E{currentPrice.toFixed(2)})</h3>
                        <form onSubmit={handlePayment} className="space-y-6">
                            {paymentMethod === 'card' ? (
                                <div className="space-y-4">
                                    <input className="w-full p-2 border rounded" placeholder="Card Number" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="w-full p-2 border rounded" placeholder="MM/YY" required />
                                        <input className="w-full p-2 border rounded" placeholder="CVV" type="password" required />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-yellow-800 bg-yellow-50 p-3 rounded-lg border border-yellow-100">Ensure your phone is ready to receive the MoMo approval prompt.</p>
                                    <input className="w-full p-2 border rounded" placeholder="MTN Number (7xxxxxxx)" required type="tel" maxLength={8} />
                                </div>
                            )}
                            <Button type="submit" className="w-full bg-primary text-white h-12 text-lg font-bold shadow-xl flex items-center justify-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5" /> Authorize Payment
                            </Button>
                            <button type="button" onClick={() => setStep('payment-method')} className="w-full text-sm text-gray-500 hover:underline">Change Method</button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {step === 'processing' && (
                <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
                    <Spinner className="w-20 h-20 border-t-primary" />
                    <p className="mt-8 text-xl font-bold text-gray-900">Processing Renewal...</p>
                    <p className="text-xs text-gray-400 mt-2">Connecting to production gateway...</p>
                </div>
            )}

            {step === 'success' && (
                <Card className="max-w-lg mx-auto text-center animate-fade-in border-green-500 border-2">
                    <CardContent className="p-10">
                        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-display font-black text-gray-900 mb-2">Renewal Successful!</h3>
                        <p className="text-gray-600 mb-8">Your club hub subscription has been extended for another 30 days.</p>
                        <div className="bg-gray-50 p-4 rounded-xl text-left text-sm mb-8 space-y-2">
                            <div className="flex justify-between"><span>Transaction ID:</span> <span className="font-mono font-bold">{transactionId}</span></div>
                            <div className="flex justify-between"><span>New Expiry:</span> <span className="font-bold">{sub.nextRenewalDate}</span></div>
                        </div>
                        <Button onClick={() => setStep('overview')} className="w-full bg-primary text-white">Back to Dashboard</Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default BillingManagement;
