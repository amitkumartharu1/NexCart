"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Wrench, Plus, Edit, Trash2, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  basePrice: number | null;
  duration: number | null;
  isBookable: boolean;
  serviceCategory: { name: string } | null;
  packages: { name: string; price: number }[];
  _count: { bookings: number };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  DRAFT: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  ARCHIVED: "bg-gray-500/10 text-gray-500",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    try {
      const res = await fetch(`/api/admin/services?${params}`);
      const data = await res.json().catch(() => ({}));
      setServices(data.services ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Service deleted");
      fetchServices();
    } else {
      toast.error("Failed to delete service");
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      toast.success(`Service ${newStatus === "ACTIVE" ? "published" : "archived"}`);
      fetchServices();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {total} service{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <Plus size={14} />
          Add Service
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search services..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
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
        </select>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Service</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Bookings</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(8).fill(null).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Array(7).fill(null).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-background-subtle rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : services.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-foreground-muted">
                        <Wrench size={32} className="opacity-30" />
                        <p>No services found</p>
                        <Link href="/admin/services/new" className="text-primary text-sm hover:underline">Add your first service</Link>
                      </div>
                    </td>
                  </tr>
                )
                : services.map((service) => {
                  const startingPrice = service.packages[0]?.price ?? service.basePrice;
                  return (
                    <tr key={service.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Wrench size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">{service.name}</p>
                            <div className="flex items-center gap-2">
                              {service.isFeatured && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Featured</span>
                              )}
                              {service.isBookable && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">Bookable</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">{service.serviceCategory?.name ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {startingPrice != null ? `From ${formatCurrency(Number(startingPrice))}` : "Custom"}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-sm">
                        {service.duration ? `${service.duration} min` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-foreground-muted">
                          <BookOpen size={13} />
                          <span className="text-sm">{service._count.bookings}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(service.id, service.status)}
                          className={cn("text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity", STATUS_STYLES[service.status] ?? "bg-background-subtle text-foreground-muted")}
                        >
                          {service.status.charAt(0) + service.status.slice(1).toLowerCase()}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/services/${service.slug}`}
                            target="_blank"
                            title="View"
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                          >
                            <BookOpen size={13} />
                          </Link>
                          <Link
                            href={`/admin/services/${service.id}/edit`}
                            title="Edit"
                            className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
                          >
                            <Edit size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(service.id, service.name)}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-foreground-muted">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
