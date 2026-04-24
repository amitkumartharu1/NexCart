"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: { url: string; alt: string | null }[];
  status: string;
}

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  product: WishlistProduct;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    fetch("/api/dashboard/wishlist")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => {
        setItems(d.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRemove = async (itemId: string, productId: string) => {
    setRemoving(productId);
    try {
      const res = await fetch("/api/dashboard/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    const product = item.product;
    const image = product.images?.[0]?.url ?? "/placeholder.png";
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image,
      quantity: 1,
    });
    openCart();
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Products you&apos;ve saved for later
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-xl border border-border p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-square bg-background-subtle rounded-xl" />
                <div className="h-4 bg-background-subtle rounded w-3/4" />
                <div className="h-4 bg-background-subtle rounded w-1/3" />
                <div className="h-9 bg-background-subtle rounded-xl" />
              </div>
            ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-background rounded-xl border border-border flex flex-col items-center gap-4 py-20 text-foreground-muted">
          <Heart size={44} className="opacity-25" />
          <div className="text-center">
            <p className="font-semibold text-foreground text-lg">
              Your wishlist is empty
            </p>
            <p className="text-sm mt-1">
              Save products you like and come back to them later
            </p>
          </div>
          <Link
            href="/shop"
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const product = item.product;
            const image = product.images?.[0]?.url ?? "/placeholder.png";
            const isRemoving = removing === product.id;

            return (
              <div
                key={item.id}
                className="bg-background rounded-xl border border-border overflow-hidden group hover:border-primary/30 transition-colors"
              >
                {/* Product Image */}
                <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-background-subtle">
                  <Image
                    src={image}
                    alt={product.images?.[0]?.alt ?? product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      SALE
                    </span>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <Link
                      href={`/products/${product.slug}`}
                      className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors text-sm leading-snug"
                    >
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-bold text-foreground">
                        {formatCurrency(product.price)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="text-xs text-foreground-muted line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={product.status !== "ACTIVE"}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        product.status === "ACTIVE"
                          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                          : "bg-background-subtle text-foreground-muted cursor-not-allowed"
                      )}
                    >
                      <ShoppingCart size={14} />
                      {product.status === "ACTIVE" ? "Add to Cart" : "Out of Stock"}
                    </button>
                    <button
                      onClick={() => handleRemove(item.id, product.id)}
                      disabled={isRemoving}
                      className="p-2 rounded-xl border border-border text-foreground-muted hover:text-red-500 hover:border-red-300 transition-colors disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={14} />
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
