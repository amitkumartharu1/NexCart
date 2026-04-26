/**
 * POST /api/auth/forgot-password
 * Generates a 6-digit OTP, stores it hashed in the DB, and sends it via Gmail SMTP.
 * The OTP is stored in passwordResetToken as "OTP:<hash>" so we can distinguish it
 * from a full reset token, and expires after 10 minutes.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendMail, otpEmailHtml } from "@/lib/email/smtp";

const Schema = z.object({
  email: z.string().email(),
});

function generateOtp(): string {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  // Always return success to prevent email enumeration
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, status: true },
    });

    if (user && user.status === "ACTIVE") {
      const otp = generateOtp();
      const hashed = hashOtp(otp);
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: `OTP:${hashed}`,
          passwordResetExpiry: expiry,
        },
      });

      // Send email (non-blocking — don't fail the request if email fails)
      await sendMail({
        to: email,
        subject: "Your NexCart Password Reset Code",
        html: otpEmailHtml(otp, 10),
        text: `Your NexCart password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
      }).catch((err) => {
        console.error("[forgot-password] Email send failed:", err);
      });
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, you'll receive a 6-digit OTP shortly.",
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    // Still return success to prevent enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, you'll receive a 6-digit OTP shortly.",
    });
  }
}
