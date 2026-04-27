import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const position = req.nextUrl.searchParams.get("position") ?? undefined;
  const now = new Date();

  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      ...(position ? { position: position as any } : {}),
      // Respect scheduling: only show if within the active window
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null },   { endsAt:   { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }],
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      image: true,
      link: true,
      ctaText: true,
      position: true,
      sortOrder: true,
    },
  });

  return NextResponse.json({ banners }, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
