import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { errorService } from '../lib/errorService';
import useLanguageStore from './languageStore';

const loadCart = () => {
  try {
    const saved = localStorage.getItem('zein-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items) => {
  localStorage.setItem('zein-cart', JSON.stringify(items));
};

const useCartStore = create((set, get) => ({
  items: loadCart(),
  isCartOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),

  addItem: (product, replace = false) => {
    const items = get().items;
    const existingIndex = items.findIndex(
      (item) => item.variantId === product.variantId
    );

    let newItems;
    if (existingIndex >= 0) {
      newItems = items.map((item, i) =>
        i === existingIndex
          ? { 
              ...item, 
              quantity: replace 
                ? product.quantity 
                : Math.min(
                    item.quantity + (product.quantity || 1), 
                    item.maxStock || Infinity
                  ) 
            }
          : item
      );
    } else {
      newItems = [...items, { ...product, quantity: product.quantity || 1 }];
    }

    saveCart(newItems);
    set({ items: newItems, isCartOpen: true });
  },

  removeItem: (variantId) => {
    const newItems = get().items.filter((item) => item.variantId !== variantId);
    saveCart(newItems);
    set({ items: newItems });
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(variantId);
      return;
    }
    const newItems = get().items.map((item) =>
      item.variantId === variantId 
        ? { ...item, quantity: Math.min(quantity, item.maxStock || Infinity) } 
        : item
    );
    saveCart(newItems);
    set({ items: newItems });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },



  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },

  getTotal: () => {
    return get().getSubtotal();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

export default useCartStore;
