import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  setIds: (ids: string[]) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      add: (productId) =>
        set((s) => ({
          productIds: s.productIds.includes(productId)
            ? s.productIds
            : [...s.productIds, productId],
        })),

      remove: (productId) =>
        set((s) => ({
          productIds: s.productIds.filter((id) => id !== productId),
        })),

      has: (productId) => get().productIds.includes(productId),

      setIds: (ids) => set({ productIds: ids }),
    }),
    {
      name: "nexcart-wishlist",
    }
  )
);
