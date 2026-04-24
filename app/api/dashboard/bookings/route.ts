import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bookings = await prisma.serviceBooking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      service: { select: { name: true, slug: true } },
      package: { select: { name: true, price: true } },
    },
  });
  return NextResponse.json({ bookings });
}
