import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}
