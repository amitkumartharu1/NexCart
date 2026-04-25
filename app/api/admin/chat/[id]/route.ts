import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

// GET /api/admin/chat/[id] — full conversation thread
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const conversation = await prisma.conversation.findUnique({
    where:   { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Mark as read when admin views it
  if (!conversation.isRead) {
    await prisma.conversation.update({ where: { id }, data: { isRead: true } });
  }

  return NextResponse.json({ conversation });
}
