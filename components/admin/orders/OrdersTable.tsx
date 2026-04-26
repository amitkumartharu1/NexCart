"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { toast } from "sonner";

type OrderStatus =
  | "PENDING"
  | "PAYMENT_VERIFICATION"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "RETURN_REQUESTED"
  | "RETURNED";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string | null; phone?: string | null } | null;
  items: { quantity: number; unitPrice: number }[];
  payments: { status: string; method: string }[];
  address: {
    firstName: string; lastName: string;
    city: string; state?: string | null; country: string;
    phone?: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:              "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  PAYMENT_VERIFICATION: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CONFIRMED:            "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PROCESSING:           "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  SHIPPED:              "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  OUT_FOR_DELIVERY:     "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  DELIVERED:            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED:            "bg-red-500/10 text-red-600 dark:text-red-400",
  FAILED:               "bg-red-600/10 text-red-700 dark:text-red-400",
  REFUNDED:             "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  PARTIALLY_REFUNDED:   "bg-orange-400/10 text-orange-500 dark:text-orange-300",
  RETURN_REQUESTED:     "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  RETURNED:             "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAYMENT_VERIFICATION",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "RETURN_REQUESTED",
  "RETURNED",
];

const LIMIT = 20;

export function AdminOrdersTable() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);

    try {
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json().catch(() => ({}));
      setOrders(data.orders ?? []);
      setPagination(data.pagination ?? { page, limit: LIMIT, total: 0, totalPages: 1 });
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleRowClick = (id: string) => {
    router.push(`/admin/orders/${id}`);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
          />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by order # or customer…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={handleStatusChange}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Order #
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Items
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Phone / City
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Payment
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8)
                  .fill(null)
                  .map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {Array(8)
                        .fill(null)
                        .map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-background-subtle rounded animate-pulse" />
                          </td>
                        ))}
                    </tr>
                  ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-foreground-muted">
                      <ShoppingBag size={32} className="opacity-30" />
                      <p>No orders found</p>
                      {(search || statusFilter) && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("");
                            setPage(1);
                          }}
                          className="text-primary text-sm hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemCount = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );
                  const customerName =
                    order.user?.name ?? order.user?.email ?? "Unknown";
                  const customerEmail =
                    order.user?.name ? order.user.email : null;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      className="border-b border-border last:border-0 hover:bg-background-subtle/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-primary">
                          #{order.orderNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground line-clamp-1">
                          {customerName}
                        </p>
                        {customerEmail && (
                          <p className="text-xs text-foreground-muted line-clamp-1">
                            {customerEmail}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(order.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            STATUS_STYLES[order.status] ??
                              "bg-background-subtle text-foreground-muted"
                          )}
                        >
                          {order.status.charAt(0) +
                            order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      {/* Phone / City */}
                      <td className="px-4 py-3 text-xs">
                        <p className="text-foreground-muted">
                          {order.address?.phone ?? order.user?.phone ?? "—"}
                        </p>
                        {order.address?.city && (
                          <p className="text-foreground-muted">{order.address.city}</p>
                        )}
                      </td>

                      {/* Payment method */}
                      <td className="px-4 py-3 text-foreground-muted text-xs">
                        {order.payments?.[0]?.method
                          ? ({
                              ESEWA:            "eSewa",
                              KHALTI:           "Khalti",
                              STRIPE:           "Card",
                              CASH_ON_DELIVERY: "Cash on Delivery",
                              BANK_TRANSFER:    "Bank Transfer",
                              OTHER:            "QR Pay",
                            }[order.payments[0].method] ??
                            order.payments[0].method.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()))
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted text-xs whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-foreground-muted">
              Showing{" "}
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} orders
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm text-foreground-muted px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages || loading}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
