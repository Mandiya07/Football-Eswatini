
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import XIcon from './icons/XIcon';
import TrashIcon from './icons/TrashIcon';
import Button from './ui/Button';
import CheckCircleIcon from './icons/CheckCircleIcon';
import Spinner from './ui/Spinner';
import { validatePromoCode } from '../services/api';
import TagIcon from './icons/TagIcon';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, subtotal, discountAmount, clearCart, applyDiscount, removeDiscount, appliedDiscount } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
        setIsCheckingOut(false);
        setCheckoutSuccess(true);
        clearCart();
    }, 2000);
  };
  
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
  
  const handleClose = () => {
    onClose();
    if (checkoutSuccess) {
        // Reset checkout state when modal is closed after success
        setTimeout(() => {
            setCheckoutSuccess(false);
        }, 500);
    }
  }

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
                <h2 id="cart-heading" className="text-xl font-display font-bold">Shopping Cart</h2>
                <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close cart">
                    <XIcon className="w-6 h-6 text-gray-600" />
                </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4">
                {checkoutSuccess ? (
                     <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold">Thank You!</h3>
                        <p className="text-gray-600">Your order has been placed successfully.</p>
                        <Button onClick={handleClose} className="mt-6 bg-blue-600 text-white hover:bg-blue-700">Continue Shopping</Button>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Your cart is empty.</p>
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
                                            aria-label={`Quantity for ${item.product.name}`}
                                        />
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-full" aria-label={`Remove ${item.product.name}`}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    
                    {/* Promo Code Section */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
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
            </div>
            
            {!checkoutSuccess && cartItems.length > 0 && (
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
                        onClick={handleCheckout} 
                        className="w-full bg-primary text-white hover:bg-primary-dark focus:ring-primary-light flex justify-center items-center h-10"
                        disabled={isCheckingOut}
                    >
                        {isCheckingOut ? <Spinner className="w-5 h-5 border-2"/> : 'Proceed to Checkout'}
                    </Button>
                </footer>
            )}
        </div>
      </div>
    </>
  );
};

export default CartModal;
