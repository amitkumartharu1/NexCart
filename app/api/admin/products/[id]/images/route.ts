import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { deleteImage, extractPublicId } from "@/lib/cloudinary.server";

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role);
}

const AddImageSchema = z.object({
  url: z.string().min(1),
  altText: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = AddImageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 422 });
  }

  // Get current max sortOrder
  const lastImage = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextOrder = (lastImage?.sortOrder ?? -1) + 1;

  // If this image is primary, unset all others
  if (parsed.data.isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId: id },
      data: { isPrimary: false },
    });
  }

  const image = await prisma.productImage.create({
    data: {
      productId: id,
      url: parsed.data.url,
      altText: parsed.data.altText ?? null,
      isPrimary: parsed.data.isPrimary ?? nextOrder === 0,
      sortOrder: nextOrder,
    },
  });

  return NextResponse.json({ image }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: productId } = await params;
  const { imageId } = await req.json();
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  // Verify image belongs to this product
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.productImage.delete({ where: { id: imageId } });

  // Remove from Cloudinary (non-blocking — don't fail the request if this errors)
  const publicId = extractPublicId(image.url);
  if (publicId) {
    deleteImage(publicId).catch(() => {});
  }

  // If the deleted image was primary, assign primary to the next one
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: productId } = await params;
  const { imageId, isPrimary, altText } = await req.json();
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });

  if (isPrimary) {
    // Unset all primaries first
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  const image = await prisma.productImage.update({
    where: { id: imageId },
    data: {
      ...(isPrimary !== undefined ? { isPrimary } : {}),
      ...(altText !== undefined ? { altText } : {}),
    },
  });

  return NextResponse.json({ image });
}
