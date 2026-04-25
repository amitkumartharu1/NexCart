"use client";

import { useEffect, useState } from "react";
import { Layers, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Category {
  id:     string;
  name:   string;
  slug:   string;
  _count: { products: number };
}

interface Meta {
  totalCategories:     number;
  topN:                number;
  totalActiveProducts: number;
}

const BAR_COLORS = [
  "bg-primary",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-orange-500",
  "bg-purple-500",
  "bg-pink-500",
];

export function TopCategoriesChart() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta,       setMeta]       = useState<Meta | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    fetch("/api/admin/categories/stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setCategories(data?.categories ?? []);
        setMeta(data?.meta ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // Highest active product count (used to compute bar widths)
  const max = Math.max(...categories.map((c) => c._count.products), 1);

  return (
    <div className="bg-background rounded-xl border border-border p-5 flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Top Categories</h3>
          <p className="text-xs text-foreground-muted mt-0.5">By active products</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={14} className="text-primary" />
          </div>
        </div>
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3 flex-1">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 rounded bg-background-subtle animate-pulse" />
              <div
                className="h-2 rounded-full bg-background-subtle animate-pulse"
                style={{ width: `${80 - i * 12}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2 text-center">
          <AlertCircle size={24} className="text-destructive opacity-60" />
          <p className="text-sm text-foreground-muted">Failed to load categories</p>
          <button
            onClick={load}
            className="text-xs text-primary hover:underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && categories.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2 text-center">
          <Layers size={28} className="mx-auto text-foreground-subtle opacity-30" />
          <p className="text-sm font-medium text-foreground-muted">No active categories yet</p>
          <p className="text-xs text-foreground-muted max-w-[200px]">
            Create categories and assign active products to see them here.
          </p>
          <Link
            href="/admin/categories"
            className="text-xs text-primary hover:underline mt-1 inline-block"
          >
            Add categories →
          </Link>
        </div>
      )}

      {/* ── Chart ── */}
      {!loading && !error && categories.length > 0 && (
        <div className="space-y-4 flex-1">
          {categories.map((cat, i) => {
            const pct = Math.round((cat._count.products / max) * 100);
            const isTop = i === 0 && cat._count.products > 0;
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-foreground-muted w-4 text-right shrink-0">
                      {i + 1}
                    </span>
                    <Link
                      href="/admin/categories"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                    >
                      {cat.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-foreground-muted tabular-nums">
                      {cat._count.products}{" "}
                      {cat._count.products !== 1 ? "products" : "product"}
                    </span>
                    {isTop && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                        <TrendingUp size={10} /> Top
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-background-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${cat._count.products === 0 ? 0 : Math.max(pct, 4)}%` }}
                  />
                </div>
                {cat._count.products === 0 && (
                  <p className="text-[10px] text-foreground-muted mt-0.5 pl-6">
                    No active products yet
                  </p>
                )}
              </div>
            );
          })}

          {/* ── Footer ── */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-foreground-muted">
              {meta?.totalActiveProducts ?? 0} active product
              {(meta?.totalActiveProducts ?? 0) !== 1 ? "s" : ""} across{" "}
              {meta?.totalCategories ?? categories.length} categor
              {(meta?.totalCategories ?? categories.length) !== 1 ? "ies" : "y"}
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
