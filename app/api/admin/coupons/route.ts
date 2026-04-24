import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN","ADMIN","MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const existing = await prisma.coupon.findUnique({ where: { code: body.code } });
  if (existing) return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
  const coupon = await prisma.coupon.create({
    data: {
      code: body.code,
      discountType: body.discountType ?? "PERCENTAGE",
      discountValue: body.discountValue,
      minOrderValue: body.minOrderAmount ?? null,
      usageLimit: body.maxUses ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      isActive: body.isActive ?? true,
    },
  });
  return NextResponse.json({ coupon }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN","ADMIN","MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, ...data } = await req.json();
  const coupon = await prisma.coupon.update({ where: { id }, data });
  return NextResponse.json({ coupon });
}
