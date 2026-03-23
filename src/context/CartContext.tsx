import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { safeStorage } from '../utils/storageUtils';

type CartItem = any; // Tipagem genérica mantida do original

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    return safeStorage.getItem('valiant_cart', []);
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    safeStorage.setItem('valiant_cart', cart);
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
  };
  
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
