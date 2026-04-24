"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  CONFIRMED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PROCESSING: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  SHIPPED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  DELIVERED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
  REFUNDED: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export function AdminRecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => { setOrders(d.recentOrders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Orders</h3>
        <Link href="/admin/orders" className="text-xs text-primary hover:underline">View all</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background-subtle">
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Amount</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5).fill(null).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array(5).fill(null).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-background-subtle rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : orders.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-foreground-muted">No orders yet</td>
                </tr>
              )
              : orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-background-subtle transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-foreground-muted">{order.user.name ?? order.user.email ?? "Unknown"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_STYLES[order.status] ?? "bg-background-subtle text-foreground-muted")}>
                        {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3 text-right text-foreground-muted">{formatRelativeTime(order.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
