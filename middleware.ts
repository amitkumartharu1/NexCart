/**
 * NexCart Route Protection Middleware
 *
 * Runs at the Edge before every matched request.
 * Handles:
 * - Redirect unauthenticated users away from protected routes
 * - Redirect authenticated users away from auth pages
 * - Block non-admin roles from /admin/*
 * - Block suspended accounts
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/checkout"];

// Routes only accessible to admin roles
const ADMIN_PREFIXES = ["/admin"];

// Routes that redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
];

// Admin roles
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"]);

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & {
    auth: typeof req.auth;
  };
  const pathname = nextUrl.pathname;
  const isAuthenticated = !!session?.user;
  const userRole = session?.user?.role;

  // -------------------------------------------------------------------
  // Handle suspended accounts — force them to a suspended page
  // -------------------------------------------------------------------
  if (isAuthenticated && (session as { error?: string }).error === "AccountSuspended") {
    const suspendedUrl = new URL("/auth/suspended", nextUrl);
    return NextResponse.redirect(suspendedUrl);
  }

  // -------------------------------------------------------------------
  // Admin routes — require admin-level role
  // -------------------------------------------------------------------
  if (ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!userRole || !ADMIN_ROLES.has(userRole)) {
      // Authenticated but not admin — redirect to home
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------------
  // Protected customer routes
  // -------------------------------------------------------------------
  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/auth/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------------
  // Auth pages — redirect away if already logged in
  // -------------------------------------------------------------------
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      const dest =
        userRole && ADMIN_ROLES.has(userRole)
          ? "/admin/dashboard"
          : "/dashboard/profile";
      return NextResponse.redirect(new URL(dest, nextUrl));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     * - API routes that don't need auth (handled per-route)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|icons|images|models).*)",
  ],
};
