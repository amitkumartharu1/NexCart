/**
 * /api/admin/testimonials
 * GET  — list all testimonials (with filters)
 * POST — create a new testimonial
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as any)) {
    return null;
  }
  return session;
}

// ─── GET /api/admin/testimonials ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filter    = req.nextUrl.searchParams.get("filter") ?? "";
  const search    = req.nextUrl.searchParams.get("search") ?? "";
  const page      = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit     = 50;

  const where: any = {};
  if (filter === "approved")   where.isApproved = true;
  if (filter === "pending")    where.isApproved = false;
  if (filter === "featured")   where.isFeatured = true;
  if (search) {
    where.OR = [
      { name:    { contains: search, mode: "insensitive" } },
      { body:    { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const [testimonials, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
  ]);

  return NextResponse.json({ testimonials, total, page, limit });
}

// ─── POST /api/admin/testimonials ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, role, company, avatar, reviewBody, rating, isApproved, isFeatured, sortOrder } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 422 });
  }
  if (!reviewBody?.trim()) {
    return NextResponse.json({ error: "Review text is required" }, { status: 422 });
  }
  const ratingNum = parseInt(rating ?? "5");
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 422 });
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      name:       name.trim(),
      role:       role?.trim() || null,
      company:    company?.trim() || null,
      avatar:     avatar?.trim() || null,
      body:       reviewBody.trim(),
      rating:     ratingNum,
      isApproved: Boolean(isApproved),
      isFeatured: Boolean(isFeatured),
      sortOrder:  parseInt(sortOrder ?? "0") || 0,
    },
  });

  return NextResponse.json({ testimonial }, { status: 201 });
}
