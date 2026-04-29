"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus, Trash2, Search, Printer, ReceiptText, RefreshCw,
  ScanBarcode, ChevronLeft, ChevronRight, X, Minus, ShoppingCart,
  User, Phone, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  productId: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Bill {
  id: string;
  billNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  staff: { name: string | null; email: string | null };
  items: { name: string; quantity: number; unitPrice: number; total: number }[];
}

interface ProductResult {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

const PAYMENT_METHODS = ["CASH", "CARD", "ESEWA", "KHALTI", "BANK_TRANSFER", "OTHER"];
const TAX_RATE_DEFAULT = 13;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const canDelete = ["SUPER_ADMIN", "ADMIN"].includes(session?.user?.role ?? "");

  // ── Cart state ──
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [taxRate, setTaxRate]         = useState(TAX_RATE_DEFAULT);
  const [discount, setDiscount]       = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes]             = useState("");
  const [isPaid, setIsPaid]           = useState(true);
  const [saving, setSaving]           = useState(false);

  // ── Product search / barcode ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductResult[]>([]);
  const [searching, setSearching]     = useState(false);
  const barcodeRef                    = useRef<HTMLInputElement>(null);
  const barcodeBuffer                 = useRef("");
  const barcodeTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bills list ──
  const [bills, setBills]             = useState<Bill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsPage, setBillsPage]     = useState(1);
  const [billsPagination, setBillsPagination] = useState({ totalPages: 1, total: 0 });
  const [billsSearch, setBillsSearch] = useState("");
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);
  const [confirmDeleteBill, setConfirmDeleteBill] = useState<Bill | null>(null);

  // ── Calculated totals ──
  const subtotal = cart.reduce((s, i) => s + i.total, 0);
  const taxAmount = Math.round(((subtotal - discount) * (taxRate / 100)) * 100) / 100;
  const total    = Math.round((subtotal - discount + taxAmount) * 100) / 100;

  // ─── Product search ────────────────────────────────────────────────────────
  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json().catch(() => ({}));
      setSearchResults(
        (data.products ?? []).map((p: any) => ({
          id: p.id, name: p.name, sku: p.sku ?? null,
          price: Number(p.price ?? p.basePrice ?? 0),
          stock: p.inventory?.quantity ?? 0,
          imageUrl: p.images?.[0]?.url ?? null,
        }))
      );
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, searchProducts]);

  // ─── Barcode scanner (keyboard wedge) ─────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if focus is in a text input (other than our barcode field)
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        const sku = barcodeBuffer.current.trim();
        barcodeBuffer.current = "";
        if (sku.length > 2) addByBarcode(sku);
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = ""; }, 100);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const addByBarcode = async (sku: string) => {
    try {
      const res = await fetch(`/api/admin/products/barcode?sku=${encodeURIComponent(sku)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.product) {
        addToCart(data.product);
        toast.success(`Added: ${data.product.name}`);
      } else {
        toast.error(data.error ?? `SKU "${sku}" not found`);
      }
    } catch { toast.error("Barcode lookup failed"); }
  };

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const sku = (e.target as HTMLInputElement).value.trim();
      if (sku) { await addByBarcode(sku); (e.target as HTMLInputElement).value = ""; }
    }
  };

  // ─── Cart management ───────────────────────────────────────────────────────
  const addToCart = (p: ProductResult) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.productId === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        const qty = updated[idx].quantity + 1;
        updated[idx] = { ...updated[idx], quantity: qty, total: Math.round(qty * updated[idx].unitPrice * 100) / 100 };
        return updated;
      }
      return [...prev, { productId: p.id, name: p.name, sku: p.sku, quantity: 1, unitPrice: p.price, total: p.price }];
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const qty = Math.max(1, updated[idx].quantity + delta);
      updated[idx] = { ...updated[idx], quantity: qty, total: Math.round(qty * updated[idx].unitPrice * 100) / 100 };
      return updated;
    });
  };

  const updatePrice = (idx: number, price: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], unitPrice: price, total: Math.round(updated[idx].quantity * price * 100) / 100 };
      return updated;
    });
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const addManualItem = () => {
    setCart((prev) => [...prev, { productId: null, name: "Custom Item", sku: null, quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const updateItemName = (idx: number, name: string) => {
    setCart((prev) => { const u = [...prev]; u[idx] = { ...u[idx], name }; return u; });
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setNotes("");
    setIsPaid(true);
    setPaymentMethod("CASH");
    setTaxRate(TAX_RATE_DEFAULT);
  };

  // ─── Save bill ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (cart.length === 0) { toast.error("Add at least one item"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName:  customerName || null,
          customerPhone: customerPhone || null,
          items:         cart,
          taxRate,
          discountAmount: discount,
          paymentMethod,
          notes:         notes || null,
          isPaid,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Bill ${data.bill.billNumber} created!`);
        clearCart();
        fetchBills();
        // Open print view in new tab
        window.open(`/admin/billing/${data.bill.id}?print=1`, "_blank");
      } else {
        toast.error(data?.error ?? "Failed to create bill");
      }
    } catch { toast.error("Failed to save bill"); }
    finally { setSaving(false); }
  };

  // ─── Bills history ─────────────────────────────────────────────────────────
  const fetchBills = useCallback(async () => {
    setBillsLoading(true);
    const params = new URLSearchParams({ page: String(billsPage), limit: "10" });
    if (billsSearch) params.set("search", billsSearch);
    try {
      const res = await fetch(`/api/admin/billing?${params}`);
      const data = await res.json().catch(() => ({}));
      setBills(data.bills ?? []);
      setBillsPagination({ totalPages: data.pagination?.totalPages ?? 1, total: data.pagination?.total ?? 0 });
    } catch { toast.error("Failed to load bills"); }
    finally { setBillsLoading(false); }
  }, [billsPage, billsSearch]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleDeleteBill = async (bill: Bill) => {
    setDeletingBillId(bill.id);
    try {
      const res = await fetch(`/api/admin/billing/${bill.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Bill deleted"); setConfirmDeleteBill(null); fetchBills(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d?.error ?? "Failed to delete"); }
    } catch { toast.error("Failed to delete bill"); }
    finally { setDeletingBillId(null); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">POS Billing</h1>
          <p className="text-sm text-foreground-muted mt-1">Create bills, scan products, print invoices</p>
        </div>
      </div>

      {/* Delete bill modal */}
      {confirmDeleteBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <Trash2 size={20} />
              <h3 className="font-bold">Delete Bill</h3>
            </div>
            <p className="text-sm text-foreground-muted">
              Permanently delete <span className="font-semibold text-foreground">{confirmDeleteBill.billNumber}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteBill(confirmDeleteBill)} disabled={!!deletingBillId}
                className="flex-1 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50">
                {deletingBillId ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDeleteBill(null)}
                className="flex-1 py-2 rounded-lg border border-border text-sm text-foreground-muted hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: POS / Cart ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Customer Info */}
          <div className="bg-background rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User size={14} /> Customer (optional)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
          </div>

          {/* Product Search + Barcode */}
          <div className="bg-background rounded-xl border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart size={14} /> Add Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product name…"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
                {searching && (
                  <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-foreground-muted" />
                )}
              </div>
              {/* Barcode manual input */}
              <div className="relative">
                <ScanBarcode size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  ref={barcodeRef}
                  onKeyDown={handleBarcodeInput}
                  placeholder="Scan barcode or type SKU + Enter"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-background-subtle transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background-subtle shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-foreground-muted">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {p.sku ? `SKU: ${p.sku} · ` : ""}Stock: {p.stock}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart / Bill Items */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Bill Items {cart.length > 0 && <span className="ml-1 text-foreground-muted">({cart.length})</span>}
              </h2>
              <button
                onClick={addManualItem}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={12} /> Add custom item
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-foreground-muted">
                <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No items yet. Search products or scan a barcode.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-background-subtle text-xs font-semibold text-foreground-muted uppercase">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-3 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                  <div className="col-span-1" />
                </div>
                {cart.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-4">
                      <input
                        value={item.name}
                        onChange={(e) => updateItemName(idx, e.target.value)}
                        className="w-full text-sm font-medium text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
                      />
                      {item.sku && <p className="text-[10px] text-foreground-muted mt-0.5">SKU: {item.sku}</p>}
                    </div>
                    <div className="col-span-3 flex items-center justify-center gap-1">
                      <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-background-subtle transition-colors">
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-background-subtle transition-colors">
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(idx, Number(e.target.value))}
                        className="w-full text-right text-sm font-medium text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2 text-right text-sm font-semibold">
                      {formatCurrency(item.total)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => removeFromCart(idx)} className="w-6 h-6 flex items-center justify-center rounded-md text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Totals + Settings ──────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Totals card */}
          <div className="bg-background rounded-xl border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Bill Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Discount */}
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-sm">Discount</span>
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-5 pr-2 py-1 text-right text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>

              {/* Tax */}
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted text-sm">Tax (%)</span>
                <div className="relative w-24">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={taxRate}
                    onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1 text-right text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>
              <div className="flex justify-between text-foreground-muted text-xs">
                <span>Tax amount</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            {/* Paid toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">Mark as Paid</span>
            </label>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <FileText size={11} /> Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note…"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving || cart.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:bg-primary-hover transition-colors"
              >
                <ReceiptText size={15} />
                {saving ? "Saving…" : "Generate Bill & Print"}
              </button>
              <button
                onClick={clearCart}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
              >
                <X size={13} /> Clear Bill
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bills History ────────────────────────────────────────────────────── */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Bills History</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                value={billsSearch}
                onChange={(e) => { setBillsSearch(e.target.value); setBillsPage(1); }}
                placeholder="Search…"
                className="pl-7 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 w-40"
              />
            </div>
            <button onClick={fetchBills} disabled={billsLoading} className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40">
              <RefreshCw size={13} className={cn(billsLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle text-xs font-semibold text-foreground-muted uppercase">
                <th className="text-left px-4 py-3">Bill #</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Staff</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {billsLoading ? (
                Array(5).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array(8).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-background-subtle rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : bills.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-foreground-muted text-sm">No bills yet</td></tr>
              ) : bills.map((bill) => (
                <tr key={bill.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-primary">{bill.billNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <p className="font-medium text-foreground">{bill.customerName ?? "—"}</p>
                    {bill.customerPhone && <p className="text-xs text-foreground-muted">{bill.customerPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-muted">{bill.staff?.name ?? bill.staff?.email ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-foreground-muted">{bill.paymentMethod.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      bill.isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                    )}>
                      {bill.isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(Number(bill.total))}</td>
                  <td className="px-4 py-3 text-xs text-foreground-muted whitespace-nowrap">{formatDate(bill.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => window.open(`/admin/billing/${bill.id}`, "_blank")}
                        className="w-7 h-7 inline-flex items-center justify-center rounded-md text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        title="View / Print"
                      >
                        <Printer size={13} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDeleteBill(bill)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete bill"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {billsPagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-foreground-muted">{billsPagination.total} bills total</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setBillsPage((p) => Math.max(1, p - 1))} disabled={billsPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30">
                <ChevronLeft size={13} />
              </button>
              <span className="text-xs text-foreground-muted px-2">{billsPage} / {billsPagination.totalPages}</span>
              <button onClick={() => setBillsPage((p) => Math.min(billsPagination.totalPages, p + 1))} disabled={billsPage === billsPagination.totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
