import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import XIcon from './icons/XIcon';
import TrashIcon from './icons/TrashIcon';
import Button from './ui/Button';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';
import { validatePromoCode, processPayment, PaymentMethod, PaymentDetails } from '../services/api';
import TagIcon from './icons/TagIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import PhoneIcon from './icons/PhoneIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'cart' | 'payment-method' | 'payment-details' | 'processing' | 'success';

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, subtotal, discountAmount, clearCart, applyDiscount, removeDiscount, appliedDiscount } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({ method: 'card' });
  const [processingStatus, setProcessingStatus] = useState('Initiating Secure Transaction...');
  const [transactionId, setTransactionId] = useState('');
  
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleApplyPromo = async () => {
      if (!promoCodeInput.trim()) return;
      setValidatingPromo(true);
      setPromoError('');
      try {
          const discount = await validatePromoCode(promoCodeInput.trim().toUpperCase());
          if (discount) {
              applyDiscount(discount);
              setPromoCodeInput('');
          } else {
              setPromoError('Invalid or expired code.');
          }
      } catch (error) {
          setPromoError('Error checking code.');
      } finally {
          setValidatingPromo(false);
      }
  };

  const handleProceedToPaymentMethod = () => {
    setStep('payment-method');
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setPaymentDetails({ ...paymentDetails, method });
    setStep('payment-details');
  };

  const handleFinalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setPaymentError('');
    
    // Simulate real production multi-stage feedback
    const stages = [
        "Verifying Account Information...",
        "Establishing Secure Connection...",
        "Authorizing Transaction with Bank...",
        "Finalizing Order Details..."
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
        if (currentStage < stages.length) {
            setProcessingStatus(stages[currentStage]);
            currentStage++;
        }
    }, 600);

    try {
        const result = await processPayment(cartTotal, paymentDetails);
        clearInterval(interval);

        if (result.success) {
            setTransactionId(result.transactionId);
            setStep('success');
            clearCart();
        } else {
            setPaymentError(result.message);
            setStep('payment-details');
        }
    } catch (err) {
        clearInterval(interval);
        setPaymentError("A technical error occurred in the payment gateway. Please try again.");
        setStep('payment-details');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay so the transition is smooth
    setTimeout(() => {
        setStep('cart');
        setPaymentMethod(null);
        setPaymentError('');
        setProcessingStatus('Initiating Secure Transaction...');
    }, 300);
  };

  const inputClass = "block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
        aria-hidden={!isOpen}
      ></div>
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
      >
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    {step !== 'cart' && step !== 'success' && (
                        <button onClick={() => setStep(step === 'payment-details' ? 'payment-method' : 'cart')} className="p-1 hover:bg-gray-100 rounded-full">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    <h2 id="cart-heading" className="text-xl font-display font-bold">
                        {step === 'cart' ? 'Shopping Cart' : 
                         step === 'payment-method' ? 'Choose Payment' : 
                         step === 'payment-details' ? 'Payment Details' : 
                         step === 'processing' ? 'Processing...' : 'Success'}
                    </h2>
                </div>
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close cart">
                    <XIcon className="w-6 h-6 text-gray-600" />
                </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                {step === 'cart' && (
                    <>
                        {cartItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-20">
                                <TagIcon className="w-16 h-16 text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">Your cart is empty.</p>
                                <Button onClick={handleClose} variant="outline" className="mt-4">Browse Shop</Button>
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y divide-gray-200 -my-4">
                                    {cartItems.map(item => (
                                        <li key={item.product.id} className="flex items-center gap-4 py-4">
                                            <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-contain rounded-md border" />
                                            <div className="flex-grow">
                                                <p className="font-semibold text-sm">{item.product.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.product.salePrice ? (
                                                        <>
                                                            <span className="line-through mr-1">E{item.product.price.toFixed(2)}</span>
                                                            <span className="text-red-600 font-bold">E{item.product.salePrice.toFixed(2)}</span>
                                                        </>
                                                    ) : (
                                                        `E${item.product.price.toFixed(2)}`
                                                    )}
                                                </p>
                                                <div className="mt-2 flex items-center">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value, 10))}
                                                        className="w-14 text-center border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        min="1"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-full">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                
                                <div className="mt-8 pt-4 border-t border-gray-100">
                                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><TagIcon className="w-4 h-4"/> Discount Code</p>
                                    {appliedDiscount ? (
                                        <div className="flex justify-between items-center bg-green-50 border border-green-200 p-2 rounded-md">
                                            <span className="text-sm text-green-800 font-medium">Code <strong>{appliedDiscount.code}</strong> applied!</span>
                                            <button onClick={removeDiscount} className="text-xs text-red-600 hover:underline">Remove</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={promoCodeInput} 
                                                onChange={(e) => setPromoCodeInput(e.target.value)} 
                                                placeholder="Enter Code" 
                                                className="flex-grow border border-gray-300 rounded-md px-3 py-2 text-sm"
                                            />
                                            <Button 
                                                onClick={handleApplyPromo} 
                                                disabled={validatingPromo || !promoCodeInput}
                                                className="bg-gray-800 text-white text-xs px-3"
                                            >
                                                {validatingPromo ? <Spinner className="w-3 h-3 border-2" /> : 'Apply'}
                                            </Button>
                                        </div>
                                    )}
                                    {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
                                </div>
                            </>
                        )}
                    </>
                )}

                {step === 'payment-method' && (
                    <div className="space-y-4 animate-fade-in">
                        <p className="text-sm text-gray-600 mb-6 text-center">Select your preferred production-ready payment method for Eswatini.</p>
                        
                        <button 
                            onClick={() => selectPaymentMethod('card')}
                            className="w-full flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <CreditCardIcon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">Credit / Debit Card</p>
                                    <p className="text-xs text-gray-500">Secure card processing via local gateway</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <button 
                            onClick={() => selectPaymentMethod('momo')}
                            className="w-full flex items-center justify-between p-5 border-2 border-gray-100 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-yellow-100 p-3 rounded-full text-yellow-700 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                    <PhoneIcon className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800">MTN MoMo</p>
                                    <p className="text-xs text-gray-500">Fast mobile money payment for Eswatini</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>

                        <div className="mt-10 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center gap-3">
                            <ShieldCheckIcon className="w-10 h-10 text-gray-400" />
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-relaxed">
                                Your transactions are encrypted and secured by Football Eswatini's banking partners.
                            </p>
                        </div>
                    </div>
                )}

                {step === 'payment-details' && (
                    <form onSubmit={handleFinalPayment} className="space-y-6 animate-fade-in">
                        {paymentError && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-semibold mb-4">
                                {paymentError}
                            </div>
                        )}

                        {paymentMethod === 'card' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cardholder Name</label>
                                    <input type="text" required className={inputClass} placeholder="AS APPEARS ON CARD" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Number</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className={inputClass} 
                                        placeholder="0000 0000 0000 0000" 
                                        maxLength={16}
                                        value={paymentDetails.cardNumber || ''}
                                        onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry (MM/YY)</label>
                                        <input 
                                            type="text" 
                                            required 
                                            className={inputClass} 
                                            placeholder="MM / YY" 
                                            maxLength={5}
                                            value={paymentDetails.expiry || ''}
                                            onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CVV</label>
                                        <input 
                                            type="password" 
                                            required 
                                            className={inputClass} 
                                            placeholder="***" 
                                            maxLength={3}
                                            value={paymentDetails.cvv || ''}
                                            onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 p-4 rounded-xl flex items-center gap-4 border border-yellow-200 mb-6">
                                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center font-black text-white text-xl">!</div>
                                    <p className="text-xs text-yellow-800 font-medium">Please ensure you have sufficient balance in your MoMo wallet and your phone is nearby to approve the prompt.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MTN Mobile Number</label>
                                    <input 
                                        type="tel" 
                                        required 
                                        className={inputClass} 
                                        placeholder="7xxxxxxx" 
                                        maxLength={8}
                                        value={paymentDetails.momoNumber || ''}
                                        onChange={e => setPaymentDetails({...paymentDetails, momoNumber: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4">
                            <Button type="submit" className="w-full bg-primary text-white h-12 text-lg shadow-xl font-bold flex items-center justify-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5" />
                                Pay E{cartTotal.toFixed(2)}
                            </Button>
                        </div>
                    </form>
                )}

                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-fade-in">
                        <div className="relative mb-8">
                            <Spinner className="w-24 h-24 border-gray-100 border-t-primary" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShieldCheckIcon className="w-8 h-8 text-primary opacity-30" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Secure Processing</h3>
                        <p className="text-sm text-gray-500 font-medium animate-pulse">{processingStatus}</p>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 animate-fade-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <CheckCircleIcon className="w-12 h-12 text-green-600" />
                        </div>
                        <h3 className="text-3xl font-display font-black text-gray-900 mb-2">Payment Successful!</h3>
                        <p className="text-gray-600 mb-8 px-4">Your order has been confirmed and is being processed by our team.</p>
                        
                        <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8 text-left space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                <span className="font-medium text-gray-500">Transaction ID</span>
                                <span className="font-mono font-bold text-gray-900">{transactionId}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                                <span className="font-medium text-gray-500">Amount Paid</span>
                                <span className="font-bold text-green-700">E{cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-500">Method</span>
                                <span className="font-bold text-gray-800 capitalize">{paymentMethod}</span>
                            </div>
                        </div>

                        <Button onClick={handleClose} className="w-full bg-primary text-white h-12 font-bold shadow-lg">Back to Shop</Button>
                    </div>
                )}
            </div>
            
            {step === 'cart' && cartItems.length > 0 && (
                <footer className="p-4 border-t bg-gray-50">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>E{subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Discount</span>
                                <span>-E{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                            <p className="font-bold text-lg text-gray-900">Total</p>
                            <p className="font-bold text-xl text-blue-600">E{cartTotal.toFixed(2)}</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleProceedToPaymentMethod} 
                        className="w-full bg-primary text-white hover:bg-primary-dark focus:ring-primary-light flex justify-center items-center h-12 text-lg font-bold shadow-lg"
                    >
                        Checkout & Pay
                    </Button>
                </footer>
            )}
        </div>
      </div>
    </>
  );
};

export default CartModal;