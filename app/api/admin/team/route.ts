import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export async function GET() {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const members = await prisma.teamMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const member = await prisma.teamMember.create({
    data: {
      name:       body.name,
      role:       body.role,
      bio:        body.bio        ?? null,
      image:      body.image      ?? null,
      email:      body.email      ?? null,
      linkedin:   body.linkedin   ?? null,
      twitter:    body.twitter    ?? null,
      sortOrder:  body.sortOrder  ?? 0,
      isActive:   body.isActive   ?? true,
      isFeatured: body.isFeatured ?? false,
    },
  });
  return NextResponse.json({ member }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const member = await prisma.teamMember.update({ where: { id }, data });
  return NextResponse.json({ member });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
