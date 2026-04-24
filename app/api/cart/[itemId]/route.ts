import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const { quantity } = await req.json();

  if (!quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cart: { userId: session.user.id } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await params;

  await prisma.cartItem.deleteMany({
    where: { id: itemId, cart: { userId: session.user.id } },
  });

  return NextResponse.json({ success: true });
}
