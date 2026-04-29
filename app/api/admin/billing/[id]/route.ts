import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] as const;
const DELETE_ROLES  = ["SUPER_ADMIN", "ADMIN"] as const;

// ─── GET: Fetch a single bill ─────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      staff: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });

  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  return NextResponse.json({ bill });
}

// ─── DELETE: Permanently delete a bill ───────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !DELETE_ROLES.includes(session.user.role as any)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const bill = await prisma.bill.findUnique({ where: { id }, select: { id: true, billNumber: true } });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  await prisma.bill.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
