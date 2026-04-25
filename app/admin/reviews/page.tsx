"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Star, Check, EyeOff, Eye, RefreshCw, Trash2, MessageSquare,
  Search, X, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  isHidden: boolean;
  adminReply: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null; image: string | null };
  product: { name: string; slug: string };
}

const FILTERS = [
  { label: "All",      value: "" },
  { label: "Pending",  value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Hidden",   value: "hidden" },
];

// ─── Reply drawer ─────────────────────────────────────────────────────────────

function ReplyDrawer({
  review,
  onClose,
  onSaved,
}: {
  review: Review;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(review.adminReply ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: review.id, adminReply: text }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Reply saved"); onSaved(); onClose(); }
    else toast.error("Failed to save reply");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Admin Reply</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Replying to <strong className="text-foreground">{review.user.name ?? review.user.email}</strong>
              &rsquo;s review on{" "}
              <span className="text-primary">{review.product.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Customer review (read-only context) */}
        <div className="rounded-xl bg-background-subtle border border-border p-3 text-sm text-foreground-muted italic line-clamp-3">
          &ldquo;{review.body || review.title}&rdquo;
        </div>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a helpful reply to this review…"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />

        {text && (
          <button
            onClick={() => setText("")}
            className="text-xs text-foreground-subtle hover:text-destructive transition-colors"
          >
            Clear reply
          </button>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              : <Check size={13} />}
            {saving ? "Saving…" : "Save Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onClose, deleting }: {
  onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-background rounded-2xl border border-border shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete Review</h3>
            <p className="text-sm text-foreground-muted">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
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

// ─── Review row ───────────────────────────────────────────────────────────────

function ReviewRow({
  r,
  onUpdate,
  onReply,
  onDelete,
}: {
  r: Review;
  onUpdate: (id: string, patch: object) => void;
  onReply: (r: Review) => void;
  onDelete: (r: Review) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("p-5 hover:bg-background-subtle/40 transition-colors", r.isHidden && "opacity-55")}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden bg-background-muted flex items-center justify-center text-xs font-bold text-foreground-muted">
          {r.user.image
            ? <img src={r.user.image} alt="" className="w-full h-full object-cover" />
            : (r.user.name ?? r.user.email ?? "?")[0].toUpperCase()}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={11}
                  className={cn("fill-current", s <= r.rating ? "text-yellow-400" : "text-border")} />
              ))}
            </div>
            {r.title && <span className="text-sm font-semibold text-foreground truncate">{r.title}</span>}
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-semibold",
              r.isHidden    ? "bg-gray-500/10 text-gray-500"
              : r.isApproved ? "bg-emerald-500/10 text-emerald-600"
                             : "bg-yellow-500/10 text-yellow-600",
            )}>
              {r.isHidden ? "Hidden" : r.isApproved ? "Approved" : "Pending"}
            </span>
            {r.adminReply && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">
                Replied
              </span>
            )}
          </div>

          <p className={cn("text-sm text-foreground-muted", !expanded && "line-clamp-2")}>
            {r.body ?? r.title ?? ""}
          </p>

          {/* Admin reply preview */}
          {r.adminReply && expanded && (
            <div className="mt-2 pl-3 border-l-2 border-primary/40">
              <p className="text-xs text-primary font-semibold mb-0.5">Admin reply</p>
              <p className="text-sm text-foreground-muted">{r.adminReply}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground-muted flex-wrap">
            <span className="font-medium text-foreground">{r.user.name ?? r.user.email}</span>
            <span>on</span>
            <a
              href={`/products/${r.product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-0.5"
            >
              {r.product.name} <ExternalLink size={9} />
            </a>
            <span>{formatDate(r.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Expand/collapse */}
          {(r.body && r.body.length > 120) || r.adminReply ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : null}

          {/* Approve */}
          {!r.isApproved && !r.isHidden && (
            <button
              onClick={() => onUpdate(r.id, { isApproved: true })}
              title="Approve"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
            >
              <Check size={11} /> Approve
            </button>
          )}

          {/* Reply */}
          <button
            onClick={() => onReply(r)}
            title={r.adminReply ? "Edit reply" : "Add reply"}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
              r.adminReply
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
            )}
          >
            <MessageSquare size={13} />
          </button>

          {/* Hide / Show */}
          <button
            onClick={() => onUpdate(r.id, { isHidden: !r.isHidden })}
            title={r.isHidden ? "Show" : "Hide"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
          >
            {r.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(r)}
            title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("");
  const [search,   setSearch]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [replyTarget,  setReplyTarget]  = useState<Review | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer.current);
  }, [search]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter) p.set("filter", filter);
    if (debouncedSearch) p.set("search", debouncedSearch);
    const res  = await fetch(`/api/admin/reviews?${p}`);
    const data = await res.json().catch(() => ({}));
    setReviews(data.reviews ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [filter, debouncedSearch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const update = async (id: string, patch: object) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) { toast.success("Updated"); fetchAll(); }
    else toast.error("Failed to update");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (res.ok) { toast.success("Review deleted"); fetchAll(); }
    else toast.error("Failed to delete");
    setDeleting(false);
    setDeleteTarget(null);
  };

  // Stats
  const approved = reviews.filter((r) => r.isApproved && !r.isHidden).length;
  const pending  = reviews.filter((r) => !r.isApproved && !r.isHidden).length;
  const hidden   = reviews.filter((r) => r.isHidden).length;
  const replied  = reviews.filter((r) => r.adminReply).length;

  return (
    <>
      {replyTarget && (
        <ReplyDrawer
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSaved={fetchAll}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Reviews</h1>
          <p className="text-sm text-foreground-muted mt-1">Moderate and reply to product reviews left by customers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",    value: total,    color: "text-foreground" },
            { label: "Approved", value: approved, color: "text-emerald-600" },
            { label: "Pending",  value: pending,  color: "text-yellow-600" },
            { label: "Replied",  value: replied,  color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-background rounded-xl border border-border px-5 py-4">
              <p className="text-xs text-foreground-muted font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background-subtle border border-border text-foreground-muted hover:text-foreground",
                )}>
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
                placeholder="Search reviews…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 w-48"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
            <button onClick={fetchAll}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-background-subtle animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-foreground-muted">
              <Star size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No reviews found</p>
              <p className="text-sm text-foreground-subtle mt-1">
                {search || filter ? "Try adjusting your filters." : "Reviews appear here once customers submit them."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((r) => (
                <ReviewRow
                  key={r.id}
                  r={r}
                  onUpdate={update}
                  onReply={setReplyTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}

          {!loading && reviews.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-background-subtle/40 text-xs text-foreground-muted">
              Showing {reviews.length} of {total} reviews
            </div>
          )}
        </div>
      </div>
    </>
  );
}
