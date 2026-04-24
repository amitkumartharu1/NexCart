import { AdminStatsOverview }        from "@/components/admin/dashboard/StatsOverview";
import { AdminRecentOrders }          from "@/components/admin/dashboard/RecentOrders";
import { AdminRevenueChart }          from "@/components/admin/dashboard/RevenueChart";
import { AdminQuickActions }          from "@/components/admin/dashboard/QuickActions";
import { AdminLowStockAlerts }        from "@/components/admin/dashboard/LowStockAlerts";
import { AdminRecentlyRestocked }     from "@/components/admin/dashboard/RecentlyRestockedAdmin";

export const metadata = { title: "Dashboard — Admin | NexCart" };

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats row */}
      <AdminStatsOverview />

      {/* Revenue chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminRevenueChart />
        </div>
        <div>
          <AdminQuickActions />
        </div>
      </div>

      {/* Inventory alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminLowStockAlerts />
        <AdminRecentlyRestocked />
      </div>

      {/* Recent orders */}
      <AdminRecentOrders />
    </div>
  );
}
