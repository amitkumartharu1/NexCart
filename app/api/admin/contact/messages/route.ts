/**
 * /api/admin/contact/messages
 * GET    — list all messages (with filter/search/pagination)
 * PATCH  — mark read, mark replied, add admin note
 * DELETE — permanently delete a message
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED = ["SUPER_ADMIN", "ADMIN", "MANAGER"] as const;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ALLOWED.includes(session.user.role as any)) return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filter = req.nextUrl.searchParams.get("filter") ?? "";
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const page   = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit  = 50;

  const where: any = {};
  if (filter === "unread")   where.isRead    = false;
  if (filter === "read")     where.isRead    = true;
  if (filter === "replied")  where.isReplied = true;

  if (search) {
    where.OR = [
      { name:    { contains: search, mode: "insensitive" } },
      { email:   { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);

  const unreadCount = await prisma.contactMessage.count({ where: { isRead: false } });

  return NextResponse.json({ messages, total, page, limit, unreadCount });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { id, isRead, isReplied, adminNote } = body;
  const data: any = {};
  if (isRead     !== undefined) data.isRead    = Boolean(isRead);
  if (isReplied  !== undefined) data.isReplied = Boolean(isReplied);
  if (adminNote  !== undefined) data.adminNote = adminNote?.trim() || null;

  try {
    const msg = await prisma.contactMessage.update({ where: { id }, data });
    return NextResponse.json({ message: msg });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
}
