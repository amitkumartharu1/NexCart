import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  basePrice: z.number().positive(),
  comparePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  sku: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  initialStock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const lowStock = searchParams.get("lowStock") === "true";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (lowStock) {
    // Compare quantity against each product's own lowStockThreshold.
    // Prisma doesn't support cross-field comparisons in where clauses, so we
    // fetch matching inventory IDs first with a raw query.
    const lowStockRows = await prisma.$queryRaw<Array<{ productId: string }>>`
      SELECT "productId" FROM inventory
      WHERE quantity > 0 AND quantity <= "lowStockThreshold"
    `;
    where.id = { in: lowStockRows.map((r) => r.productId) };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { take: 1, select: { url: true }, orderBy: { sortOrder: "asc" } },
        inventory: { select: { quantity: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { initialStock, lowStockThreshold, ...data } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...data,
      inventory: {
        create: {
          quantity: initialStock,
          reservedQuantity: 0,
          lowStockThreshold,
          trackInventory: true,
        },
      },
    },
    include: {
      inventory: true,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}
