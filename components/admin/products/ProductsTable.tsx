"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, RefreshCw, Edit, Trash2, Eye, AlertTriangle, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { RestockModal } from "./RestockModal";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  sku: string | null;
  status: string;
  isFeatured: boolean;
  category: { name: string } | null;
  brand: { name: string } | null;
  images: { url: string }[];
  inventory: { quantity: number } | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DRAFT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  ARCHIVED: "bg-gray-500/10 text-gray-500",
  OUT_OF_STOCK: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function AdminProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    try {
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json().catch(() => ({}));
      setProducts(data.products ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product deleted");
      fetchProducts();
    } else {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(`Product ${newStatus === "ACTIVE" ? "published" : "archived"}`);
      fetchProducts();
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors flex-shrink-0"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(8).fill(null).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-background-subtle animate-pulse" />
                          <div className="space-y-1.5">
                            <div className="h-3 bg-background-subtle rounded w-32 animate-pulse" />
                            <div className="h-2.5 bg-background-subtle rounded w-20 animate-pulse" />
                          </div>
                        </div>
                      </td>
                      {Array(4).fill(null).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-background-subtle rounded animate-pulse" />
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="h-7 bg-background-subtle rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : products.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-foreground-muted">
                        <Package size={32} className="opacity-30" />
                        <p>No products found</p>
                        <Link href="/admin/products/new" className="text-primary text-sm hover:underline">Add your first product</Link>
                      </div>
                    </td>
                  </tr>
                )
                : products.map((product) => {
                  const stock = product.inventory?.quantity ?? 0;
                  const isLowStock = stock > 0 && stock <= 10;
                  const isOutOfStock = stock === 0;
                  return (
                    <tr key={product.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-background-subtle border border-border flex-shrink-0">
                            {product.images[0]?.url ? (
                              <Image src={product.images[0].url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                                <Package size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                            {product.sku && <p className="text-xs text-foreground-muted">SKU: {product.sku}</p>}
                            {product.isFeatured && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{product.category?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{formatCurrency(product.basePrice)}</span>
                        {product.comparePrice && (
                          <span className="text-xs text-foreground-muted line-through ml-1.5">{formatCurrency(product.comparePrice)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isLowStock && <AlertTriangle size={12} className="text-orange-500" />}
                          <span className={cn("text-sm", isOutOfStock ? "text-red-500 font-medium" : isLowStock ? "text-orange-500" : "text-foreground")}>
                            {stock} units
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[product.status] ?? "bg-background-subtle text-foreground-muted")}>
                          {product.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setRestockProduct(product)}
                            title="Restock"
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          >
                            <RefreshCw size={13} />
                          </button>
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            title="View in store"
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          >
                            <Eye size={13} />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            title="Edit"
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
                          >
                            <Edit size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Delete"
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-foreground-muted">
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total} products
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-foreground-muted px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <RestockModal
          product={restockProduct}
          onClose={() => setRestockProduct(null)}
          onSuccess={() => { setRestockProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}
