import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const RestockSchema = z.object({
  quantity: z.number().int().positive("Quantity must be positive"),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = RestockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { quantity, note } = parsed.data;

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id },
    include: { inventory: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Update or create inventory
  let inventory = product.inventory;
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        productId: id,
        quantity,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        trackInventory: true,
        lastRestockedAt: new Date(),
      },
    });
  } else {
    inventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        quantity: { increment: quantity },
        lastRestockedAt: new Date(),
      },
    });
  }

  // Log inventory movement
  await prisma.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      type: "RESTOCK",
      quantity,
      notes: note ?? `Restocked by ${session.user.name ?? session.user.email}`,
      createdBy: session.user.id,
    },
  });

  // If product was OUT_OF_STOCK, set it back to ACTIVE
  if (product.status === "OUT_OF_STOCK") {
    await prisma.product.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  // Refresh the product with updated inventory
  const updated = await prisma.product.findUnique({
    where: { id },
    include: {
      inventory: true,
      images: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({ success: true, product: updated, inventory });
}
