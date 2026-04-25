import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    totalUsers,
    usersThisMonth,
    totalProducts,
    lowStockProducts,
    pendingOrders,
    revenueThisMonth,
    revenueLastMonth,
    recentOrders,
    topProducts,
    topCategories,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.inventory.count({ where: { quantity: { lte: 10, gt: 0 } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, orderNumber: true, total: true, status: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }).catch(() => []),
    prisma.category.findMany({
      where:  { isActive: true },
      select: {
        id:   true,
        name: true,
        slug: true,
        // Count only ACTIVE products — matches what shoppers actually see
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    }).then((rows) =>
      rows
        .sort((a, b) => b._count.products - a._count.products)
        .slice(0, 6)
    ).catch(() => []),
  ]);

  // Revenue trend - last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const revenueTrend = await prisma.order.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    select: { total: true, createdAt: true },
  });

  // Group by day
  const trendMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    trendMap[key] = 0;
  }
  revenueTrend.forEach((o) => {
    const key = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (key in trendMap) trendMap[key] += Number(o.total);
  });
  const revenueChart = Object.entries(trendMap).map(([date, revenue]) => ({ date, revenue }));

  const revThis = Number(revenueThisMonth._sum.total ?? 0);
  const revLast = Number(revenueLastMonth._sum.total ?? 0);

  return NextResponse.json({
    stats: {
      totalRevenue: revThis,
      revenueChange: revLast > 0 ? ((revThis - revLast) / revLast) * 100 : 0,
      totalOrders,
      ordersChange: ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0,
      totalUsers,
      usersThisMonth,
      totalProducts,
      lowStockProducts,
      pendingOrders,
    },
    recentOrders,
    revenueChart,
    topCategories,
  });
}
