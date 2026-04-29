import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] as const;

/**
 * GET /api/admin/products/barcode?sku=<sku>
 * Look up a product by its SKU (barcode scan result).
 * Returns minimal product data for quick POS addition.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sku = req.nextUrl.searchParams.get("sku")?.trim();
  if (!sku) return NextResponse.json({ error: "SKU is required" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: { equals: sku, mode: "insensitive" } },
        { sku: { equals: sku.replace(/^0+/, ""), mode: "insensitive" } }, // strip leading zeros
      ],
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      sku: true,
      basePrice: true,
      inventory: { select: { quantity: true } },
      images: { take: 1, select: { url: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: `No active product found with SKU "${sku}"` }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      id:        product.id,
      name:      product.name,
      sku:       product.sku,
      price:     Number(product.basePrice),
      stock:     product.inventory?.quantity ?? 0,
      imageUrl:  product.images[0]?.url ?? null,
    },
  });
}
