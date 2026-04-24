/**
 * PATCH /api/admin/payments/[id]/verify
 * Admin approves or rejects a manual payment proof.
 *
 * APPROVE: paymentStatus → COMPLETED, orderStatus → PROCESSING
 * REJECT:  paymentStatus → FAILED,    orderStatus → FAILED
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { assertValidTransition } from "@/lib/orders/transitions";
import { Decimal } from "@prisma/client/runtime/client";
import { z } from "zod";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const Schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: paymentId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { action, note } = parsed.data;

  // Fetch payment with order
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: `Payment is already ${payment.status} — cannot re-verify` },
      { status: 422 }
    );
  }

  const order = payment.order;

  if (action === "APPROVE") {
    // Validate: PAYMENT_VERIFICATION → PROCESSING
    try {
      assertValidTransition(order.status, "PROCESSING");
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid transition" },
        { status: 422 }
      );
    }

    // Re-validate amount integrity using stored unit prices (authoritative at order time)
    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      select: { unitPrice: true, quantity: true },
    });

    let recomputedSubtotal = new Decimal(0);
    for (const item of items) {
      recomputedSubtotal = recomputedSubtotal.plus(item.unitPrice.times(item.quantity));
    }

    if (!recomputedSubtotal.equals(order.subtotal)) {
      console.error(
        `[Payment Verify] Amount mismatch on order ${order.id}: ` +
        `stored=${order.subtotal} recomputed=${recomputedSubtotal}`
      );
      return NextResponse.json(
        { error: "Amount integrity check failed — contact engineering" },
        { status: 422 }
      );
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PROCESSING",
          statusHistory: {
            create: {
              status: "PROCESSING",
              note: note ?? "Payment approved by admin",
              createdBy: session.user.id,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true, result: "approved" });
  }

  // REJECT
  try {
    assertValidTransition(order.status, "FAILED");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid transition" },
      { status: 422 }
    );
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        errorMessage: note ?? "Rejected by admin",
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FAILED",
        statusHistory: {
          create: {
            status: "FAILED",
            note: note ?? "Payment rejected by admin",
            createdBy: session.user.id,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true, result: "rejected" });
}
