"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Star, Plus, Pencil, Trash2, Eye, EyeOff, BadgeCheck,
  Search, RefreshCw, X, Check, Quote, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  body: string;
  rating: number;
  isApproved: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  role: "",
  company: "",
  avatar: "",
  reviewBody: "",
  rating: 5,
  isApproved: true,
  isFeatured: false,
  sortOrder: 0,
};

const FILTERS = [
  { label: "All",      value: "" },
  { label: "Approved", value: "approved" },
  { label: "Pending",  value: "pending" },
  { label: "Featured", value: "featured" },
];

// ─── Star rating input ────────────────────────────────────────────────────────

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={cn(
              "fill-current transition-colors",
              s <= (hovered || value) ? "text-yellow-400" : "text-border",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-foreground-muted self-center">{value}/5</span>
    </div>
  );
}

// ─── Avatar preview ───────────────────────────────────────────────────────────

const GRADS = [
  "linear-gradient(135deg,#1e3a8a,#2563eb)",
  "linear-gradient(135deg,#064e3b,#059669)",
  "linear-gradient(135deg,#4c1d95,#7c3aed)",
  "linear-gradient(135deg,#7c2d12,#ea580c)",
  "linear-gradient(135deg,#713f12,#ca8a04)",
  "linear-gradient(135deg,#881337,#dc2626)",
];
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function Avatar({ t, size = 40 }: { t: Testimonial; size?: number }) {
  const grad = GRADS[t.name.charCodeAt(0) % GRADS.length];
  if (t.avatar) {
    return (
      <img
        src={t.avatar}
        alt={t.name}
        width={size}
        height={size}
        className="rounded-xl object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className="rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 select-none"
      style={{ width: size, height: size, background: grad, fontSize: size * 0.35 }}
    >
      {initials(t.name) || "?"}
    </div>
  );
}

// ─── Review card (preview) ────────────────────────────────────────────────────

function ReviewPreviewCard({ t }: { t: Testimonial }) {
  return (
    <div className="rounded-2xl border border-border bg-background-subtle p-4 space-y-3">
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <Star key={s} size={12} className={cn("fill-current", s <= t.rating ? "text-yellow-400" : "text-border")} />
        ))}
      </div>
      <p className="text-sm text-foreground-muted line-clamp-3 italic">&ldquo;{t.body}&rdquo;</p>
      <div className="flex items-center gap-2">
        <Avatar t={t} size={32} />
        <div>
          <p className="text-xs font-semibold text-foreground">{t.name}</p>
          {(t.role || t.company) && (
            <p className="text-[10px] text-foreground-muted">
              {[t.role, t.company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Form modal ───────────────────────────────────────────────────────────────

function TestimonialModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: typeof EMPTY_FORM | Testimonial | null;
  onSave: (data: typeof EMPTY_FORM) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const isEdit = !!initial && "id" in initial;
  const [form, setForm] = useState<typeof EMPTY_FORM>(() =>
    initial && "id" in initial
      ? {
          name:       initial.name,
          role:       initial.role ?? "",
          company:    initial.company ?? "",
          avatar:     initial.avatar ?? "",
          reviewBody: initial.body,
          rating:     initial.rating,
          isApproved: initial.isApproved,
          isFeatured: initial.isFeatured,
          sortOrder:  initial.sortOrder,
        }
      : EMPTY_FORM,
  );

  const set = (key: keyof typeof EMPTY_FORM, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // Auto-generate preview testimonial
  const preview: Testimonial = {
    id: "preview",
    name: form.name || "Customer Name",
    role: form.role || null,
    company: form.company || null,
    avatar: form.avatar || null,
    body: form.reviewBody || "Review text will appear here…",
    rating: form.rating,
    isApproved: form.isApproved,
    isFeatured: form.isFeatured,
    sortOrder: form.sortOrder,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-2xl border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Quote size={16} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {isEdit ? "Edit Testimonial" : "Add New Testimonial"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
                Customer Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Sarah M."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Role / Title</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. Verified Buyer"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          {/* Company + Avatar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Company / Product Tag</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="e.g. Smart Devices"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Avatar URL (optional)</label>
              <input
                type="url"
                value={form.avatar}
                onChange={(e) => set("avatar", e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          {/* Review body */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
              Review Text <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={4}
              value={form.reviewBody}
              onChange={(e) => set("reviewBody", e.target.value)}
              placeholder="What did the customer say about your product or service?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
            />
            <p className="text-xs text-foreground-subtle">{form.reviewBody.length} characters</p>
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Star Rating</label>
            <StarRatingInput value={form.rating} onChange={(v) => set("rating", v)} />
          </div>

          {/* Sort order */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
              Sort Order <span className="text-foreground-subtle font-normal">(lower = earlier)</span>
            </label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
              min={0}
              className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            {/* Approved */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => set("isApproved", !form.isApproved)}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  form.isApproved ? "bg-primary" : "bg-border",
                )}
              >
                <span className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  form.isApproved ? "translate-x-5" : "translate-x-1",
                )} />
              </button>
              <span className="text-sm font-medium text-foreground">Published</span>
            </label>

            {/* Featured */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => set("isFeatured", !form.isFeatured)}
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  form.isFeatured ? "bg-yellow-400" : "bg-border",
                )}
              >
                <span className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  form.isFeatured ? "translate-x-5" : "translate-x-1",
                )} />
              </button>
              <span className="text-sm font-medium text-foreground">Featured</span>
            </label>
          </div>

          {/* Live preview */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">Preview</p>
            <ReviewPreviewCard t={preview} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={saving || !form.name.trim() || !form.reviewBody.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : (
                <Check size={14} />
              )}
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Testimonial"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onClose, deleting }: {
  name: string; onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-background rounded-2xl border border-border shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete Testimonial</h3>
            <p className="text-sm text-foreground-muted">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-foreground-muted">
          You are about to permanently delete the testimonial by <strong className="text-foreground">{name}</strong>.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2 text-sm font-semibold rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Trash2 size={13} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [total,    setTotal]   = useState(0);
  const [loading,  setLoading] = useState(true);
  const [filter,   setFilter]  = useState("");
  const [search,   setSearch]  = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen,  setModalOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const [saving,   setSaving]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("filter", filter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res  = await fetch(`/api/admin/testimonials?${params}`);
    const data = await res.json().catch(() => ({}));
    setTestimonials(data.testimonials ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [filter, debouncedSearch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const approved = testimonials.filter((t) => t.isApproved).length;
  const featured = testimonials.filter((t) => t.isFeatured).length;
  const pending  = testimonials.filter((t) => !t.isApproved).length;

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async (formData: typeof EMPTY_FORM) => {
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const url    = isEdit ? `/api/admin/testimonials/${editTarget!.id}` : "/api/admin/testimonials";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as any).error ?? "Failed to save");
        return;
      }

      toast.success(isEdit ? "Testimonial updated" : "Testimonial added");
      setModalOpen(false);
      setEditTarget(null);
      fetchAll();
    } finally {
      setSaving(false);
    }
  };

  // ── Quick toggle (approve / feature) ──────────────────────────────────────
  const quickToggle = async (id: string, patch: { isApproved?: boolean; isFeatured?: boolean }) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { toast.success("Updated"); fetchAll(); }
    else toast.error("Failed to update");
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/testimonials/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Testimonial deleted"); fetchAll(); }
    else toast.error("Failed to delete");
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <>
      {/* ── Form modal ── */}
      {modalOpen && (
        <TestimonialModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          saving={saving}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Testimonials</h1>
            <p className="text-sm text-foreground-muted mt-1">
              Manage customer reviews displayed on the homepage carousel
            </p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Add Testimonial
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",    value: total,    color: "text-foreground" },
            { label: "Published",value: approved, color: "text-emerald-600" },
            { label: "Pending",  value: pending,  color: "text-yellow-600" },
            { label: "Featured", value: featured, color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="bg-background rounded-xl border border-border px-5 py-4">
              <p className="text-xs text-foreground-muted font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters + Search ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background-subtle border border-border text-foreground-muted hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, review…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 w-52"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={fetchAll}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-background-subtle animate-pulse" />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <div className="py-20 text-center">
              <Quote size={40} className="mx-auto mb-4 text-foreground-subtle opacity-30" />
              <p className="text-foreground-muted font-medium">No testimonials found</p>
              <p className="text-sm text-foreground-subtle mt-1">
                {search || filter ? "Try adjusting your filters." : "Add your first testimonial using the button above."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-start gap-4 p-5 hover:bg-background-subtle/50 transition-colors",
                    !t.isApproved && "opacity-60",
                  )}
                >
                  {/* Avatar */}
                  <Avatar t={t} size={44} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{t.name}</span>
                      {(t.role || t.company) && (
                        <span className="text-xs text-foreground-muted">
                          {[t.role, t.company].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {/* Badges */}
                      {t.isFeatured && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-600">
                          <Sparkles size={9} /> Featured
                        </span>
                      )}
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        t.isApproved ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600",
                      )}>
                        {t.isApproved ? "Published" : "Pending"}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={10} className={cn("fill-current", s <= t.rating ? "text-yellow-400" : "text-border")} />
                      ))}
                    </div>

                    <p className="text-sm text-foreground-muted line-clamp-2">&ldquo;{t.body}&rdquo;</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Feature toggle */}
                    <button
                      onClick={() => quickToggle(t.id, { isFeatured: !t.isFeatured })}
                      title={t.isFeatured ? "Unfeature" : "Feature"}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                        t.isFeatured
                          ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
                          : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
                      )}
                    >
                      <Sparkles size={14} />
                    </button>

                    {/* Approve/hide toggle */}
                    <button
                      onClick={() => quickToggle(t.id, { isApproved: !t.isApproved })}
                      title={t.isApproved ? "Unpublish" : "Publish"}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                        t.isApproved
                          ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                          : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
                      )}
                    >
                      {t.isApproved ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => { setEditTarget(t); setModalOpen(true); }}
                      title="Edit"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(t)}
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer count */}
          {!loading && testimonials.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-background-subtle/40 text-xs text-foreground-muted">
              Showing {testimonials.length} of {total} testimonials
            </div>
          )}
        </div>
      </div>
    </>
  );
}
