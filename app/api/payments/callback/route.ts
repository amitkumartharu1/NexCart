/**
 * Payment callback / webhook handler.
 *
 * GET  — eSewa / Khalti redirect back after payment
 * POST — Stripe webhook
 *
 * Hardened with:
 *  - Idempotency check (already CONFIRMED → skip re-processing)
 *  - Amount validation (paid amount must match stored total)
 *  - Duplicate transactionId guard
 *  - Atomic DB updates via $transaction
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPayment, type PaymentProvider } from "@/lib/payments/service";
import { Decimal } from "@prisma/client/runtime/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const provider  = searchParams.get("provider") as PaymentProvider | null;
  const orderId   = searchParams.get("orderId");

  if (!provider || !orderId) {
    return NextResponse.redirect(`${APP_URL}/checkout?error=invalid_callback`);
  }

  const callbackParams: Record<string, string> = {};
  searchParams.forEach((value, key) => { callbackParams[key] = value; });

  try {
    const result = await verifyPayment({ provider, orderId, callbackParams });

    if (!result.success) {
      console.error("[PaymentCallback] Verification error:", result.error);
      return NextResponse.redirect(`${APP_URL}/checkout?error=verification_failed`);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { take: 1, orderBy: { createdAt: "asc" } } },
    });

    if (!order) {
      return NextResponse.redirect(`${APP_URL}/checkout?error=order_not_found`);
    }

    // ── Idempotency: already processed ──────────────────────────────────────
    if (order.status === "CONFIRMED" || order.status === "PROCESSING") {
      return NextResponse.redirect(
        `${APP_URL}/dashboard/orders?success=1&order=${order.orderNumber}`
      );
    }

    if (!result.paid) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "FAILED",
            statusHistory: {
              create: { status: "FAILED", note: `Payment failed via ${provider}` },
            },
          },
        }),
        ...(order.payments[0]
          ? [prisma.payment.update({
              where: { id: order.payments[0].id },
              data: { status: "FAILED", errorMessage: "Provider reported payment not completed" },
            })]
          : []),
      ]);
      return NextResponse.redirect(
        `${APP_URL}/checkout?error=payment_failed&order=${order.orderNumber}`
      );
    }

    // ── Amount validation ────────────────────────────────────────────────────
    if (result.amount !== undefined) {
      const paid = new Decimal(result.amount);
      if (!paid.equals(order.total)) {
        console.error(
          `[PaymentCallback] Amount mismatch on ${orderId}: ` +
          `expected=${order.total} received=${paid}`
        );
        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: {
              status: "FAILED",
              statusHistory: {
                create: {
                  status: "FAILED",
                  note: `Amount mismatch: expected Rs.${order.total}, received Rs.${paid}`,
                },
              },
            },
          }),
          ...(order.payments[0]
            ? [prisma.payment.update({
                where: { id: order.payments[0].id },
                data: {
                  status: "FAILED",
                  errorMessage: `Amount mismatch: expected ${order.total}, got ${paid}`,
                },
              })]
            : []),
        ]);
        return NextResponse.redirect(`${APP_URL}/checkout?error=amount_mismatch`);
      }
    }

    // ── Duplicate transactionId guard ────────────────────────────────────────
    const txnId = result.transactionId ?? result.providerRef ?? null;
    if (txnId) {
      const dup = await prisma.payment.findFirst({
        where: { providerPaymentId: txnId, orderId: { not: orderId } },
      });
      if (dup) {
        console.error(`[PaymentCallback] Duplicate transactionId ${txnId}`);
        return NextResponse.redirect(`${APP_URL}/checkout?error=duplicate_transaction`);
      }
    }

    // ── Confirm order ────────────────────────────────────────────────────────
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          statusHistory: {
            create: {
              status: "PROCESSING",
              note: `Payment confirmed via ${provider}${txnId ? ` (${txnId})` : ""}`,
            },
          },
        },
      }),
      ...(order.payments[0]
        ? [prisma.payment.update({
            where: { id: order.payments[0].id },
            data: {
              status: "COMPLETED",
              providerPaymentId: txnId,
              paidAt: new Date(),
            },
          })]
        : []),
    ]);

    return NextResponse.redirect(
      `${APP_URL}/dashboard/orders/${orderId}?placed=1`
    );
  } catch (err) {
    console.error("[PaymentCallback] Unexpected error:", err);
    return NextResponse.redirect(`${APP_URL}/checkout?error=server_error`);
  }
}

// ── Stripe webhook ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const provider = searchParams.get("provider");

  if (provider !== "STRIPE") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const sig           = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2024-12-18.acacia" as any,
    });

    const rawBody = await req.text();
    const event   = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const stripeSession = event.data.object;
      const orderId = stripeSession.metadata?.orderId;
      if (!orderId) return NextResponse.json({ received: true });

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: { take: 1, orderBy: { createdAt: "asc" } } },
      });

      if (!order) return NextResponse.json({ received: true });

      // Idempotency
      if (order.status === "PROCESSING" || order.status === "CONFIRMED") {
        return NextResponse.json({ received: true });
      }

      // Amount validation (Stripe amounts are in paisa/cents)
      const stripePaid = new Decimal(stripeSession.amount_total ?? 0).dividedBy(100);
      if (!stripePaid.equals(order.total)) {
        console.error(`[StripeWebhook] Amount mismatch: expected ${order.total}, got ${stripePaid}`);
        return NextResponse.json({ received: true }); // Don't reject webhook, just log
      }

      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            status: "PROCESSING",
            statusHistory: {
              create: {
                status: "PROCESSING",
                note: `Stripe webhook: payment completed (${stripeSession.payment_intent})`,
              },
            },
          },
        }),
        ...(order.payments[0]
          ? [prisma.payment.update({
              where: { id: order.payments[0].id },
              data: {
                status: "COMPLETED",
                providerPaymentId: stripeSession.payment_intent as string ?? null,
                paidAt: new Date(),
              },
            })]
          : []),
      ]);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[StripeWebhook]", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
