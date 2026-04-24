import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({
    where: { slug, status: "ACTIVE" },
    include: {
      serviceCategory: true,
      packages: { orderBy: { price: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service });
}
