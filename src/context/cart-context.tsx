
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { getFeeConfig } from '@/app/dashboard/manage-fees/actions';

export interface CartItem extends Product {
  quantity: number;
}

export interface FeeConfig {
    platformFeePercent: number;
    handlingFeeFixed: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  platformFee: number;
  handlingFee: number;
  total: number;
  feeConfig: FeeConfig | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('cartItems');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (error) {
      console.error("Failed to parse cart items from localStorage", error);
    }

    // Fetch fee configuration
    getFeeConfig().then(config => {
      setFeeConfig(config || { platformFeePercent: 0, handlingFeeFixed: 0 });
    });
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        // Increment quantity if item already exists
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      // Add new item to cart
      return [...prevItems, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const platformFee = feeConfig ? subtotal * (feeConfig.platformFeePercent / 100) : 0;
  const handlingFee = feeConfig ? feeConfig.handlingFeeFixed : 0;
  const total = subtotal + platformFee + handlingFee;

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    platformFee,
    handlingFee,
    total,
    feeConfig,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
