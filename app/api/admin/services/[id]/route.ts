import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const UpdateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  categoryId: z.string().optional().nullable(),
  basePrice: z.number().positive().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  isBookable: z.boolean().optional(),
  requiresOnsite: z.boolean().optional(),
  priceType: z.enum(["fixed", "hourly", "custom"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      serviceCategory: { select: { id: true, name: true, slug: true } },
      packages: { orderBy: { price: "asc" } },
    },
  });

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const parsed = UpdateServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  try {
    const service = await prisma.service.update({
      where: { id },
      data: parsed.data,
      include: {
        serviceCategory: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json({ service });
  } catch (err: unknown) {
    const code = (err as Record<string, unknown>)?.code;
    if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (code === "P2002") return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
