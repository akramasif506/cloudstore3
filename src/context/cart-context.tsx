

"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Product as BaseProduct, Discount, DiscountMap } from '@/lib/types';
import { getFeeConfig } from '@/app/dashboard/manage-fees/actions';
import { getDiscounts } from '@/app/dashboard/manage-discounts/actions';
import { getCategories } from '@/app/dashboard/manage-categories/actions';
import type { CategoryMap } from '@/app/dashboard/manage-categories/actions';

// The CartItem extends the base Product type
export interface CartItem extends BaseProduct {
  quantity: number;
}

// The Product type in this context is the same as the base Product
export type Product = BaseProduct;

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
  tax: number;
  total: number;
  feeConfig: FeeConfig | null;
  setPinCode: (pinCode: string) => void;
  appliedDiscount: { name: string; value: number } | null;
  selectedItems: Set<string>;
  toggleItemSelection: (productId: string) => void;
  toggleSelectAll: () => void;
  removeSelectedFromCart: () => void;
  isAllSelected: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const [discounts, setDiscounts] = useState<DiscountMap | null>(null);
  const [categories, setCategories] = useState<CategoryMap | null>(null);
  const [pinCode, setPinCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ name: string; value: number } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load cart and selections from localStorage on initial render
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('cartItems');
      const savedSelections = localStorage.getItem('cartSelections');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
      if (savedSelections) {
        setSelectedItems(new Set(JSON.parse(savedSelections)));
      }
    } catch (error) {
      console.error("Failed to parse cart data from localStorage", error);
    }

    // Fetch fee, discount, and category configurations
    getFeeConfig().then(config => {
      setFeeConfig(config || { platformFeePercent: 0, handlingFeeFixed: 0 });
    });
    getDiscounts().then(setDiscounts);
    getCategories().then(setCategories);
  }, []);

  // Save cart and selections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('cartSelections', JSON.stringify(Array.from(selectedItems)));
  }, [selectedItems]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });
    // Automatically select the newly added item
    setSelectedItems(prev => new Set(prev).add(product.id));
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
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
    setSelectedItems(new Set());
  };

  const removeSelectedFromCart = () => {
    setItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  }

  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(productId)) {
            newSet.delete(productId);
        } else {
            newSet.add(productId);
        }
        return newSet;
    });
  };

  const isAllSelected = items.length > 0 && selectedItems.size === items.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
        setSelectedItems(new Set());
    } else {
        setSelectedItems(new Set(items.map(item => item.id)));
    }
  }

  const selectedItemsDetails = items.filter(item => selectedItems.has(item.id));
  const subtotal = selectedItemsDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate discount based on PIN code and subtotal
  useEffect(() => {
    if (!discounts || !pinCode || subtotal === 0) {
      setAppliedDiscount(null);
      return;
    }

    let bestDiscount = 0;
    let bestDiscountRule: { name: string; value: number } | null = null;
    
    Object.values(discounts).forEach(rule => {
      if (rule.enabled && rule.pincodes.includes(pinCode)) {
        let currentDiscountValue = 0;
        if (rule.type === 'percentage') {
          currentDiscountValue = subtotal * (rule.value / 100);
        } else { // 'fixed'
          currentDiscountValue = rule.value;
        }

        if (currentDiscountValue > bestDiscount) {
          bestDiscount = currentDiscountValue;
          bestDiscountRule = { name: rule.name, value: bestDiscount };
        }
      }
    });
    
    // Ensure discount does not exceed subtotal
    if (bestDiscount > subtotal) {
        bestDiscount = subtotal;
        if(bestDiscountRule) bestDiscountRule.value = bestDiscount;
    }
    
    if (bestDiscountRule) {
        setAppliedDiscount(bestDiscountRule);
    } else {
        setAppliedDiscount(null);
    }

  }, [pinCode, subtotal, discounts]);
  
  
  const tax = selectedItemsDetails.reduce((sum, item) => {
    if (!categories) return sum;
    const category = categories[item.category];
    if (!category) return sum;

    let taxPercent = category.taxPercent || 0;
    const subcategory = category.subcategories.find(sub => sub.name === item.subcategory);
    
    // Subcategory tax overrides category tax if it's explicitly set (and not 0)
    if (subcategory && subcategory.taxPercent) {
      taxPercent = subcategory.taxPercent;
    }

    const itemTax = (item.price * item.quantity) * (taxPercent / 100);
    return sum + itemTax;
  }, 0);


  const discountValue = appliedDiscount?.value || 0;
  const platformFee = feeConfig ? subtotal * (feeConfig.platformFeePercent / 100) : 0;
  const handlingFee = feeConfig && subtotal > 0 ? feeConfig.handlingFeeFixed : 0;
  const total = subtotal + platformFee + handlingFee + tax - discountValue;

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    platformFee,
    handlingFee,
    tax,
    total,
    feeConfig,
    setPinCode,
    appliedDiscount,
    selectedItems,
    toggleItemSelection,
    toggleSelectAll,
    removeSelectedFromCart,
    isAllSelected,
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
