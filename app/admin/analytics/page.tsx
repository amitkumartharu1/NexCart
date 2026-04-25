import { AdminStatsOverview } from "@/components/admin/dashboard/StatsOverview";
import { AdminRevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { TopCategoriesChart } from "@/components/admin/dashboard/TopCategoriesChart";

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
        <TopCategoriesChart />
      </div>
    </div>
  );
}
