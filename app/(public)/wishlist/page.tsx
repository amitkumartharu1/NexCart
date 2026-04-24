"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Heart, ShoppingCart, Trash2, LogIn, Package } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: { url: string; altText: string | null }[];
  inventory: { quantity: number } | null;
}

interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
}

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-background border border-border rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-square bg-background-subtle" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-background-subtle rounded w-3/4" />
            <div className="h-4 bg-background-subtle rounded w-1/3" />
            <div className="h-9 bg-background-subtle rounded-lg mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { addItem } = useCartStore();
  const { setIds } = useWishlistStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/dashboard/wishlist")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((data) => {
        const loaded: WishlistItem[] = data.items ?? [];
        setItems(loaded);
        // Sync store so heart icons reflect DB state
        setIds(loaded.map((i) => i.productId));
      })
      .catch(() => toast.error("Failed to load wishlist"))
      .finally(() => setLoading(false));
  }, [session, status, setIds]);

  const { remove: removeFromStore } = useWishlistStore();

  async function handleRemove(productId: string) {
    try {
      const res = await fetch("/api/dashboard/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      removeFromStore(productId);
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    }
  }

  function handleAddToCart(item: WishlistItem) {
    const product = item.product;
    const image = product.images[0]?.url ?? "";
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image,
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`);
  }

  // Not logged in
  if (status !== "loading" && !session?.user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20">
        <div className="bg-background-subtle rounded-2xl p-12 flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-background border-2 border-dashed border-border flex items-center justify-center">
            <Heart className="w-10 h-10 text-foreground-muted" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your Wishlist
            </h2>
            <p className="text-foreground-muted">
              Sign in to save your favourite products and access them anytime.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
        {!loading && (
          <span className="text-foreground-muted text-lg">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        )}
      </div>

      {loading ? (
        <WishlistSkeleton />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-24 h-24 rounded-full bg-background-subtle border-2 border-dashed border-border flex items-center justify-center">
            <Heart className="w-10 h-10 text-foreground-muted" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Save items you love
            </h2>
            <p className="text-foreground-muted">
              Tap the heart icon on any product to add it here.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const product = item.product;
            const image = product.images[0]?.url ?? "";
            const inStock =
              (product.inventory?.quantity ?? 0) > 0;

            return (
              <div
                key={item.id}
                className="bg-background border border-border rounded-xl overflow-hidden flex flex-col group"
              >
                {/* Image */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative aspect-square block bg-background-subtle overflow-hidden"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={product.images[0]?.altText ?? product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-foreground-muted" />
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                  >
                    {product.name}
                  </Link>
                  <p className="text-primary font-bold">
                    {formatCurrency(product.price)}
                  </p>
                  {!inStock && (
                    <p className="text-xs text-red-500 font-medium">
                      Out of stock
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto pt-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!inStock}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition-colors",
                        inStock
                          ? "bg-primary text-white hover:opacity-90"
                          : "bg-background-subtle text-foreground-muted cursor-not-allowed"
                      )}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="p-2 rounded-lg border border-border text-foreground-muted hover:text-red-500 hover:border-red-300 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
