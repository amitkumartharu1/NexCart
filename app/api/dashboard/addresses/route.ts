import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      firstName: body.firstName,
      lastName: body.lastName,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country ?? "Nepal",
      phone: body.phone,
      isDefault: body.isDefault ?? false,
    },
  });
  return NextResponse.json({ address }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, isDefault } = await req.json();
  if (isDefault) {
    // Unset all defaults first, then set the selected one
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }
  const address = await prisma.address.updateMany({
    where: { id, userId: session.user.id },
    data: { isDefault },
  });
  return NextResponse.json({ address });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
