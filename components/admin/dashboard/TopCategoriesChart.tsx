"use client";

import { useEffect, useState } from "react";
import { Layers, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Category {
  id:     string;
  name:   string;
  slug:   string;
  _count: { products: number };
}

export function TopCategoriesChart() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setCategories(data?.topCategories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const max = Math.max(...categories.map((c) => c._count.products), 1);

  return (
    <div className="bg-background rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Top Categories</h3>
          <p className="text-xs text-foreground-muted mt-0.5">By number of active products</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Layers size={14} className="text-primary" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-background-subtle animate-pulse" />
              <div className="h-2 rounded-full bg-background-subtle animate-pulse" style={{ width: `${80 - i * 12}%` }} />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="py-8 text-center">
          <Layers size={28} className="mx-auto mb-2 text-foreground-subtle opacity-30" />
          <p className="text-sm text-foreground-muted">No categories yet</p>
          <Link href="/admin/categories" className="text-xs text-primary hover:underline mt-1 inline-block">
            Add categories →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, i) => {
            const pct = Math.round((cat._count.products / max) * 100);
            const colors = [
              "bg-primary",
              "bg-blue-500",
              "bg-emerald-500",
              "bg-orange-500",
              "bg-purple-500",
              "bg-pink-500",
            ];
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground-muted w-4 text-right">{i + 1}</span>
                    <Link
                      href={`/admin/categories`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted">
                      {cat._count.products} product{cat._count.products !== 1 ? "s" : ""}
                    </span>
                    {i === 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                        <TrendingUp size={10} /> Top
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-background-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-foreground-muted">
              {categories.reduce((a, c) => a + c._count.products, 0)} total products across {categories.length} categories
            </p>
            <Link href="/admin/categories" className="text-xs text-primary hover:underline">
              Manage →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
