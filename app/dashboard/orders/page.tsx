"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: { quantity: number }[];
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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/orders")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => { setOrders(d.orders ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-sm text-foreground-muted mt-1">Track and manage your orders</p>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="h-16 bg-background-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-foreground-muted">
            <ShoppingBag size={40} className="opacity-30" />
            <div className="text-center">
              <p className="font-medium text-foreground">No orders yet</p>
              <p className="text-sm mt-1">Start shopping to see your orders here</p>
            </div>
            <Link href="/shop" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background-subtle">
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase">Items</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-muted uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-primary hover:underline">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-foreground-muted">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3 text-foreground-muted">{order.items.reduce((s, i) => s + i.quantity, 0)} items</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[order.status] ?? "bg-background-subtle text-foreground-muted")}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground">{formatCurrency(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
