import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { initiatePayment } from "@/lib/payments/service";
import { assertValidTransition } from "@/lib/orders/transitions";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Input schema — prices are NEVER trusted from the client ─────────────────
const CheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(),
      quantity: z.number().int().positive().max(100),
    })
  ).min(1),
  shippingAddress: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().default("Nepal"),
  }),
  paymentMethod: z.enum(["STRIPE", "ESEWA", "KHALTI", "KHALTI_QR", "COD", "BANK_TRANSFER"]),
  notes: z.string().optional(),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NC-${timestamp}-${random}`;
}

/** Round Decimal to 2dp */
function round2(d: Decimal): Decimal {
  return new Decimal(d.toFixed(2));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { items, shippingAddress, paymentMethod, notes } = parsed.data;

  // ─── 1. Fetch pricing settings (server-side) ─────────────────────────────
  const settingRows = await prisma.siteSettings.findMany({
    where: { key: { in: ["shipping_mode", "shipping_cost", "tax_rate"] } },
    select: { key: true, value: true },
  });
  const sMap = Object.fromEntries(settingRows.map((r) => [r.key, r.value ?? ""]));

  const shippingMode    = sMap["shipping_mode"] || "paid";   // "free" | "paid"
  const shippingFlatFee = new Decimal(sMap["shipping_cost"] || "150");
  const taxRatePct      = new Decimal(sMap["tax_rate"]      || "13"); // e.g. 13 = 13%

  // ─── 2. Verify stock + fetch authoritative prices from DB ─────────────────
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    include: {
      inventory: { select: { quantity: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Product ${item.productId} is unavailable` },
        { status: 400 }
      );
    }
    const available = product.inventory?.quantity ?? 0;
    if (available < item.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for "${product.name}" — ${available} left, ${item.quantity} requested`,
        },
        { status: 400 }
      );
    }
  }

  // ─── 3. Compute financials server-side (never trust client prices) ────────
  let subtotal = new Decimal(0);
  for (const item of items) {
    const product = productMap.get(item.productId)!;
    subtotal = subtotal.plus(product.basePrice.times(item.quantity));
  }
  subtotal = round2(subtotal);

  // VAT is INCLUSIVE — extract from subtotal for display; total = subtotal + shipping only
  const taxAmount = round2(subtotal.minus(subtotal.dividedBy(new Decimal(1).plus(taxRatePct.dividedBy(100)))));

  const shippingFee = shippingMode === "free" ? new Decimal(0) : shippingFlatFee;

  const totalAmount = round2(subtotal.plus(shippingFee));

  // ─── 4. Map payment method ────────────────────────────────────────────────
  const methodMap: Record<string, "STRIPE" | "ESEWA" | "KHALTI" | "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "OTHER"> = {
    STRIPE:        "STRIPE",
    ESEWA:         "ESEWA",
    KHALTI:        "KHALTI",
    KHALTI_QR:     "KHALTI",      // QR scan → stored as KHALTI, no gateway redirect
    COD:           "CASH_ON_DELIVERY",
    BANK_TRANSFER: "BANK_TRANSFER",
    OTHER:         "OTHER",
  };
  const dbPaymentMethod = methodMap[paymentMethod];

  // ─── 5. Atomic order creation ─────────────────────────────────────────────
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Re-check stock inside transaction to prevent race conditions
    for (const item of items) {
      const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
      if (!inv || inv.quantity < item.quantity) {
        throw new Error(`Race condition: insufficient stock for product ${item.productId}`);
      }
    }

    // Create shipping address
    const nameParts = shippingAddress.name.trim().split(" ");
    const address = await tx.address.create({
      data: {
        userId: session.user.id,
        label: "Shipping",
        firstName: nameParts[0] ?? shippingAddress.name,
        lastName: nameParts.slice(1).join(" ") || "",
        addressLine1: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.zip ?? "",
        country: shippingAddress.country,
        phone: shippingAddress.phone,
      },
    });

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        addressId: address.id,
        status: "PENDING",
        subtotal,
        taxAmount,
        shippingAmount: shippingFee,
        discountAmount: new Decimal(0),
        total: totalAmount,
        currency: "NPR",
        notes: notes ?? null,
        ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
              productId: item.productId,
              variantId: item.variantId ?? null,
              name: product.name,
              image: product.images[0]?.url ?? null,
              quantity: item.quantity,
              unitPrice: product.basePrice,
              totalPrice: round2(product.basePrice.times(item.quantity)),
            };
          }),
        },
        statusHistory: {
          create: {
            status: "PENDING",
            note: `Order placed via ${paymentMethod}`,
            createdBy: session.user.id,
          },
        },
      },
    });

    // Deduct inventory atomically
    for (const item of items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Mark out-of-stock products
    for (const item of items) {
      const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
      if (inv && inv.quantity <= 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { status: "OUT_OF_STOCK" },
        });
      }
    }

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        method: dbPaymentMethod,
        provider: paymentMethod,
        status: "UNPAID",
        amount: totalAmount,
        currency: "NPR",
      },
    });

    // Clear DB cart
    await tx.cart.deleteMany({ where: { userId: session.user.id } });

    return newOrder;
  });

  // ─── 6. Initiate external payment (outside transaction — network call) ────
  // Manual/offline methods: ESEWA QR, KHALTI QR, COD, BANK_TRANSFER — no gateway redirect
  const manualMethods = ["COD", "ESEWA", "KHALTI_QR", "BANK_TRANSFER"] as const;
  if (!manualMethods.includes(paymentMethod as typeof manualMethods[number])) {
    const paymentResult = await initiatePayment({
      provider: dbPaymentMethod as "STRIPE" | "KHALTI",
      amountCents: Math.round(Number(totalAmount) * 100),
      currency: "NPR",
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: shippingAddress.email,
      customerName: shippingAddress.name,
      returnUrl: `${APP_URL}/api/payments/callback?provider=${dbPaymentMethod}&orderId=${order.id}`,
      failureUrl: `${APP_URL}/checkout?error=payment_failed`,
    });

    if (paymentResult.redirectUrl) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        redirectUrl: paymentResult.redirectUrl,
      });
    }

    if (!paymentResult.success) {
      console.error("[Checkout] Payment initiation failed:", paymentResult.error);
    }
  }

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: totalAmount.toNumber(),
    paymentMethod,
  });
}
