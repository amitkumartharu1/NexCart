import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role);
}

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  basePrice: z.number().positive().optional(),
  comparePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]).optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  // Inventory fields (handled separately)
  stockQuantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      inventory: true,
      variants: { include: { inventory: true } },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json();
  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { stockQuantity, lowStockThreshold, ...productFields } = parsed.data;

  // Update product fields
  const product = await prisma.product.update({
    where: { id },
    data: productFields,
    include: { inventory: true },
  });

  // Handle inventory update if stockQuantity was provided
  if (stockQuantity !== undefined) {
    const existingInventory = product.inventory;

    if (existingInventory) {
      const oldQty = existingInventory.quantity;
      const diff = stockQuantity - oldQty;
      const movementType = diff >= 0 ? "RESTOCK" : "ADJUSTMENT";

      await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: stockQuantity,
          ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
          ...(diff > 0 ? { lastRestockedAt: new Date() } : {}),
        },
      });

      if (diff !== 0) {
        await prisma.inventoryMovement.create({
          data: {
            inventoryId: existingInventory.id,
            type: movementType,
            quantity: Math.abs(diff),
            reason: diff > 0 ? "Manual restock via admin" : "Manual adjustment via admin",
            createdBy: session.user.id,
          },
        });
      }

      // Auto-update product status based on new stock ONLY when the admin
      // did not explicitly set a status in this request.
      if (productFields.status === undefined) {
        const newStatus =
          stockQuantity === 0 ? "OUT_OF_STOCK" :
          product.status === "OUT_OF_STOCK" ? "ACTIVE" :
          product.status;

        if (newStatus !== product.status) {
          await prisma.product.update({ where: { id }, data: { status: newStatus } });
        }
      }
    } else {
      // Create inventory record if it doesn't exist
      const inv = await prisma.inventory.create({
        data: {
          productId: id,
          quantity: stockQuantity,
          lowStockThreshold: lowStockThreshold ?? 5,
          ...(stockQuantity > 0 ? { lastRestockedAt: new Date() } : {}),
        },
      });

      if (stockQuantity > 0) {
        await prisma.inventoryMovement.create({
          data: {
            inventoryId: inv.id,
            type: "RESTOCK",
            quantity: stockQuantity,
            reason: "Initial stock via admin edit",
            createdBy: session.user.id,
          },
        });
      }
    }
  } else if (lowStockThreshold !== undefined && product.inventory) {
    await prisma.inventory.update({
      where: { id: product.inventory.id },
      data: { lowStockThreshold },
    });
  }

  // Return updated product
  const updated = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true, category: true, brand: true },
  });

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
