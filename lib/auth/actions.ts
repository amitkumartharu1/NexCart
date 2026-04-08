"use server";

/**
 * Authentication Server Actions.
 * Handles registration, password reset, email verification.
 *
 * These are safe to call from client forms via useActionState.
 */

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/security/password";
import { generateSecureToken } from "@/lib/security/password";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { audit, auditLoginAttempt } from "@/lib/security/audit";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";
import { createSlug } from "@/lib/utils/slug";
import { verifyPassword } from "@/lib/security/password";
import { headers } from "next/headers";
import type { ActionResult } from "@/types";

// ---------------------------------------------------------------------------
// Helper: get client IP from request headers
// ---------------------------------------------------------------------------
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();

  // Rate limit by IP
  const rl = await rateLimit("register", ip, RATE_LIMITS.register);
  if (!rl.success) {
    return { success: false, error: "Too many registration attempts. Please wait and try again." };
  }

  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((e: import("zod").ZodIssue) => {
      const field = e.path[0] as string;
      fieldErrors[field] = e.message;
    });
    return { success: false, fieldErrors };
  }

  const { firstName, lastName, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Check duplicate
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    return { success: false, fieldErrors: { email: "An account with this email already exists." } };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate email verification token
  const emailVerifyToken = generateSecureToken();
  const emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Create user
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      passwordHash,
      role: "CUSTOMER",
      status: "PENDING_VERIFICATION",
      emailVerifyToken,
      emailVerifyExpiry,
    },
    select: { id: true, email: true },
  });

  // Audit
  await audit({
    actorId: user.id,
    action: "CREATE",
    resource: "User",
    resourceId: user.id,
    ipAddress: ip,
    metadata: { registrationMethod: "credentials" },
  });

  // TODO (Phase 2 extension): Send verification email
  // await sendVerificationEmail(user.email, emailVerifyToken);

  return {
    success: true,
    message: "Account created! Please check your email to verify your account.",
    data: { userId: user.id },
  };
}

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();

  const rl = await rateLimit("forgot_password", ip, RATE_LIMITS.forgotPassword);
  if (!rl.success) {
    return { success: false, error: "Too many requests. Please wait before trying again." };
  }

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: { email: "Please enter a valid email address." } };
  }

  const email = parsed.data.email.toLowerCase();

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true },
  });

  if (user && user.status === "ACTIVE") {
    const token = generateSecureToken();
    const expiry = new Date(
      Date.now() +
        parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS ?? "2") * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    // TODO (Phase 2 extension): Send reset email
    // await sendPasswordResetEmail(email, token);

    await audit({
      actorId: user.id,
      action: "PASSWORD_CHANGE",
      resource: "User",
      resourceId: user.id,
      ipAddress: ip,
      metadata: { step: "reset_requested" },
    });
  }

  // Always return success (prevent email enumeration)
  return {
    success: true,
    message: "If an account exists with that email, you will receive a reset link shortly.",
  };
}

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();

  const rl = await rateLimit("reset_password", ip, RATE_LIMITS.passwordReset);
  if (!rl.success) {
    return { success: false, error: "Too many attempts. Please wait before trying again." };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((e: import("zod").ZodIssue) => {
      fieldErrors[e.path[0] as string] = e.message;
    });
    return { success: false, fieldErrors };
  }

  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return {
      success: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
    };
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

  await audit({
    actorId: user.id,
    action: "PASSWORD_CHANGE",
    resource: "User",
    resourceId: user.id,
    ipAddress: ip,
    metadata: { step: "reset_completed" },
  });

  return { success: true, message: "Password updated successfully. You can now sign in." };
}

// ---------------------------------------------------------------------------
// Change Password (authenticated)
// ---------------------------------------------------------------------------
export async function changePasswordAction(
  userId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const ip = await getClientIp();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((e: import("zod").ZodIssue) => {
      fieldErrors[e.path[0] as string] = e.message;
    });
    return { success: false, fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: "Cannot change password for OAuth accounts." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { success: false, fieldErrors: { currentPassword: "Current password is incorrect." } };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await audit({
    actorId: userId,
    action: "PASSWORD_CHANGE",
    resource: "User",
    resourceId: userId,
    ipAddress: ip,
  });

  return { success: true, message: "Password changed successfully." };
}

// ---------------------------------------------------------------------------
// Verify Email
// ---------------------------------------------------------------------------
export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken: token,
      emailVerifyExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return { success: false, error: "This verification link is invalid or has expired." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpiry: null,
      status: "ACTIVE",
    },
  });

  return { success: true, message: "Email verified successfully. You can now sign in." };
}
