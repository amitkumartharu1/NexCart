"use client";

import { useState } from "react";
import { X, RefreshCw, Package } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  inventory: { quantity: number } | null;
}

interface Props {
  product: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export function RestockModal({ product, onClose, onSuccess }: Props) {
  const [quantity, setQuantity] = useState(10);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const currentStock = product.inventory?.quantity ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, note }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Restock failed");
      }
      toast.success(`Restocked ${quantity} units of "${product.name}"`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message ?? "Restock failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-emerald-500" />
              <h2 className="font-semibold text-foreground">Restock Product</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background-subtle text-foreground-muted hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background-subtle border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{product.name}</p>
                <p className="text-xs text-foreground-muted">Current stock: <span className="font-semibold">{currentStock} units</span></p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Quantity to add <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                  required
                />
                <p className="text-xs text-foreground-muted mt-1.5">
                  New total: <span className="font-semibold text-emerald-500">{currentStock + quantity} units</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., New supplier shipment received"
                  rows={2}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || quantity < 1}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Restock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
