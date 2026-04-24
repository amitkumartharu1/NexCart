import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN","ADMIN","MANAGER","STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");

  const where: any = {};
  if (search) where.OR = [
    { user: { name: { contains: search, mode: "insensitive" } } },
    { user: { email: { contains: search, mode: "insensitive" } } },
    { service: { name: { contains: search, mode: "insensitive" } } },
  ];
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.serviceBooking.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
        package: { select: { name: true, price: true } },
      },
    }),
    prisma.serviceBooking.count({ where }),
  ]);

  return NextResponse.json({ bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
