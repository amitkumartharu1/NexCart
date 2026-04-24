import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const AddToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  quantity: z.number().int().positive().default(1),
});

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findFirst({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cart = await prisma.cart.findFirst({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
              inventory: { select: { quantity: true } },
            },
          },
          variant: { select: { name: true, price: true } },
        },
      },
    },
  });

  return NextResponse.json({ cart: cart ?? { items: [] } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = AddToCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { productId, variantId, quantity } = parsed.data;

  // Verify product is active and in stock
  const product = await prisma.product.findUnique({
    where: { id: productId, status: "ACTIVE" },
    include: { inventory: { select: { quantity: true } } },
  });
  if (!product) return NextResponse.json({ error: "Product not available" }, { status: 400 });

  const availableQty = product.inventory?.quantity ?? 0;
  if (availableQty < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const cart = await getOrCreateCart(session.user.id);

  // Check if item already in cart
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
        quantity,
        price: product.basePrice,
      },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { itemId } = body;

  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  await prisma.cartItem.deleteMany({
    where: {
      id: itemId,
      cart: { userId: session.user.id },
    },
  });

  return NextResponse.json({ success: true });
}
