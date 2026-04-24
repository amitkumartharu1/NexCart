import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { assertValidTransition } from "@/lib/orders/transitions";
import { z } from "zod";

const ADMIN_ROLES  = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] as const;
const WRITE_ROLES  = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

const UpdateOrderSchema = z.object({
  status: z
    .enum([
      "PENDING", "PAYMENT_VERIFICATION", "CONFIRMED", "PROCESSING",
      "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
      "CANCELLED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED",
      "RETURN_REQUESTED", "RETURNED",
    ])
    .optional(),
  trackingNumber: z.string().optional(),
  trackingUrl:    z.string().url().optional().or(z.literal("")),
  note:           z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        include: {
          product: { select: { name: true, images: { take: 1, select: { url: true } } } },
          variant: { select: { name: true } },
        },
      },
      payments: { orderBy: { createdAt: "asc" } },
      address: true,
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !WRITE_ROLES.includes(session.user.role as typeof WRITE_ROLES[number])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = UpdateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { status, trackingNumber, trackingUrl, note } = parsed.data;

  // If a status transition is requested, validate it
  if (status) {
    const current = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    try {
      assertValidTransition(current.status, status);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid transition" },
        { status: 422 }
      );
    }
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(trackingUrl    !== undefined && { trackingUrl: trackingUrl || null }),
      ...(status && {
        statusHistory: {
          create: {
            status,
            note: note ?? `Status updated to ${status} by admin`,
            createdBy: session.user.id,
          },
        },
      }),
    },
  });

  return NextResponse.json({ order });
}
