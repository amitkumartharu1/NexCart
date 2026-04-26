/**
 * POST /api/auth/reset-password
 * Accepts the reset token (from verify-otp) + new password, updates the user's password.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { z } from "zod";

const Schema = z.object({
  resetToken: z.string().min(10),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { resetToken, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: `RESET:${resetToken}`,
      passwordResetExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "This reset session has expired. Please start over." },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ success: true, message: "Password updated successfully. You can now sign in." });
}
