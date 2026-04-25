import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN","ADMIN","MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const filter = req.nextUrl.searchParams.get("filter");
  const where: any = {};
  if (filter === "approved") where.isApproved = true;
  else if (filter === "pending") { where.isApproved = false; where.isHidden = false; }
  else if (filter === "hidden") where.isHidden = true;

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  });
  return NextResponse.json({ reviews });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN","ADMIN","MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id, isApproved, isHidden } = await req.json();
  const review = await prisma.review.update({
    where: { id },
    data: {
      ...(isApproved !== undefined && { isApproved }),
      ...(isHidden !== undefined && { isHidden }),
    },
  });

  return NextResponse.json({ review });
}
