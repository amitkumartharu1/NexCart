"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2, Plus, Pencil, Trash2, Eye, EyeOff,
  Search, RefreshCw, X, Globe, Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface Supplier {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// Form uses plain strings (no nulls) so inputs/textareas work without ?? guards
interface SupplierForm {
  name: string; logo: string; description: string; website: string;
  country: string; sortOrder: number; isActive: boolean; isFeatured: boolean;
}

const EMPTY: SupplierForm = {
  name: "", logo: "", description: "", website: "",
  country: "", sortOrder: 0, isActive: true, isFeatured: false,
};

function SupplierLogo({ s, size = 48 }: { s: Pick<Supplier, "name" | "logo">; size?: number }) {
  if (s.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={s.logo} alt={s.name}
        className="rounded-xl object-contain border border-border bg-white"
        style={{ width: size, height: size }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <div
      className="rounded-xl bg-background-subtle border border-border flex items-center justify-center text-foreground-muted font-bold"
      style={{ width: size, height: size, fontSize: size * 0.28 }}
    >
      {s.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-foreground-muted mt-0.5">{hint}</p>}
    </div>
  );
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [editing,   setEditing]   = useState<Supplier | null>(null);
  const [isNew,     setIsNew]     = useState(false);
  const [form,      setForm]      = useState({ ...EMPTY });
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers ?? []);
    } catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm({ ...EMPTY }); setEditing(null); setIsNew(true); }
  function openEdit(s: Supplier) {
    setForm({
      name: s.name, logo: s.logo ?? "", description: s.description ?? "",
      website: s.website ?? "", country: s.country ?? "",
      sortOrder: s.sortOrder, isActive: s.isActive, isFeatured: s.isFeatured,
    });
    setEditing(s);
    setIsNew(false);
  }
  function closePanel() { setEditing(null); setIsNew(false); }
  function set(k: keyof SupplierForm, v: string | number | boolean) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const body   = isNew ? form : { id: editing!.id, ...form };
      const res = await fetch("/api/admin/suppliers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(isNew ? "Supplier added" : "Supplier updated");
      closePanel(); load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await fetch("/api/admin/suppliers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success("Deleted"); load();
    } catch { toast.error("Delete failed"); }
  }

  async function toggleField(id: string, field: "isActive" | "isFeatured", current: boolean) {
    try {
      await fetch("/api/admin/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: !current }),
      });
      setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, [field]: !current } : s));
    } catch { toast.error("Update failed"); }
  }

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers & Partners</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Manage supplier/partner logos shown on the homepage</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className={cn("flex gap-6")}>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(6).fill(null).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-background-subtle animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-border">
              <Building2 size={32} className="mx-auto mb-2 text-foreground-subtle opacity-30" />
              <p className="text-sm text-foreground-muted">
                {search ? "No suppliers match your search" : "No suppliers yet"}
              </p>
              {!search && (
                <button onClick={openNew} className="mt-3 text-xs text-primary hover:underline">
                  Add your first supplier →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((s) => (
                <div key={s.id}
                  className={cn("p-4 rounded-xl border transition-all",
                    s.isActive ? "bg-background border-border" : "bg-background-subtle border-border opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <SupplierLogo s={s} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-foreground truncate">{s.name}</span>
                        {s.isFeatured && <Star size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
                      </div>
                      {s.country && <p className="text-xs text-foreground-muted">{s.country}</p>}
                      {s.description && <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">{s.description}</p>}
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-1">
                          <Globe size={10} /> {s.website.replace(/https?:\/\/(www\.)?/, "")}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
                    <button onClick={() => toggleField(s.id, "isActive", s.isActive)}
                      className={cn("flex-1 py-1 text-xs rounded-lg border transition-colors",
                        s.isActive ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-border text-foreground-muted hover:bg-muted"
                      )}>
                      {s.isActive ? <><Eye size={11} className="inline mr-1" />Visible</> : <><EyeOff size={11} className="inline mr-1" />Hidden</>}
                    </button>
                    <button onClick={() => openEdit(s)}
                      className="px-3 py-1 text-xs rounded-lg border border-border text-foreground-muted hover:text-primary hover:border-primary/30 transition-colors">
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => handleDelete(s.id, s.name)}
                      className="px-3 py-1 text-xs rounded-lg border border-border text-foreground-muted hover:text-destructive hover:border-destructive/30 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(isNew || editing) && (
          <div className="w-80 flex-shrink-0 bg-background rounded-xl border border-border p-5 space-y-4 self-start sticky top-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{isNew ? "Add Supplier" : "Edit Supplier"}</h3>
              <button onClick={closePanel} className="p-1 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="flex justify-center">
              <SupplierLogo s={{ name: form.name || "?", logo: form.logo }} size={72} />
            </div>
            <Field label="Name *">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Samsung" className={inputCls} />
            </Field>
            <ImageUpload
              label="Logo"
              value={form.logo}
              onChange={(url) => set("logo", url)}
              folder="nexcart/suppliers"
              aspect="square"
              hint="Upload a logo or paste a URL"
            />
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                rows={2} placeholder="Brief description…" className={inputCls + " resize-none"} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Country">
                <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Nepal" className={inputCls} />
              </Field>
              <Field label="Sort Order">
                <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} className={inputCls} />
              </Field>
            </div>
            <Field label="Website">
              <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." className={inputCls} />
            </Field>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="w-4 h-4 accent-amber-500 rounded" />
                <span className="text-sm text-foreground">Featured</span>
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={closePanel} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : isNew ? "Add" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
