import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/categories/stats
 * Returns all active categories with their ACTIVE product counts,
 * sorted by product count descending.
 * Used by TopCategoriesChart — independent of the heavy stats endpoint.
 */
export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch all active categories, counting only ACTIVE products
    const rows = await prisma.category.findMany({
      where:  { isActive: true },
      select: {
        id:   true,
        name: true,
        slug: true,
        _count: {
          select: {
            // Only count ACTIVE products — DRAFT / ARCHIVED don't show on the store
            products: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    // Sort by active product count descending, take top 6
    const categories = rows
      .sort((a, b) => b._count.products - a._count.products)
      .slice(0, 6);

    // Totals for the footer summary
    const totalActiveProducts = categories.reduce(
      (sum, c) => sum + c._count.products,
      0
    );

    return NextResponse.json({
      categories,
      meta: {
        totalCategories:     rows.length,        // all active categories
        topN:                categories.length,  // how many are shown
        totalActiveProducts,
      },
    });
  } catch (err) {
    console.error("[categories/stats] error:", err);
    return NextResponse.json({ categories: [], meta: { totalCategories: 0, topN: 0, totalActiveProducts: 0 } });
  }
}
