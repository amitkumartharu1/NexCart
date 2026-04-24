"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ExternalLink, RefreshCw } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";

interface RestockedProduct {
  id: string;
  name: string;
  sku: string | null;
  basePrice: number;
  images: { url: string }[];
  inventory: {
    quantity: number;
    lastRestockedAt: string | null;
  } | null;
}

export function AdminRecentlyRestocked() {
  const [products, setProducts] = useState<RestockedProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchRestocked = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/products?filter=restocked&limit=8");
      const data = await res.json().catch(() => ({})) as { products?: RestockedProduct[] };
      setProducts(data.products ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestocked(); }, []);

  return (
    <div className="bg-background rounded-xl border border-border">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-emerald-500" />
          <h3 className="font-semibold text-foreground text-sm">Recently Restocked</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchRestocked} disabled={loading}
            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors disabled:opacity-40">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/admin/products/inventory"
            className="text-xs text-primary hover:underline flex items-center gap-1">
            Inventory <ExternalLink size={11} />
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
                <div className="h-3 bg-background-subtle rounded w-1/3" />
              </div>
              <div className="h-3 w-20 bg-background-subtle rounded" />
            </div>
          ))
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-foreground-muted gap-2">
            <Package size={28} className="opacity-30" />
            <p className="text-sm">No recently restocked products</p>
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-background-subtle/50 transition-colors">
              <div className="w-10 h-10 rounded-lg border border-border bg-background-subtle flex-shrink-0 overflow-hidden">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground-subtle text-xs">—</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    {p.inventory?.quantity ?? 0} in stock
                  </span>
                  <span>{formatCurrency(p.basePrice)}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-foreground-muted">
                  {p.inventory?.lastRestockedAt
                    ? formatRelativeTime(p.inventory.lastRestockedAt)
                    : "—"}
                </p>
                <Link href={`/admin/products/${p.id}/edit`}
                  className="text-[11px] text-primary hover:underline">Edit</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
