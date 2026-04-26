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
    // All related records cascade-delete via Prisma onDelete: Cascade
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/users]", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
