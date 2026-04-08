/**
 * Audit logging utility.
 * Records all significant business and security events to the database.
 *
 * Server-only.
 *
 * Usage:
 *   await audit({
 *     actorId: session.user.id,
 *     action: "UPDATE",
 *     resource: "Product",
 *     resourceId: productId,
 *     changes: { before: old, after: updated },
 *   });
 */

import { prisma } from "@/lib/db";
import type { AuditAction, UserRole } from "@prisma/client";

interface AuditInput {
  actorId?: string | null;
  actorRole?: UserRole | null;
  actorEmail?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  changes?: { before?: unknown; after?: unknown } | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        changes: input.changes
          ? JSON.parse(JSON.stringify(input.changes))
          : undefined,
        metadata: input.metadata
          ? JSON.parse(JSON.stringify(input.metadata))
          : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    // Audit log failures should never break the main flow
    console.error("[Audit] Failed to write audit log:", error);
  }
}

export async function auditLoginAttempt(input: {
  userId?: string | null;
  email: string;
  success: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
}): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        userId: input.userId ?? null,
        email: input.email,
        success: input.success,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        reason: input.reason ?? null,
      },
    });
  } catch (error) {
    console.error("[Audit] Failed to write login attempt:", error);
  }
}

export async function auditAdminAction(input: {
  userId: string;
  action: string;
  description: string;
  resource?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.adminActivityLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        description: input.description,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[Audit] Failed to write admin activity log:", error);
  }
}
