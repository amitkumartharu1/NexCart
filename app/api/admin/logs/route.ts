import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });
  // Normalize to a consistent shape for the page
  const normalized = logs.map(l => ({
    id: l.id,
    action: l.action,
    entityType: l.resource,
    entityId: l.resourceId,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt,
    user: l.actor ? { name: l.actor.name, email: l.actor.email } : null,
  }));
  return NextResponse.json({ logs: normalized });
}
