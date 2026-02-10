
import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { Product } from '../data/shop';
import { PromoCode } from '../services/api';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (discount: PromoCode) => void;
  removeDiscount: () => void;
  appliedDiscount: PromoCode | null;
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<PromoCode | null>(null);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedDiscount(null);
  };

  const applyDiscount = (discount: PromoCode) => {
      setAppliedDiscount(discount);
  };

  const removeDiscount = () => {
      setAppliedDiscount(null);
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
        const price = item.product.salePrice || item.product.price;
        return total + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
      if (!appliedDiscount) return 0;
      if (appliedDiscount.type === 'percentage') {
          return subtotal * (appliedDiscount.value / 100);
      } else {
          // Fixed amount discount
          return Math.min(appliedDiscount.value, subtotal);
      }
  }, [subtotal, appliedDiscount]);

  const cartTotal = useMemo(() => {
      return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);


  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, applyDiscount, removeDiscount, appliedDiscount, cartCount, subtotal, discountAmount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
