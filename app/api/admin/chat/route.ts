import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

// GET /api/admin/chat — paginated conversation list with search + filter
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp      = req.nextUrl.searchParams;
  const status  = sp.get("status")  ?? "";
  const channel = sp.get("channel") ?? "";
  const search  = sp.get("search")  ?? "";
  const unread  = sp.get("unread")  === "true";
  const page    = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit   = 20;

  const where: Record<string, unknown> = {};
  if (status)  where["status"]  = status;
  if (channel) where["channel"] = channel;
  if (unread)  where["isRead"]  = false;
  if (search)  where["OR"] = [
    { name:  { contains: search, mode: "insensitive" } },
    { phone: { contains: search } },
    { email: { contains: search, mode: "insensitive" } },
  ];

  const [conversations, total, unreadCount] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 }, // latest message preview
        _count:   { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.conversation.count({ where }),
    prisma.conversation.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({ conversations, total, unreadCount, page, limit });
}

// PATCH /api/admin/chat — bulk update status / mark read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as {
    id?: string;
    status?: string;
    isRead?: boolean;
    adminReply?: string;
  };

  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (body.status  !== undefined) updateData["status"]  = body.status;
  if (body.isRead  !== undefined) updateData["isRead"]  = body.isRead;

  await prisma.conversation.update({ where: { id: body.id }, data: updateData });

  // Admin can inject a reply message into the conversation
  if (body.adminReply?.trim()) {
    await prisma.chatMessage.create({
      data: {
        conversationId: body.id,
        role:           "assistant",
        content:        body.adminReply.trim(),
        metadata:       { adminSent: true, adminId: session.user.id },
      },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/chat — delete conversation
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = (await req.json()) as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.conversation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
