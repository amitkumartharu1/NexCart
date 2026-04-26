/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP and returns a short-lived reset token for use in the
 * password reset step (stored in passwordResetToken as "RESET:<random>").
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import crypto from "crypto";

const Schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid OTP format." }, { status: 400 });
  }

  const { email, otp } = parsed.data;
  const hashedOtp = hashOtp(otp);

  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      passwordResetToken: `OTP:${hashedOtp}`,
      passwordResetExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired OTP. Please request a new code." },
      { status: 400 }
    );
  }

  // OTP valid — generate a 15-minute reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: `RESET:${resetToken}`,
      passwordResetExpiry: resetExpiry,
    },
  });

  return NextResponse.json({ success: true, resetToken });
}
