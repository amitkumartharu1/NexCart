"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag, Layers, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count: { products: number };
}

const CATEGORY_COLORS = [
  "from-violet-500/10 to-purple-500/10 border-violet-200",
  "from-blue-500/10 to-cyan-500/10 border-blue-200",
  "from-green-500/10 to-emerald-500/10 border-green-200",
  "from-orange-500/10 to-amber-500/10 border-orange-200",
  "from-pink-500/10 to-rose-500/10 border-pink-200",
  "from-indigo-500/10 to-blue-500/10 border-indigo-200",
  "from-teal-500/10 to-cyan-500/10 border-teal-200",
  "from-red-500/10 to-orange-500/10 border-red-200",
];

function CategoryCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl p-6 animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-background-subtle mb-4" />
      <div className="h-5 bg-background-subtle rounded w-2/3 mb-2" />
      <div className="h-4 bg-background-subtle rounded w-1/3" />
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-wide py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Layers className="w-4 h-4" />
          All Categories
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Browse by Category
        </h1>
        <p className="text-foreground-muted max-w-lg mx-auto">
          Explore our wide selection of products organized by category. Find
          exactly what you&apos;re looking for.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        /* Placeholder "Coming Soon" grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-background border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[140px]"
            >
              <div className="w-12 h-12 rounded-xl bg-background-subtle flex items-center justify-center">
                <Tag className="w-6 h-6 text-foreground-muted" />
              </div>
              <p className="text-sm font-semibold text-foreground-muted">
                Coming Soon
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={cn(
                  "group bg-gradient-to-br border rounded-xl p-6 flex flex-col gap-3",
                  "hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
                  colorClass
                )}
              >
                {/* Icon or default */}
                <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center text-2xl shadow-sm">
                  {cat.icon ? (
                    <span>{cat.icon}</span>
                  ) : (
                    <Tag className="w-6 h-6 text-foreground-muted" />
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-sm text-foreground-muted mt-0.5">
                    {cat._count.products}{" "}
                    {cat._count.products === 1 ? "product" : "products"}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
