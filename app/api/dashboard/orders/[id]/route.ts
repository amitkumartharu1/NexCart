import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id }, // ensure user owns this order
    select: {
      id: true,
      orderNumber: true,
      status: true,
      subtotal: true,
      taxAmount: true,
      shippingAmount: true,
      discountAmount: true,
      total: true,
      currency: true,
      notes: true,
      trackingNumber: true,
      trackingUrl: true,
      estimatedDelivery: true,
      deliveredAt: true,
      createdAt: true,
      address: {
        select: {
          firstName: true,
          lastName: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          sku: true,
          image: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
        },
      },
      payments: {
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          providerPaymentId: true,
          manualTransactionId: true,
          proofImage: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      statusHistory: {
        select: { status: true, note: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ order });
}
