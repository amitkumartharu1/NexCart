/**
 * POST /api/payment/manual
 * Customer submits eSewa/Khalti transaction ID + screenshot proof.
 * Moves order: PENDING → PAYMENT_VERIFICATION
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { assertValidTransition } from "@/lib/orders/transitions";
import { z } from "zod";

const Schema = z.object({
  orderId:           z.string().min(1),
  transactionId:     z.string().min(3, "Transaction ID is required"),
  proofImage:        z.string().url("Proof image must be a valid URL").optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { orderId, transactionId, proofImage } = parsed.data;

  // Fetch order — must belong to this user
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { payments: { take: 1, orderBy: { createdAt: "asc" } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Validate transition
  try {
    assertValidTransition(order.status, "PAYMENT_VERIFICATION");
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid transition" },
      { status: 422 }
    );
  }

  const payment = order.payments[0];
  if (!payment) {
    return NextResponse.json({ error: "No payment record found" }, { status: 400 });
  }

  // Guard duplicate transactionId
  const existing = await prisma.payment.findUnique({
    where: { manualTransactionId: transactionId },
  });
  if (existing && existing.id !== payment.id) {
    return NextResponse.json(
      { error: "This transaction ID has already been used on another order" },
      { status: 409 }
    );
  }

  // Atomic update
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        manualTransactionId: transactionId,
        proofImage: proofImage ?? null,
        status: "PENDING",   // pending admin review
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAYMENT_VERIFICATION",
        statusHistory: {
          create: {
            status: "PAYMENT_VERIFICATION",
            note: `Payment proof submitted — Txn: ${transactionId}`,
            createdBy: session.user.id,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ success: true, message: "Payment proof submitted for verification" });
}
