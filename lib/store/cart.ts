import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // cartItem id (for DB) or temp id (for guest)
  productId: string;
  variantId?: string | null;
  name: string;
  image: string;
  price: number;
  quantity: number;
  maxQty?: number;
  variantName?: string;
  slug: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  addItem: (item: Omit<CartItem, "id"> & { id?: string }) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.variantId === (newItem.variantId ?? null)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.variantId === (newItem.variantId ?? null)
                  ? { ...i, quantity: Math.min(i.quantity + (newItem.quantity ?? 1), i.maxQty ?? 99) }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...newItem, id: newItem.id ?? `local-${Date.now()}`, variantId: newItem.variantId ?? null },
            ],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === (variantId ?? null))
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity < 1) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === (variantId ?? null)
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      setItems: (items) => set({ items }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "nexcart-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
