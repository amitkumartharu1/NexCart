/**
 * Edge-compatible Auth.js configuration.
 *
 * This file MUST NOT import any Node.js-only modules:
 * - No prisma / pg / database drivers
 * - No argon2 / bcrypt
 * - No crypto (Node.js built-in)
 * - No fs, path, etc.
 *
 * It is used by:
 * - middleware.ts  (runs on Edge runtime)
 *
 * The full auth config (auth.ts) extends this with Prisma adapter,
 * Credentials provider, and database callbacks — all Node.js runtime only.
 */

import type { NextAuthConfig } from "next-auth";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"]);

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "30") * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },

  // No providers here — added in auth.ts (Node.js only)
  providers: [],

  callbacks: {
    /**
     * authorized — runs on every request matched by middleware.
     * Called with the JWT token already decoded (edge-safe).
     * Returns true to allow, false/redirect to block.
     */
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const isAuthenticated = !!auth?.user;
      const role = auth?.user?.role as string | undefined;

      const isAdminRoute = pathname.startsWith("/admin");
      const isProtectedRoute =
        pathname.startsWith("/dashboard") || pathname.startsWith("/checkout");
      const isAuthPage =
        pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/register") ||
        pathname.startsWith("/auth/forgot-password");

      // Force suspended accounts to suspended page
      if (isAuthenticated && (auth as { error?: string }).error === "AccountSuspended") {
        return Response.redirect(new URL("/auth/suspended", nextUrl));
      }

      // Admin routes
      if (isAdminRoute) {
        if (!isAuthenticated) {
          const url = new URL("/auth/login", nextUrl);
          url.searchParams.set("callbackUrl", pathname);
          return Response.redirect(url);
        }
        if (!role || !ADMIN_ROLES.has(role)) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Protected customer routes
      if (isProtectedRoute) {
        if (!isAuthenticated) {
          const url = new URL("/auth/login", nextUrl);
          url.searchParams.set("callbackUrl", pathname);
          return Response.redirect(url);
        }
        return true;
      }

      // Auth pages — redirect if already logged in
      if (isAuthPage && isAuthenticated) {
        const dest =
          role && ADMIN_ROLES.has(role)
            ? "/admin/dashboard"
            : "/dashboard/profile";
        return Response.redirect(new URL(dest, nextUrl));
      }

      return true;
    },

    // JWT and session callbacks live here so they work in both Edge and Node
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.emailVerified =
          (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as import("@prisma/client").UserRole;
      if (token.emailVerified !== undefined) {
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      if (token.error) {
        (session as { error?: string }).error = token.error as string;
      }
      return session;
    },
  },

  trustHost: true,
};
