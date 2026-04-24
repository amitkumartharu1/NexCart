/**
 * GET /api/orders/[id]/poll
 * Lightweight polling endpoint for real-time order status updates.
 * Returns minimal data — clients poll every 5–10 s.
 *
 * Cache-Control: no-store so the browser always hits the server.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/orders/transitions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      // Admins can poll any order; customers only their own
      ...(!["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(session.user.role ?? "")
        ? { userId: session.user.id }
        : {}),
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      updatedAt: true,
      payments: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { status: true, method: true, manualTransactionId: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: ORDER_STATUS_LABEL[order.status],
      statusColor: ORDER_STATUS_COLOR[order.status],
      updatedAt: order.updatedAt,
      payment: order.payments[0] ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
