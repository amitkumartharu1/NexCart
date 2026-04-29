import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role");

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        createdAt: true, image: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId, status, role } = await req.json();
  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(status && { status }), ...(role && { role }) },
  });
  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  // Cannot delete yourself
  if (userId === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  // Fetch target user to check role
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, email: true },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only SUPER_ADMIN can delete other SUPER_ADMINs or ADMINs
  if (
    target.role === "SUPER_ADMIN" ||
    (target.role === "ADMIN" && session.user.role !== "SUPER_ADMIN")
  ) {
    return NextResponse.json(
      { error: "You do not have permission to delete this user." },
      { status: 403 }
    );
  }

  try {
    // Use a transaction to delete all related records that don't have onDelete: Cascade
    // (Account, Session, Cart, Wishlist, CompareList, Notification, Address all have Cascade)
    await prisma.$transaction(async (tx) => {
      // Nullify bills created by this staff member (onDelete: SetNull on Bill.staffId)
      await tx.bill.updateMany({ where: { staffId: userId }, data: { staffId: null } });

      // Nullify admin activity logs for this user (onDelete: SetNull on AdminActivityLog.userId)
      await tx.adminActivityLog.updateMany({ where: { userId }, data: { userId: null } });

      // Delete or nullify records that use RESTRICT by default (no explicit cascade in schema)
      await tx.review.deleteMany({ where: { userId } });
      await tx.orderStatusHistory.deleteMany({
        where: { order: { userId } },
      });
      await tx.order.deleteMany({ where: { userId } });
      await tx.serviceBooking.deleteMany({ where: { userId } });
      await tx.ticketReply.deleteMany({ where: { ticket: { userId } } });
      await tx.supportTicket.deleteMany({ where: { userId } });

      // Now delete the user (Cascade handles: Account, Session, Cart, Wishlist,
      // CompareList, Notification, Address, LoginAttempt, AuditLog, etc.)
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/users]", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
