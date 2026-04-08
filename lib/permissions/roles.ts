/**
 * Role-Based Access Control (RBAC) for NexCart.
 *
 * Centralizes ALL permission logic. Never scatter role checks across files.
 *
 * Usage:
 *   can(session.user.role, "product:create")   → boolean
 *   requirePermission(session.user.role, "admin:users:manage")  → throws if denied
 */

import { UserRole } from "@prisma/client";

// =============================================================================
// Permission definitions
// =============================================================================

type Permission =
  // Products
  | "product:view"
  | "product:create"
  | "product:update"
  | "product:delete"
  | "product:publish"
  | "product:manage_inventory"
  // Services
  | "service:view"
  | "service:create"
  | "service:update"
  | "service:delete"
  | "service:publish"
  // Orders
  | "order:view_own"
  | "order:view_all"
  | "order:update_status"
  | "order:cancel"
  | "order:refund"
  // Bookings
  | "booking:view_own"
  | "booking:view_all"
  | "booking:update_status"
  | "booking:cancel"
  // Categories & Brands
  | "category:manage"
  | "brand:manage"
  // Coupons
  | "coupon:view"
  | "coupon:create"
  | "coupon:update"
  | "coupon:delete"
  // Content
  | "content:manage_banners"
  | "content:manage_homepage"
  | "content:manage_faqs"
  | "content:manage_blog"
  | "content:manage_testimonials"
  // Users
  | "user:view"
  | "user:update"
  | "user:suspend"
  | "user:delete"
  | "user:manage_roles"
  // Reviews
  | "review:moderate"
  | "review:delete"
  // Support
  | "ticket:view_all"
  | "ticket:respond"
  | "ticket:assign"
  // SEO
  | "seo:manage"
  // Analytics
  | "analytics:view"
  // Security
  | "security:view_logs"
  | "security:view_audit"
  // Settings
  | "settings:view"
  | "settings:update"
  | "settings:danger"
  // Admin management (super admin only)
  | "admin:manage_admins"
  | "admin:export_data"
  | "admin:backup";

// =============================================================================
// Role → Permission mapping
// =============================================================================

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // All permissions
    "product:view", "product:create", "product:update", "product:delete", "product:publish", "product:manage_inventory",
    "service:view", "service:create", "service:update", "service:delete", "service:publish",
    "order:view_own", "order:view_all", "order:update_status", "order:cancel", "order:refund",
    "booking:view_own", "booking:view_all", "booking:update_status", "booking:cancel",
    "category:manage", "brand:manage",
    "coupon:view", "coupon:create", "coupon:update", "coupon:delete",
    "content:manage_banners", "content:manage_homepage", "content:manage_faqs", "content:manage_blog", "content:manage_testimonials",
    "user:view", "user:update", "user:suspend", "user:delete", "user:manage_roles",
    "review:moderate", "review:delete",
    "ticket:view_all", "ticket:respond", "ticket:assign",
    "seo:manage",
    "analytics:view",
    "security:view_logs", "security:view_audit",
    "settings:view", "settings:update", "settings:danger",
    "admin:manage_admins", "admin:export_data", "admin:backup",
  ],

  ADMIN: [
    "product:view", "product:create", "product:update", "product:delete", "product:publish", "product:manage_inventory",
    "service:view", "service:create", "service:update", "service:delete", "service:publish",
    "order:view_own", "order:view_all", "order:update_status", "order:cancel", "order:refund",
    "booking:view_own", "booking:view_all", "booking:update_status", "booking:cancel",
    "category:manage", "brand:manage",
    "coupon:view", "coupon:create", "coupon:update", "coupon:delete",
    "content:manage_banners", "content:manage_homepage", "content:manage_faqs", "content:manage_blog", "content:manage_testimonials",
    "user:view", "user:update", "user:suspend",
    "review:moderate", "review:delete",
    "ticket:view_all", "ticket:respond", "ticket:assign",
    "seo:manage",
    "analytics:view",
    "security:view_logs", "security:view_audit",
    "settings:view", "settings:update",
    "admin:export_data",
  ],

  MANAGER: [
    "product:view", "product:create", "product:update", "product:publish", "product:manage_inventory",
    "service:view", "service:create", "service:update", "service:publish",
    "order:view_all", "order:update_status", "order:cancel",
    "booking:view_all", "booking:update_status", "booking:cancel",
    "category:manage", "brand:manage",
    "coupon:view", "coupon:create", "coupon:update",
    "content:manage_banners", "content:manage_homepage", "content:manage_faqs",
    "user:view",
    "review:moderate",
    "ticket:view_all", "ticket:respond",
    "analytics:view",
    "settings:view",
  ],

  STAFF: [
    "product:view", "product:update", "product:manage_inventory",
    "service:view", "service:update",
    "order:view_all", "order:update_status",
    "booking:view_all", "booking:update_status",
    "coupon:view",
    "user:view",
    "review:moderate",
    "ticket:view_all", "ticket:respond",
  ],

  CUSTOMER: [
    "order:view_own",
    "booking:view_own",
  ],
};

// =============================================================================
// Public API
// =============================================================================

export function can(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

export function canAny(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export function canAll(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => can(role, p));
}

export function requirePermission(
  role: UserRole,
  permission: Permission
): void {
  if (!can(role, permission)) {
    throw new Error(
      `Access denied: role '${role}' does not have permission '${permission}'`
    );
  }
}

export function isAdminRole(role: UserRole): boolean {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(role);
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export { type Permission, UserRole };
