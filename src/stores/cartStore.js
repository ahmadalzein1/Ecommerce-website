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
  discount: null,
  discountLoading: false,
  discountError: null,
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
    set({ items: [], discount: null });
  },

  applyDiscount: async (code) => {
    const lang = useLanguageStore.getState().language;
    const isAR = lang === 'ar';

    if (!errorService.isOnline()) {
      set({ 
        discountLoading: false, 
        discountError: isAR ? 'لا يوجد اتصال بالإنترنت' : 'No internet connection' 
      });
      return false;
    }

    set({ discountLoading: true, discountError: null });

    try {
      const fetchDiscount = async () => {
        const { data, error } = await supabase
          .from('discount_codes')
          .select('*')
          .eq('code', code.trim().toUpperCase())
          .eq('is_active', true)
          .single();

        if (error) throw error;
        return data;
      };

      const data = await errorService.withTimeout(fetchDiscount(), 8000);

      if (!data) {
        throw new Error('invalid_discount');
      }

      const now = new Date();
      if (data.valid_from && new Date(data.valid_from) > now) {
        throw new Error('discount_not_active');
      }
      if (data.valid_until && new Date(data.valid_until) < now) {
        throw new Error('discount_expired');
      }
      if (data.max_uses && data.times_used >= data.max_uses) {
        throw new Error('discount_limit_reached');
      }

      set({
        discount: {
          id: data.id,
          code: data.code,
          type: data.discount_type,
          value: Number(data.discount_value),
        },
        discountLoading: false,
        discountError: null,
      });
      return true;
    } catch (err) {
      set({ 
        discountLoading: false, 
        discountError: errorService.translate(err, lang)
      });
      return false;
    }
  },

  removeDiscount: () => set({ discount: null, discountError: null }),

  getSubtotal: () => {
    return get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  },

  getDiscountAmount: () => {
    const discount = get().discount;
    if (!discount) return 0;
    const subtotal = get().getSubtotal();
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    }
    return 0;
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscountAmount();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));

export default useCartStore;
