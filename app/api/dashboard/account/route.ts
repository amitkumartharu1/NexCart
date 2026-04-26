/**
 * DELETE /api/dashboard/account
 * Permanently deletes the authenticated user's account and all associated data.
 *
 * Since all relations use onDelete: Cascade in the Prisma schema,
 * deleting the user automatically removes: orders, cart, wishlist, reviews,
 * addresses, sessions, notifications, support tickets, and audit logs.
 *
 * Requires password confirmation for credential accounts.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/security/password";
import { rateLimit } from "@/lib/security/rate-limit";
import { z } from "zod";

const Schema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion"),
});

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit: max 5 attempts per user per hour (prevent timing attacks on password)
  const rl = await rateLimit("delete_account", session.user.id, { max: 5, windowSecs: 3600 }).catch(() => ({ success: true }));
  if (!rl.success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // For credential accounts, verify password before deleting
  if (user.passwordHash) {
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 403 }
      );
    }
  }

  try {
    // All related records are cascade-deleted by Prisma/PostgreSQL FK onDelete: Cascade
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (err) {
    console.error("[DELETE /api/dashboard/account]", err);
    return NextResponse.json(
      { error: "Failed to delete account. Please contact support." },
      { status: 500 }
    );
  }
}
