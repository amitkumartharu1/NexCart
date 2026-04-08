/**
 * Session helpers for Server Components, Server Actions, and API routes.
 *
 * Usage:
 *   const session = await getSession();           // null if not logged in
 *   const user    = await requireAuth();           // throws redirect if not logged in
 *   const admin   = await requireAdmin();          // throws redirect if not admin
 *   const user    = await requirePermission("product:create");
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { can, isAdminRole } from "@/lib/permissions/roles";
import type { Permission } from "@/lib/permissions/roles";
import type { UserRole } from "@prisma/client";
import type { Session } from "next-auth";

export type AuthSession = Session & {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    emailVerified: Date | null;
  };
};

// Get session — returns null if not authenticated
export async function getSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AuthSession;
}

// Get session or redirect to login
export async function requireAuth(
  callbackPath?: string
): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    const loginUrl = callbackPath
      ? `/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`
      : "/auth/login";
    redirect(loginUrl);
  }
  return session;
}

// Require admin role or redirect home
export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (!isAdminRole(session.user.role)) {
    redirect("/");
  }
  return session;
}

// Require a specific RBAC permission or throw
export async function requirePermission(
  permission: Permission,
  callbackPath?: string
): Promise<AuthSession> {
  const session = await requireAuth(callbackPath);
  if (!can(session.user.role, permission)) {
    // Return 403 behaviour — redirect to appropriate error
    if (isAdminRole(session.user.role)) {
      redirect("/admin/unauthorized");
    }
    redirect("/unauthorized");
  }
  return session;
}

// Get session for use in API route handlers — returns null without redirecting
export async function getApiSession(): Promise<AuthSession | null> {
  return getSession();
}
