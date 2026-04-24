import { AdminStatsOverview } from "@/components/admin/dashboard/StatsOverview";
import { AdminRevenueChart } from "@/components/admin/dashboard/RevenueChart";

export const metadata = { title: "Analytics — Admin | NexCart" };

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-foreground-muted mt-1">Store performance and insights</p>
      </div>
      <AdminStatsOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminRevenueChart />
        <div className="bg-background rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Categories</h3>
          <p className="text-sm text-foreground-muted">Connect your database to see category breakdown.</p>
        </div>
      </div>
    </div>
  );
}
