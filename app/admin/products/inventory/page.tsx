"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, AlertTriangle, Package, RefreshCw, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RestockModal } from "@/components/admin/products/RestockModal";
import { toast } from "sonner";

interface InventoryProduct {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: string;
  images: { url: string }[];
  category: { name: string } | null;
  inventory: {
    quantity: number;
    reservedQuantity: number;
    lowStockThreshold: number;
    lastRestockedAt: string | null;
  } | null;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [restockTarget, setRestockTarget] = useState<InventoryProduct | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/inventory/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `nexcart-inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Inventory exported successfully");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filter === "low") params.set("status", "ACTIVE"); // We'll filter client-side for low stock
    if (filter === "out") params.set("status", "OUT_OF_STOCK");

    try {
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json().catch(() => ({}));
      let prods: InventoryProduct[] = data.products ?? [];

      // Client-side filter for low stock
      if (filter === "low") {
        prods = prods.filter((p) => {
          const qty = p.inventory?.quantity ?? 0;
          const threshold = p.inventory?.lowStockThreshold ?? 5;
          return qty > 0 && qty <= threshold;
        });
      }

      setProducts(prods);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const getStockStatus = (product: InventoryProduct) => {
    const qty = product.inventory?.quantity ?? 0;
    const threshold = product.inventory?.lowStockThreshold ?? 5;
    if (qty === 0) return "out";
    if (qty <= threshold) return "low";
    return "ok";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Monitor stock levels across all products</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          <Download size={14} />
          {exporting ? "Exporting…" : "Export Excel"}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Products", value: total, color: "text-foreground" },
          { label: "Low Stock", value: "—", color: "text-orange-500", sub: "≤ threshold" },
          { label: "Out of Stock", value: "—", color: "text-red-500", sub: "0 units" },
        ].map((stat) => (
          <div key={stat.label} className="bg-background rounded-xl border border-border p-4">
            <p className="text-xs text-foreground-muted font-medium">{stat.label}</p>
            <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
            {stat.sub && <p className="text-xs text-foreground-muted">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "low", "out"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border text-foreground-muted hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Available</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Reserved</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Last Restocked</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(10).fill(null).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Array(8).fill(null).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-background-subtle rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-foreground-muted">
                        <Package size={32} className="opacity-30" />
                        <p>No products found</p>
                      </div>
                    </td>
                  </tr>
                )
                : products.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const qty = product.inventory?.quantity ?? 0;
                  const reserved = product.inventory?.reservedQuantity ?? 0;
                  const lastRestocked = product.inventory?.lastRestockedAt;

                  return (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-background-subtle border border-border flex-shrink-0">
                            {product.images[0]?.url ? (
                              <Image src={product.images[0].url} alt={product.name} width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                                <Package size={14} />
                              </div>
                            )}
                          </div>
                          <Link href={`/admin/products/${product.id}/edit`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 text-sm">
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-xs font-mono">{product.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{product.category?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("font-semibold", stockStatus === "out" ? "text-red-500" : stockStatus === "low" ? "text-orange-500" : "text-foreground")}>
                          {qty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground-muted">{reserved}</td>
                      <td className="px-4 py-3">
                        {stockStatus === "out" ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertTriangle size={11} /> Out of Stock
                          </span>
                        ) : stockStatus === "low" ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                            <AlertTriangle size={11} /> Low Stock
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-500">In Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-xs">
                        {lastRestocked
                          ? new Date(lastRestocked).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Never"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setRestockTarget(product as Parameters<typeof setRestockTarget>[0])}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors ml-auto"
                        >
                          <RefreshCw size={11} />
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-foreground-muted">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {restockTarget && (
        <RestockModal
          product={restockTarget}
          onClose={() => setRestockTarget(null)}
          onSuccess={() => { setRestockTarget(null); fetchProducts(); toast.success("Stock updated"); }}
        />
      )}
    </div>
  );
}
