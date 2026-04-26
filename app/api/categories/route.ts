import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/categories
 * Query params:
 *   featured=true  — only isFeatured=true categories
 *   limit=N        — max results (default 100)
 *   sort=products  — sort by active product count desc (default: name asc)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const featuredOnly = searchParams.get("featured") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 100);
  const sort = searchParams.get("sort") ?? "products";

  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        ...(featuredOnly ? { isFeatured: true } : {}),
        parentId: null, // top-level only
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        icon: true,
        isFeatured: true,
        sortOrder: true,
        _count: {
          select: { products: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: sort === "name" ? { name: "asc" } : { sortOrder: "asc" },
      take: limit * 3, // fetch more, then sort in JS by product count
    });

    // Sort by active product count descending, then by sortOrder
    const sorted = categories
      .sort((a, b) => {
        if (sort === "products") {
          return b._count.products - a._count.products || a.sortOrder - b.sortOrder;
        }
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    return NextResponse.json(
      { categories: sorted },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    console.error("[/api/categories] Error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
