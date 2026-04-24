"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Check, EyeOff, Eye, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isApproved: boolean;
  isHidden: boolean;
  createdAt: string;
  user: { name: string | null; email: string | null };
  product: { name: string; slug: string };
}

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Hidden", value: "hidden" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reviews${filter ? `?filter=${filter}` : ""}`);
    const data = await res.json().catch(() => ({}));
    setReviews(data.reviews ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const update = async (id: string, patch: { isApproved?: boolean; isHidden?: boolean }) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (res.ok) { toast.success("Review updated"); fetchReviews(); }
    else toast.error("Failed to update");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-sm text-foreground-muted mt-1">Moderate customer reviews</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-background-subtle text-foreground-muted hover:text-foreground border border-border"
            )}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array(5).fill(null).map((_, i) => <div key={i} className="h-20 bg-background-subtle rounded-xl animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-foreground-muted">
            <Star size={32} className="mx-auto mb-3 opacity-30" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((r) => (
              <div key={r.id} className={cn("p-5 hover:bg-background-subtle/50 transition-colors", r.isHidden && "opacity-50")}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} size={12} className={cn("fill-current", s <= r.rating ? "text-yellow-400" : "text-gray-200 dark:text-gray-700")} />
                        ))}
                      </div>
                      {r.title && <span className="text-sm font-medium text-foreground">{r.title}</span>}
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                        r.isHidden ? "bg-gray-500/10 text-gray-500" : r.isApproved ? "bg-emerald-500/10 text-emerald-600" : "bg-yellow-500/10 text-yellow-600"
                      )}>
                        {r.isHidden ? "Hidden" : r.isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted line-clamp-2 mb-1">{r.body}</p>
                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span className="font-medium text-foreground">{r.user.name ?? r.user.email}</span>
                      <span>on</span>
                      <span className="text-primary">{r.product.name}</span>
                      <span>{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!r.isApproved && !r.isHidden && (
                      <button onClick={() => update(r.id, { isApproved: true })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                        <Check size={12} /> Approve
                      </button>
                    )}
                    <button onClick={() => update(r.id, { isHidden: !r.isHidden })}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors">
                      {r.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
