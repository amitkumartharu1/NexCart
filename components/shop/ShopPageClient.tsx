"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Star, ShoppingCart, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WishlistButton } from "@/components/ui/WishlistButton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductImage {
  url: string;
  altText: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  rating?: number | null;
  reviewCount?: number;
  brand: { name: string } | null;
  category: { name: string; slug: string } | null;
  images: ProductImage[];
  inventory: { quantity: number; lastRestockedAt: string | null } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
] as const;

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProductCardSkeleton() {
  return (
    <div className="card-premium overflow-hidden animate-pulse">
      <div className="aspect-square bg-background-muted" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-background-muted rounded w-1/3" />
        <div className="h-4 bg-background-muted rounded w-3/4" />
        <div className="h-3 bg-background-muted rounded w-1/2" />
        <div className="h-5 bg-background-muted rounded w-1/4" />
        <div className="h-9 bg-background-muted rounded-lg mt-3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Star Rating
// ---------------------------------------------------------------------------

function StarRating({ rating, count }: { rating?: number | null; count?: number }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={cn(
            i <= Math.round(r)
              ? "fill-yellow-400 text-yellow-400"
              : "text-foreground-subtle"
          )}
        />
      ))}
      <span className="text-xs text-foreground-muted ml-0.5">({count})</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const totalStock = product.inventory?.quantity ?? 0;
  const isOutOfStock = totalStock === 0;

  const image = product.images[0]?.url ? product.images[0] : null;

  const base = Number(product.basePrice);
  const compare = Number(product.comparePrice ?? 0);
  const discountPct =
    compare > base && base > 0
      ? Math.round(((compare - base) / compare) * 100)
      : null;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      image: image?.url ?? "",
      price: product.basePrice,
      quantity: 1,
      maxQty: totalStock,
      slug: product.slug,
    });
    openCart();
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="group card-premium overflow-hidden hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square bg-background-muted overflow-hidden block">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-foreground-subtle text-4xl">
            📦
          </div>
        )}

        {/* Discount badge */}
        {discountPct && (
          <span className="absolute top-2 left-2 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
            -{discountPct}% OFF
          </span>
        )}

        {/* Wishlist button */}
        <WishlistButton
          productId={product.id}
          productSlug={product.slug}
          iconSize={13}
          className="absolute top-2 right-2 w-7 h-7 border border-border bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          stopPropagation
        />

        {/* Out of Stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-background border border-border text-foreground-muted">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1 space-y-2">
        {product.brand && (
          <p className="text-xs text-foreground-muted font-medium uppercase tracking-wide">
            {product.brand.name}
          </p>
        )}
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>

        <StarRating rating={product.rating ?? null} count={product.reviewCount ?? 0} />

        {/* Price */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-base font-black" style={{ color: "#dc2626" }}>
            {formatCurrency(product.basePrice)}
          </span>
          {compare > base && base > 0 && (
            <span className="text-xs font-medium line-through" style={{ color: "#555" }}>
              {formatCurrency(product.comparePrice)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            "mt-auto w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-colors",
            isOutOfStock
              ? "bg-background-muted text-foreground-muted cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary-hover"
          )}
        >
          <ShoppingCart size={13} />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ShopPageClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 9999]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        sort: selectedSort,
        minPrice: String(priceRange[0]),
        maxPrice: String(priceRange[1]),
      });
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) { setProducts([]); setPagination(null); return; }
      const text = await res.text();
      if (!text) { setProducts([]); setPagination(null); return; }
      const data = JSON.parse(text);
      setProducts(data.products ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, selectedSort, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedSort("newest");
    setPriceRange([0, 9999]);
    setPage(1);
  }

  const hasActiveFilters =
    search !== "" ||
    selectedCategory !== "" ||
    selectedSort !== "newest" ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 9999;

  // ---------------------------------------------------------------------------
  // Sidebar
  // ---------------------------------------------------------------------------

  const Sidebar = (
    <aside className="w-full lg:w-64 xl:w-72 shrink-0 space-y-6">
      {/* Search */}
      <div>
        <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">
          Search
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">
          Sort by
        </label>
        <select
          value={selectedSort}
          onChange={(e) => { setSelectedSort(e.target.value); setPage(1); }}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">
          Categories
        </label>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => { setSelectedCategory(""); setPage(1); }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                selectedCategory === ""
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-background-subtle"
              )}
            >
              All Products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                  selectedCategory === cat.slug
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-background-subtle"
                )}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-foreground-muted">{cat._count.products}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">
          Price Range
        </label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-foreground-muted mb-1 block">Min ($)</label>
              <input
                type="number"
                min={0}
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value));
                  setPriceRange([v, priceRange[1]]);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-foreground-muted mb-1 block">Max ($)</label>
              <input
                type="number"
                min={priceRange[0]}
                value={priceRange[1]}
                onChange={(e) => {
                  const v = Math.max(priceRange[0], Number(e.target.value));
                  setPriceRange([priceRange[0], v]);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
        >
          <X size={14} />
          Clear filters
        </button>
      )}
    </aside>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background-subtle">
      {/* Header — pt-20 offsets the fixed navbar */}
      <div className="bg-background border-b border-border pt-20">
        <div className="container-wide py-8">
          <h1 className="text-3xl font-bold text-foreground">Shop</h1>
          <p className="text-foreground-muted mt-1 text-sm">
            {pagination ? `${pagination.total.toLocaleString()} products` : "Browse our collection"}
          </p>
        </div>
      </div>

      <div className="container-wide py-8">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:border-border-strong transition-colors"
          >
            <SlidersHorizontal size={15} />
            {sidebarOpen ? "Hide Filters" : "Show Filters"}
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar — desktop always visible, mobile toggleable */}
          <div
            className={cn(
              "lg:block",
              sidebarOpen ? "block" : "hidden"
            )}
          >
            {Sidebar}
          </div>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-sm text-foreground-muted mb-6">
                  Try adjusting your filters or search term.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground disabled:opacity-40 hover:border-border-strong transition-colors"
                    >
                      <ChevronLeft size={14} />
                      Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === pagination.totalPages ||
                            Math.abs(p - page) <= 2
                        )
                        .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "..." ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-foreground-muted text-sm">
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setPage(item as number)}
                              className={cn(
                                "w-9 h-9 rounded-xl text-sm font-medium transition-colors",
                                page === item
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border bg-background text-foreground hover:border-border-strong"
                              )}
                            >
                              {item}
                            </button>
                          )
                        )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground disabled:opacity-40 hover:border-border-strong transition-colors"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
