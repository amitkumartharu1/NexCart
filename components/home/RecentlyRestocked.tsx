"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RefreshCw, ShoppingCart, Star, ArrowRight, Package, Eye } from "lucide-react";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { formatCurrency } from "@/lib/utils/format";
import { useCartStore } from "@/lib/store/cart";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  rating: number | null;
  reviewCount: number;
  images: { url: string; altText: string | null }[];
  inventory: { quantity: number; lastRestockedAt: string | null } | null;
  category: { name: string } | null;
}

const URGENCY = [
  { sold: 634, viewing: 9 },
  { sold: 1102, viewing: 14 },
  { sold: 421, viewing: 5 },
  { sold: 877, viewing: 18 },
  { sold: 253, viewing: 7 },
  { sold: 1340, viewing: 11 },
  { sold: 566, viewing: 16 },
  { sold: 789, viewing: 10 },
];

export function RecentlyRestocked() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products?filter=restocked&limit=8")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => { setProducts(d.products ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAddToCart = (product: Product) => {
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
      image: product.images[0]?.url ?? "",
      price: product.basePrice,
      quantity: 1,
      maxQty: stock,
      slug: product.slug,
    });
    toast.success(`${product.name} added to cart`);
    openCart();
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw size={16} className="text-emerald-500" />
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Just Restocked</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Back in Stock</h2>
            <p className="mt-2 text-foreground-muted">Popular items that just got restocked. Grab them before they&apos;re gone!</p>
          </div>
          <Link href="/shop?filter=restocked" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {loading
            ? Array(4).fill(null).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-background overflow-hidden">
                  <div className="aspect-square bg-background-subtle animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-background-subtle rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-background-subtle rounded animate-pulse w-1/2" />
                    <div className="h-8 bg-background-subtle rounded animate-pulse" />
                  </div>
                </div>
              ))
            : products.map((product, idx) => {
                const stock = product.inventory?.quantity ?? 0;
                const isLowStock = stock > 0 && stock <= 10;
                const urgency = URGENCY[idx % URGENCY.length];
                return (
                  <div key={product.id} className="group rounded-2xl border border-border bg-background overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden relative bg-background-subtle">
                      {product.images[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].altText ?? product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                          <Package size={32} />
                        </div>
                      )}
                      {/* Restocked badge */}
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          <RefreshCw size={10} />
                          Restocked
                        </span>
                      </div>
                      {isLowStock && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            Only {stock} left
                          </span>
                        </div>
                      )}
                      {/* Wishlist button */}
                      <WishlistButton
                        productId={product.id}
                        productSlug={product.slug}
                        iconSize={14}
                        className="absolute bottom-3 right-3 w-8 h-8 border border-border bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                      />
                    </Link>
                    <div className="p-4 space-y-3">
                      <div>
                        {product.category && (
                          <p className="text-xs text-foreground-muted mb-0.5">{product.category.name}</p>
                        )}
                        <Link href={`/products/${product.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 text-sm">
                          {product.name}
                        </Link>
                      </div>
                      {product.rating !== null && (
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map((s) => (
                              <Star key={s} size={10} className={cn("fill-current", s <= Math.round(product.rating!) ? "text-yellow-400" : "text-gray-200 dark:text-gray-700")} />
                            ))}
                          </div>
                          <span className="text-xs text-foreground-muted">({product.reviewCount})</span>
                        </div>
                      )}
                      {/* ── Price Psychology ── */}
                      <div className="flex items-baseline gap-2">
                        {/* New price — RED, bold */}
                        <span className="text-lg font-black" style={{ color: "#dc2626" }}>
                          {formatCurrency(product.basePrice)}
                        </span>
                        {/* Old price — gray strikethrough */}
                        {product.comparePrice && product.comparePrice > product.basePrice && (
                          <>
                            <span className="text-sm font-medium line-through" style={{ color: "#9ca3af" }}>
                              {formatCurrency(product.comparePrice)}
                            </span>
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#dc2626" }}>
                              -{Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      {/* Urgency counters */}
                      <div className="flex items-center gap-3 text-[10px] text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <ShoppingCart size={9} className="text-primary" />
                          {urgency.sold.toLocaleString()} sold
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={9} className="text-amber-500" />
                          {urgency.viewing} viewing
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={stock === 0}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={14} />
                        {stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
