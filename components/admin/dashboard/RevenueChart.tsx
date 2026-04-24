"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils/format";

interface ChartPoint {
  date: string;
  revenue: number;
}

export function AdminRevenueChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => { setData(d.revenueChart ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background rounded-xl border border-border p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">Revenue Trend</h3>
          <p className="text-xs text-foreground-muted mt-0.5">Last 7 days</p>
        </div>
      </div>
      {loading ? (
        <div className="h-48 animate-pulse bg-background-subtle rounded-xl" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
              contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
