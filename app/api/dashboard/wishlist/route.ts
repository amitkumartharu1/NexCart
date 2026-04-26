import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wishlist = await prisma.wishlist.findFirst({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { url: true, altText: true },
              },
              inventory: { select: { quantity: true } },
            },
          },
        },
      },
    },
  });

  // Normalise basePrice → price so frontend components work correctly
  const items = (wishlist?.items ?? []).map((item) => ({
    ...item,
    product: {
      ...item.product,
      price:        Number(item.product.basePrice),
      comparePrice: item.product.comparePrice != null ? Number(item.product.comparePrice) : null,
    },
  }));

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();

  let wishlist = await prisma.wishlist.findFirst({ where: { userId: session.user.id } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId: session.user.id } });
  }

  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    create: { wishlistId: wishlist.id, productId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId } = await req.json();

  const wishlist = await prisma.wishlist.findFirst({ where: { userId: session.user.id } });
  if (wishlist) {
    await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  }

  return NextResponse.json({ success: true });
}
