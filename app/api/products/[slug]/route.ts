import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const isAdmin = ADMIN_ROLES.has(session?.user?.role ?? "");

  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: {
        slug,
        // Admins can preview any status; customers only see ACTIVE products
        ...(!isAdmin ? { status: "ACTIVE" } : {}),
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand:    { select: { name: true, slug: true, logo: true } },
        images:   { orderBy: { sortOrder: "asc" } },
        inventory: {
          select: {
            quantity: true,
            lastRestockedAt: true,
            lowStockThreshold: true,
          },
        },
        variants: {
          where: { isActive: true },
          include: {
            inventory: { select: { quantity: true } },
          },
        },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment view count fire-and-forget
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[/api/products/[slug]] Prisma error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
