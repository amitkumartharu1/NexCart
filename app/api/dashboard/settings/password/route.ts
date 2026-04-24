import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, hashPassword } from "@/lib/security/password";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return NextResponse.json({ error: "No password set" }, { status: 400 });
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  const hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } });
  return NextResponse.json({ success: true });
}
