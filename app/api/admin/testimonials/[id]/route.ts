/**
 * /api/admin/testimonials/[id]
 * GET    — fetch single testimonial
 * PATCH  — update testimonial
 * DELETE — permanently delete
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

// ─── GET /api/admin/testimonials/[id] ───────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ testimonial });
}

// ─── PATCH /api/admin/testimonials/[id] ─────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, role, company, avatar, reviewBody, rating, isApproved, isFeatured, sortOrder } = body;

  // Build patch — only update fields that were sent
  const data: any = {};
  if (name       !== undefined) data.name       = name.trim();
  if (role       !== undefined) data.role        = role?.trim() || null;
  if (company    !== undefined) data.company     = company?.trim() || null;
  if (avatar     !== undefined) data.avatar      = avatar?.trim() || null;
  if (reviewBody !== undefined) data.body        = reviewBody.trim();
  if (rating     !== undefined) {
    const r = parseInt(rating);
    if (!isNaN(r) && r >= 1 && r <= 5) data.rating = r;
  }
  if (isApproved !== undefined) data.isApproved  = Boolean(isApproved);
  if (isFeatured !== undefined) data.isFeatured  = Boolean(isFeatured);
  if (sortOrder  !== undefined) data.sortOrder   = parseInt(sortOrder) || 0;

  try {
    const testimonial = await prisma.testimonial.update({ where: { id }, data });
    return NextResponse.json({ testimonial });
  } catch {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }
}

// ─── DELETE /api/admin/testimonials/[id] ────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.testimonial.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }
}
