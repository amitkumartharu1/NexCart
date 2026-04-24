import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, firstName: true, lastName: true, phone: true, image: true, role: true },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };

  const data: Record<string, string | null> = {};

  if (body.firstName !== undefined) data.firstName = body.firstName.trim() || null;
  if (body.lastName !== undefined) data.lastName = body.lastName.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone.trim() || null;

  // Recompute name from first+last if both provided
  if (body.firstName !== undefined || body.lastName !== undefined) {
    const first = (body.firstName ?? "").trim();
    const last = (body.lastName ?? "").trim();
    if (first || last) data.name = [first, last].filter(Boolean).join(" ");
  } else if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    data.name = body.name.trim();
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, firstName: true, lastName: true, phone: true },
  });

  return NextResponse.json({ user });
}
