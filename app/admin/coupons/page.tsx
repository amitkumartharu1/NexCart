"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, TicketPercent, Trash2, Copy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountType: "PERCENTAGE", discountValue: 10, minOrderAmount: "", maxUses: "", expiresAt: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coupons");
    const data = await res.json().catch(() => ({}));
    setCoupons(data.coupons ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: +form.discountValue,
        minOrderAmount: form.minOrderAmount ? +form.minOrderAmount : null,
        maxUses: form.maxUses ? +form.maxUses : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Coupon created"); setShowForm(false); fetchCoupons(); }
    else { const d = await res.json(); toast.error(d.error ?? "Failed"); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("Copied!"); };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive: !current }) });
    fetchCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-foreground-muted mt-1">Manage discount codes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors">
          <Plus size={14} /> Create Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-background rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">New Coupon</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-foreground mb-1">Code *</label>
              <input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SAVE20"
                className="w-full px-3 py-2 text-sm font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 uppercase" /></div>
            <div><label className="block text-xs font-medium text-foreground mb-1">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount</option>
              </select></div>
            <div><label className="block text-xs font-medium text-foreground mb-1">Discount Value *</label>
              <input required type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: +e.target.value})}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" /></div>
            <div><label className="block text-xs font-medium text-foreground mb-1">Min Order Amount</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} placeholder="Optional"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" /></div>
            <div><label className="block text-xs font-medium text-foreground mb-1">Max Uses</label>
              <input type="number" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="Unlimited"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" /></div>
            <div><label className="block text-xs font-medium text-foreground mb-1">Expires At</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" /></div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">{saving ? "Saving..." : "Create"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg border border-border text-sm text-foreground-muted hover:text-foreground">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array(4).fill(null).map((_,i) => <div key={i} className="h-12 bg-background-subtle rounded-xl animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-foreground-muted"><TicketPercent size={32} className="mx-auto mb-3 opacity-30" /><p>No coupons yet</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-background-subtle">
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Discount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Uses</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Expires</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Actions</th>
            </tr></thead>
            <tbody>{coupons.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{c.code}</span>
                    <button onClick={() => copyCode(c.code)} className="text-foreground-muted hover:text-primary transition-colors"><Copy size={12} /></button>
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : formatCurrency(c.discountValue)}</td>
                <td className="px-4 py-3 text-foreground-muted">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-4 py-3 text-foreground-muted">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", c.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500")}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleActive(c.id, c.isActive)} className="text-xs px-2 py-1 rounded-md border border-border text-foreground-muted hover:text-foreground transition-colors">
                    {c.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
