/**
 * POST /api/reviews — submit a product review (authenticated users only)
 * GET  /api/reviews?productId=xxx — fetch approved reviews for a product
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const CreateReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating:    z.number().int().min(1).max(5),
  title:     z.string().max(120).optional().nullable(),
  body:      z.string().max(2000).optional().nullable(),
});

// ── GET /api/reviews?productId=xxx ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId query param required" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: { user: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ reviews });
}

// ── POST /api/reviews ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "You must be signed in to leave a review" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = CreateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { productId, rating, title, body: reviewBody } = parsed.data;

  // Check product exists
  const product = await prisma.product.findUnique({
    where: { id: productId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Prevent duplicate review (one per user per product)
  const existing = await prisma.review.findFirst({
    where: { productId, userId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this product" },
      { status: 409 }
    );
  }

  // Create review — pending approval by default
  const review = await prisma.review.create({
    data: {
      productId,
      userId:     session.user.id,
      rating,
      title:      title   ?? null,
      body:       reviewBody ?? null,
      isApproved: false,   // admin must approve in /admin/reviews
      isVerified: false,
    },
    include: { user: { select: { name: true, image: true } } },
  });

  return NextResponse.json(
    {
      review,
      message: "Review submitted! It will appear after admin approval.",
    },
    { status: 201 }
  );
}
