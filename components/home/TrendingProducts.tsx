"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, ShoppingCart, Eye } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  rating?: number | null;
  reviewCount?: number;
  isFeatured: boolean;
  category: { name: string; slug: string } | null;
  images: { url: string; altText: string | null }[];
  inventory: { quantity: number } | null;
}

const BADGE_STYLES: Record<string, string> = {
  featured: "bg-primary/10 text-primary border-primary/20",
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  sale: "bg-red-500/10 text-red-600 border-red-500/20",
};

function getBadge(p: Product): { label: string; style: string } | null {
  if (p.comparePrice && p.comparePrice > p.basePrice) {
    const pct = Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100);
    return { label: `-${pct}% OFF`, style: "bg-red-500 text-white border-red-600" };
  }
  if (p.isFeatured) return { label: "Best Seller", style: "bg-amber-500/90 text-white border-amber-600" };
  return null;
}

function getDiscountPct(p: Product): number {
  if (!p.comparePrice || p.comparePrice <= p.basePrice) return 0;
  return Math.round(((p.comparePrice - p.basePrice) / p.comparePrice) * 100);
}

/* Deterministic urgency seeds per card slot (no Math.random — SSR safe) */
const URGENCY = [
  { sold: 847, viewing: 12 },
  { sold: 1203, viewing: 8 },
  { sold: 562, viewing: 15 },
  { sold: 2041, viewing: 23 },
  { sold: 389, viewing: 6 },
  { sold: 718, viewing: 19 },
  { sold: 1455, viewing: 11 },
  { sold: 934, viewing: 7 },
];

function ProductCardSkeleton() {
  return (
    <div className="card-premium overflow-hidden animate-pulse">
      <div className="aspect-square bg-background-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-background-muted rounded w-1/2" />
        <div className="h-4 bg-background-muted rounded w-3/4" />
        <div className="h-3 bg-background-muted rounded w-1/3" />
        <div className="h-5 bg-background-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products?limit=8&sort=rating")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { products: Product[] } | null) => {
        if (data?.products?.length) setProducts(data.products);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAddToCart(product: Product) {
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/products/${product.slug}`);
      return;
    }
    const stock = product.inventory?.quantity ?? 0;
    if (stock === 0) {
      toast.error("This product is out of stock");
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.basePrice,
      image: product.images[0]?.url ?? undefined,
      quantity: 1,
      maxQty: stock,
    });
    openCart();
    toast.success(`${product.name} added to cart`);
  }

  return (
    <section className="py-20 bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Trending</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Popular Right Now</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.length === 0
            ? (
              <div className="col-span-full py-16 text-center text-foreground-muted">
                <ShoppingCart size={40} className="mx-auto opacity-30 mb-3" />
                <p>No products available yet. Check back soon!</p>
              </div>
            )
            : products.map((product, idx) => {
              const badge = getBadge(product);
              const stock = product.inventory?.quantity ?? 0;
              const outOfStock = stock === 0;
              const image = product.images[0]?.url ? product.images[0] : null;
              const urgency = URGENCY[idx % URGENCY.length];

              return (
                <div key={product.id} className="group card-premium overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.16), 0 0 0 1px rgba(59,130,246,0.15)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)")}
                >
                  {/* Image — tapping navigates to product */}
                  <Link href={`/products/${product.slug}`} className="block relative aspect-square bg-background-muted overflow-hidden">
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          // If image fails to load, hide it and show the fallback
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          const parent = (e.currentTarget as HTMLImageElement).parentElement;
                          if (parent) {
                            const fallback = parent.querySelector(".img-fallback") as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    {/* Fallback shown when no image URL or image fails to load */}
                    <div
                      className="img-fallback absolute inset-0 flex flex-col items-center justify-center gap-2 select-none"
                      style={{
                        display: image ? "none" : "flex",
                        background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(124,58,237,0.12) 100%)",
                      }}
                    >
                      <span
                        className="text-5xl font-black"
                        style={{
                          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-semibold text-foreground-muted px-2 text-center line-clamp-2">
                        {product.category?.name ?? "Product"}
                      </span>
                    </div>
                    {/* Discount badge — top left */}
                    {badge && (
                      <span className={`absolute top-2 left-2 text-xs font-black px-2 py-0.5 rounded-full border ${badge.style}`}>
                        {badge.label}
                      </span>
                    )}
                    {/* Wishlist button — top right */}
                    <WishlistButton
                      productId={product.id}
                      productSlug={product.slug}
                      iconSize={13}
                      className="absolute top-2 right-2 w-7 h-7 border border-border bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    />
                    {/* Stock warning */}
                    {!outOfStock && stock > 0 && stock <= 5 && (
                      <span className="absolute bottom-12 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                        Only {stock} left!
                      </span>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <span className="text-xs font-semibold bg-background-subtle px-2 py-1 rounded-full border border-border text-foreground-muted">Out of Stock</span>
                      </div>
                    )}
                    {/* Add to Cart — always visible on mobile, hover-reveal on desktop */}
                    {!outOfStock && (
                      <div
                        className="absolute inset-x-0 bottom-0 p-2 md:translate-y-full md:group-hover:translate-y-0 md:transition-transform md:duration-200"
                        onClick={(e) => e.preventDefault()}
                      >
                        <button
                          onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
                          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
                        >
                          <ShoppingCart size={13} /> Add to Cart
                        </button>
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-3 space-y-1.5">
                    {product.category && (
                      <p className="text-xs text-foreground-muted">{product.category.name}</p>
                    )}
                    <Link href={`/products/${product.slug}`} className="block text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </Link>
                    {/* Rating */}
                    {product.rating != null && (
                      <div className="flex items-center gap-1">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{Number(product.rating).toFixed(1)}</span>
                        {product.reviewCount ? <span className="text-xs text-foreground-muted">({product.reviewCount})</span> : null}
                      </div>
                    )}
                    {/* ── Price Psychology ── */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-base font-black" style={{ color: "#dc2626" }}>
                        {formatCurrency(product.basePrice)}
                      </span>
                      {product.comparePrice && product.comparePrice > product.basePrice && (
                        <span className="text-xs font-medium line-through" style={{ color: "#9ca3af" }}>
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>
                    {/* Urgency counters */}
                    <div className="flex items-center gap-2 text-[10px] text-foreground-muted pt-0.5">
                      <span className="flex items-center gap-1">
                        <ShoppingCart size={9} className="text-primary" />
                        {urgency.sold.toLocaleString()} sold
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={9} className="text-amber-500" />
                        {urgency.viewing} viewing
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">View all products →</Link>
        </div>
      </div>
    </section>
  );
}
