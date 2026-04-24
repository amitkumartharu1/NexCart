import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;

  try {
    const [services, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        include: {
          serviceCategory: { select: { name: true } },
          packages: { select: { name: true, price: true }, orderBy: { price: "asc" }, take: 1 },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      services,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, slug, description, shortDescription, status, isFeatured, categoryId, basePrice, duration, isBookable } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const existing = await prisma.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const service = await prisma.service.create({
      data: {
        name,
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        status: status ?? "DRAFT",
        isFeatured: isFeatured ?? false,
        categoryId: categoryId || null,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        duration: duration ? parseInt(duration) : null,
        isBookable: isBookable ?? true,
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
