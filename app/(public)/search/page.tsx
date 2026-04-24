"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, Package, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProductImage {
  url: string;
  alt: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  rating: number | null;
  images: ProductImage[];
  brand: { name: string } | null;
  inventory: { quantity: number }[];
}

function ProductCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-background-subtle" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-background-subtle rounded w-1/3" />
        <div className="h-4 bg-background-subtle rounded w-3/4" />
        <div className="h-5 bg-background-subtle rounded w-1/4" />
        <div className="h-9 bg-background-subtle rounded-lg mt-3" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCartStore();
  const q = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(q);
    if (!q.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/products?search=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((data) => setProducts(data.products ?? []))
      .catch((err) => {
        if (err.name !== "AbortError") {
          toast.error("Search failed. Please try again.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleAddToCart(product: Product) {
    const inStock = product.inventory.reduce((s, i) => s + i.quantity, 0) > 0;
    if (!inStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0]?.url ?? "",
      quantity: 1,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <div className="container-wide py-10">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className={cn(
              "w-full bg-background border border-border rounded-xl",
              "pl-12 pr-12 py-3.5 text-foreground placeholder:text-foreground-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              "transition-colors"
            )}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>

      {/* Results Header */}
      {q && !loading && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {products.length}{" "}
            {products.length === 1 ? "result" : "results"} for{" "}
            <span className="text-primary">&ldquo;{q}&rdquo;</span>
          </h1>
        </div>
      )}

      {!q && !loading && (
        <div className="text-center py-24 text-foreground-muted">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Enter a keyword to search products</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && q && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="w-20 h-20 rounded-full bg-background-subtle border-2 border-dashed border-border flex items-center justify-center">
            <Search className="w-8 h-8 text-foreground-muted" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">
              No results found for &ldquo;{q}&rdquo;
            </h2>
            <p className="text-foreground-muted max-w-sm">
              Try different keywords, check your spelling, or browse our
              categories.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Browse All Products
          </Link>
        </div>
      )}

      {/* Results Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => {
            const inStock =
              product.inventory.reduce((s, i) => s + i.quantity, 0) > 0;
            const image = product.images[0]?.url ?? "";

            return (
              <div
                key={product.id}
                className="bg-background border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative aspect-square block bg-background-subtle overflow-hidden"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={product.images[0]?.alt ?? product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-foreground-muted" />
                    </div>
                  )}
                  {!inStock && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="bg-background text-foreground-muted text-xs font-semibold px-2 py-1 rounded-full border border-border">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="p-3 flex flex-col flex-1 gap-1">
                  {product.brand && (
                    <p className="text-xs text-foreground-muted">
                      {product.brand.name}
                    </p>
                  )}
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 flex-1"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-primary font-bold">
                      {formatCurrency(product.price)}
                    </span>
                    {product.comparePrice &&
                      product.comparePrice > product.price && (
                        <span className="text-xs text-foreground-muted line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!inStock}
                    className={cn(
                      "mt-2 w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition-colors",
                      inStock
                        ? "bg-primary text-white hover:opacity-90"
                        : "bg-background-subtle text-foreground-muted cursor-not-allowed"
                    )}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {inStock ? "Add to Cart" : "Unavailable"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
