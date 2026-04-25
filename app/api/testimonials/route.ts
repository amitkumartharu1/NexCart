/**
 * GET /api/testimonials
 * Public endpoint — returns approved testimonials for the homepage carousel.
 * Featured testimonials appear first, then sorted by sortOrder + recency.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 20,
      select: {
        id:         true,
        name:       true,
        role:       true,
        company:    true,
        avatar:     true,
        body:       true,
        rating:     true,
        isFeatured: true,
      },
    });

    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error("[/api/testimonials]", err);
    return NextResponse.json({ testimonials: [] });
  }
}
