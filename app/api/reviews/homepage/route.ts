/**
 * GET /api/reviews/homepage
 * Returns the latest approved reviews across all products for the homepage
 * testimonials section. Includes user name, initials, product name + image.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: true, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { name: true, image: true } },
        product: {
          select: {
            name: true,
            slug: true,
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: { url: true, altText: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[/api/reviews/homepage]", err);
    return NextResponse.json({ reviews: [] });
  }
}
