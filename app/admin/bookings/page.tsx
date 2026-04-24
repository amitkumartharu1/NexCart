"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Booking {
  id: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  totalAmount: number | null;
  notes: string | null;
  user: { name: string | null; email: string | null };
  service: { name: string };
  package: { name: string; price: number } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  CONFIRMED: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-emerald-500/10 text-emerald-600",
  CANCELLED: "bg-red-500/10 text-red-600",
  NO_SHOW: "bg-gray-500/10 text-gray-500",
};

const STATUSES = ["PENDING","CONFIRMED","COMPLETED","CANCELLED","NO_SHOW"];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json().catch(() => ({}));
    setBookings(data.bookings ?? []);
    setTotalPages(data.pagination?.totalPages ?? 1);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { toast.success("Booking updated"); fetchBookings(); }
    else toast.error("Failed to update");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Service Bookings</h1>
        <p className="text-sm text-foreground-muted mt-1">Manage customer service bookings</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search bookings..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-background-subtle">
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Service</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase">Action</th>
            </tr></thead>
            <tbody>
              {loading ? Array(6).fill(null).map((_,i) => (
                <tr key={i} className="border-b border-border">{Array(6).fill(null).map((__,j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-background-subtle rounded animate-pulse" /></td>
                ))}</tr>
              )) : bookings.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-foreground-muted">
                  <BookOpen size={28} className="mx-auto mb-2 opacity-30" /><p>No bookings found</p>
                </td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50">
                  <td className="px-4 py-3"><p className="font-medium text-foreground">{b.user.name ?? "—"}</p><p className="text-xs text-foreground-muted">{b.user.email}</p></td>
                  <td className="px-4 py-3"><p className="text-foreground">{b.service.name}</p>{b.package && <p className="text-xs text-foreground-muted">{b.package.name}</p>}</td>
                  <td className="px-4 py-3 text-foreground-muted">{b.scheduledAt ? formatDate(b.scheduledAt) : formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3 text-foreground">{b.totalAmount ? formatCurrency(b.totalAmount) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[b.status] ?? "bg-background-subtle text-foreground-muted")}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-md border border-border bg-background text-foreground focus:outline-none">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded border border-border text-foreground-muted disabled:opacity-30"><ChevronLeft size={14} /></button>
            <span className="text-sm text-foreground-muted">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded border border-border text-foreground-muted disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
