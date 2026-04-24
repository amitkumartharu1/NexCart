import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const categorySlug = searchParams.get("category");
  const brandId = searchParams.get("brand");
  const minPrice = parseFloat(searchParams.get("minPrice") ?? "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") ?? "999999");
  const sort = searchParams.get("sort") ?? "newest";
  const filter = searchParams.get("filter");

  const where: any = { status: "ACTIVE" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (categorySlug) where.category = { slug: categorySlug };
  if (brandId) where.brandId = brandId;
  where.basePrice = { gte: minPrice, lte: maxPrice };

  if (filter === "new") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: thirtyDaysAgo };
  } else if (filter === "featured") {
    where.isFeatured = true;
  } else if (filter === "restocked") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    where.inventory = { lastRestockedAt: { gte: sevenDaysAgo } };
  }

  const orderBy: any =
    sort === "price_asc"  ? { basePrice: "asc" }
    : sort === "price_desc" ? { basePrice: "desc" }
    : sort === "rating"     ? { viewCount: "desc" }   // proxy: most-viewed = most popular
    : { createdAt: "desc" };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
          inventory: { select: { quantity: true, lastRestockedAt: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[/api/products] Prisma error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
