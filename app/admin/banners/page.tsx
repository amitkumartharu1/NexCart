"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ToggleLeft, ToggleRight, X, Pencil, ExternalLink, ImageIcon, Clock } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string;
  position: string;
  isActive: boolean;
  link: string | null;
  ctaText: string | null;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
}

const POSITIONS = ["HERO", "PROMO_BAR", "CATEGORY_HEADER", "PRODUCT_HEADER", "SIDEBAR", "POPUP"];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  position: "HERO",
  isActive: true,
  link: "",
  ctaText: "",
  sortOrder: 0,
  startsAt: "",
  endsAt: "",
};

/** Convert a Date or ISO string to the value format datetime-local expects: "YYYY-MM-DDTHH:MM" */
function toDatetimeLocal(val: string | null | undefined): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    // toISOString → "2024-01-15T10:30:00.000Z" → take first 16 chars
    return d.toISOString().slice(0, 16);
  } catch {
    return "";
  }
}

/** Derive the visible status label for a banner row */
function getBannerStatus(b: Banner): { label: string; cls: string } {
  const now = new Date();
  if (!b.isActive) return { label: "Inactive", cls: "bg-gray-500/10 text-gray-500" };
  if (b.startsAt && new Date(b.startsAt) > now) return { label: "Scheduled", cls: "bg-blue-500/10 text-blue-600" };
  if (b.endsAt && new Date(b.endsAt) < now) return { label: "Expired", cls: "bg-orange-500/10 text-orange-600" };
  return { label: "Active", cls: "bg-emerald-500/10 text-emerald-600" };
}

export default function AdminBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json().catch(() => ({}));
    setBanners(data.banners ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      description: b.description ?? "",
      image: b.image,
      position: b.position,
      isActive: b.isActive,
      link: b.link ?? "",
      ctaText: b.ctaText ?? "",
      sortOrder: b.sortOrder,
      startsAt: toDatetimeLocal(b.startsAt),
      endsAt: toDatetimeLocal(b.endsAt),
    });
    setShowForm(true);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate schedule window
    if (form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
      toast.error("Start date must be before end date");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      image:    form.image    || undefined,
      startsAt: form.startsAt || null,
      endsAt:   form.endsAt   || null,
    };
    const method = editingId ? "PATCH" : "POST";
    const body   = editingId ? { id: editingId, ...payload } : payload;

    const res = await fetch("/api/admin/banners", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      const msg = editingId ? "Banner updated" : "Banner created";
      toast.success(msg, {
        description: "Changes are live on the homepage.",
        action: { label: "View Homepage", onClick: () => router.push("/") },
      });
      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      fetchBanners();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "Failed to save banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner? This cannot be undone.")) return;
    const res = await fetch("/api/admin/banners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Banner deleted"); fetchBanners(); }
    else toast.error("Failed to delete banner");
  };

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !current }),
    });
    if (res.ok) fetchBanners();
    else toast.error("Failed to update banner");
  };

  const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
          <p className="text-sm text-foreground-muted mt-1">Manage homepage and promotional banners</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
          >
            <ExternalLink size={14} /> View Homepage
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <Plus size={14} /> Add Banner
          </button>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-background rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{editingId ? "Edit Banner" : "New Banner"}</h2>
            <button onClick={() => setShowForm(false)} className="text-foreground-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Banner image */}
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Banner Image"
                  value={form.image}
                  onChange={(url) => setForm((f) => ({ ...f, image: url }))}
                  folder="nexcart/banners"
                  aspect="landscape"
                  hint="Recommended: 1600×600 px. JPEG, PNG or WebP."
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Link URL</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="/shop"
                  className={inputCls}
                />
              </div>

              {/* CTA text */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">CTA Button Text</label>
                <input
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  placeholder="Shop Now"
                  className={inputCls}
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Position</label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className={inputCls}
                >
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Schedule: starts at */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  <Clock size={11} className="inline mr-1" />
                  Show from (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={inputCls}
                />
                <p className="text-[10px] text-foreground-muted mt-0.5">Leave blank to show immediately</p>
              </div>

              {/* Schedule: ends at */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  <Clock size={11} className="inline mr-1" />
                  Hide after (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className={inputCls}
                />
                <p className="text-[10px] text-foreground-muted mt-0.5">Leave blank to show indefinitely</p>
              </div>

              {/* Active checkbox */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">Active (visible on site)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary-hover transition-colors"
              >
                {saving ? "Saving…" : editingId ? "Update Banner" : "Add Banner"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-5 py-2 rounded-lg border border-border text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="h-16 bg-background-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="py-16 text-center text-foreground-muted">
            <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
            <p>No banners yet. Add one above to show it on the homepage.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Banner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase hidden sm:table-cell">Schedule</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => {
                const status = getBannerStatus(b);
                return (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50">
                    {/* Banner preview + title */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {b.image ? (
                          <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-border shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-lg border border-border bg-background-subtle flex items-center justify-center shrink-0">
                            <ImageIcon size={14} className="text-foreground-muted" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{b.title}</p>
                          {b.subtitle && <p className="text-xs text-foreground-muted truncate max-w-[200px]">{b.subtitle}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-4 py-3 text-foreground-muted text-xs">{b.position.replace(/_/g, " ")}</td>

                    {/* Schedule window */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {b.startsAt || b.endsAt ? (
                        <div className="flex items-center gap-1 text-xs text-foreground-muted">
                          <Clock size={11} className="text-blue-500 shrink-0" />
                          <span>
                            {b.startsAt ? new Date(b.startsAt).toLocaleDateString() : "now"}
                            {" → "}
                            {b.endsAt ? new Date(b.endsAt).toLocaleDateString() : "∞"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-foreground-muted/40">Always</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", status.cls)}>
                        {status.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(b)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive(b.id, b.isActive)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title={b.isActive ? "Deactivate" : "Activate"}
                        >
                          {b.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-md text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
