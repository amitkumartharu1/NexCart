"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Stats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalUsers: number;
  usersThisMonth: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
}

export function AdminStatsOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => { setStats(d.stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          label: "Revenue (This Month)",
          value: formatCurrency(stats.totalRevenue),
          change: stats.revenueChange,
          icon: DollarSign,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
        {
          label: "Total Orders",
          value: stats.totalOrders.toLocaleString(),
          change: stats.ordersChange,
          icon: ShoppingCart,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: "Total Users",
          value: stats.totalUsers.toLocaleString(),
          sub: `+${stats.usersThisMonth} this month`,
          icon: Users,
          color: "text-purple-500",
          bg: "bg-purple-500/10",
        },
        {
          label: "Active Products",
          value: stats.totalProducts.toLocaleString(),
          sub: stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "All well stocked",
          subColor: stats.lowStockProducts > 0 ? "text-orange-500" : "text-emerald-500",
          icon: stats.lowStockProducts > 0 ? AlertTriangle : Package,
          color: stats.lowStockProducts > 0 ? "text-orange-500" : "text-emerald-500",
          bg: stats.lowStockProducts > 0 ? "bg-orange-500/10" : "bg-emerald-500/10",
        },
        {
          label: "Pending Orders",
          value: stats.pendingOrders.toLocaleString(),
          sub: "Awaiting processing",
          icon: Clock,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10",
        },
      ]
    : Array(5).fill(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-background rounded-xl border border-border p-5">
          {loading || !card ? (
            <div className="animate-pulse space-y-3">
              <div className="w-10 h-10 rounded-xl bg-background-subtle" />
              <div className="h-3 bg-background-subtle rounded w-3/4" />
              <div className="h-6 bg-background-subtle rounded w-1/2" />
            </div>
          ) : (
            <>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", card.bg)}>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-xs text-foreground-muted font-medium">{card.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{card.value}</p>
              {card.change !== undefined ? (
                <div className={cn("flex items-center gap-1 text-xs mt-1", card.change >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {card.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(card.change).toFixed(1)}% vs last month
                </div>
              ) : card.sub ? (
                <p className={cn("text-xs mt-1", card.subColor ?? "text-foreground-muted")}>{card.sub}</p>
              ) : null}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
