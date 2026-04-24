"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  basePrice: number;
  images: { url: string }[];
  inventory: {
    quantity: number;
    lowStockThreshold: number;
  } | null;
}

export function AdminLowStockAlerts() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products?lowStock=true&limit=10");
      const data = await res.json().catch(() => ({})) as { products?: LowStockProduct[] };
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLowStock(); }, []);

  const getStockLevel = (p: LowStockProduct) => {
    const qty = p.inventory?.quantity ?? 0;
    if (qty === 0) return "out";
    if (qty <= (p.inventory?.lowStockThreshold ?? 5)) return "low";
    return "ok";
  };

  return (
    <div className="bg-background rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          <h3 className="font-semibold text-foreground text-sm">Low Stock Alerts</h3>
          {products.length > 0 && (
            <span className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
              {products.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLowStock} disabled={loading}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors disabled:opacity-40">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/admin/products/inventory"
            className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          Array(4).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-background-subtle flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-background-subtle rounded w-3/4" />
                <div className="h-3 bg-background-subtle rounded w-1/2" />
              </div>
              <div className="h-6 w-16 bg-background-subtle rounded-full" />
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-foreground-muted gap-2">
            <AlertTriangle size={28} className="opacity-30" />
            <p className="text-sm">All products are well stocked</p>
          </div>
        ) : (
          products.map((p) => {
            const level = getStockLevel(p);
            const qty   = p.inventory?.quantity ?? 0;
            return (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-background-subtle/50 transition-colors">
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg border border-border bg-background-subtle flex-shrink-0 overflow-hidden">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground-subtle text-xs">—</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {p.sku && <span className="mr-2">{p.sku}</span>}
                    {formatCurrency(p.basePrice)}
                  </p>
                </div>

                {/* Stock badge */}
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    level === "out"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  )}>
                    {level === "out" ? "Out of Stock" : `${qty} left`}
                  </span>
                  <Link href={`/admin/products/${p.id}/edit`}
                    className="text-[11px] text-primary hover:underline">
                    Restock
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
