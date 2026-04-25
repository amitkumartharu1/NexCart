import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role as any)) return null;
  return session;
}

// ─── GET /api/admin/reviews ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filter = req.nextUrl.searchParams.get("filter") ?? "";
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit  = 50;

  const where: any = {};
  if (filter === "approved") { where.isApproved = true; where.isHidden = false; }
  else if (filter === "pending")  { where.isApproved = false; where.isHidden = false; }
  else if (filter === "hidden")   { where.isHidden = true; }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { body:  { contains: search, mode: "insensitive" } },
      { user:  { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user:    { select: { name: true, email: true, image: true } },
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json({ reviews, total, page, limit });
}

// ─── PATCH /api/admin/reviews ────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, isApproved, isHidden, adminReply } = await req.json();

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const data: any = {};
  if (isApproved  !== undefined) data.isApproved  = Boolean(isApproved);
  if (isHidden    !== undefined) data.isHidden     = Boolean(isHidden);
  if (adminReply  !== undefined) data.adminReply   = adminReply?.trim() || null;

  try {
    const review = await prisma.review.update({ where: { id }, data });
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
}

// ─── DELETE /api/admin/reviews ───────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
}
