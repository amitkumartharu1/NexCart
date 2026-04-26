import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const suppliers = await prisma.supplier.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ suppliers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: {
      name:        body.name,
      logo:        body.logo        ?? null,
      description: body.description ?? null,
      website:     body.website     ?? null,
      country:     body.country     ?? null,
      sortOrder:   body.sortOrder   ?? 0,
      isActive:    body.isActive    ?? true,
      isFeatured:  body.isFeatured  ?? false,
    },
  });
  return NextResponse.json({ supplier }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const supplier = await prisma.supplier.update({ where: { id }, data });
  return NextResponse.json({ supplier });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.supplier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
