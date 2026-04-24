import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { status: "ACTIVE" },
    include: {
      serviceCategory: { select: { name: true, slug: true } },
      packages: {
        select: { name: true, price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ services });
}
