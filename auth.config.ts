/**
 * Edge-compatible Auth.js configuration.
 *
 * STRICT RULE: This file must have ZERO imports that pull in Node.js modules.
 * No prisma, pg, argon2, bcrypt, crypto, fs, path — nothing.
 * The only allowed import is the type-only NextAuthConfig from next-auth.
 *
 * Used by:
 * - middleware.ts (Edge runtime)
 *
 * The full config (auth.ts) extends this with Prisma + Node.js providers.
 */

import type { NextAuthConfig } from "next-auth";

// Defined locally — do NOT import from @prisma/client here.
// That import would pull pg → Node.js crypto into the Edge bundle.
type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER";

const ADMIN_ROLES = new Set<string>(["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"]);

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "30") * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },

  providers: [],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const isAuthenticated = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      // Suspended accounts → suspended page
      if (isAuthenticated && (auth as { error?: string }).error === "AccountSuspended") {
        return Response.redirect(new URL("/auth/suspended", nextUrl));
      }

      // Admin routes
      if (pathname.startsWith("/admin")) {
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
      if (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout")) {
        if (!isAuthenticated) {
          const url = new URL("/auth/login", nextUrl);
          url.searchParams.set("callbackUrl", pathname);
          return Response.redirect(url);
        }
        return true;
      }

      // Auth pages — redirect away if already logged in
      if (
        pathname.startsWith("/auth/login") ||
        pathname.startsWith("/auth/register") ||
        pathname.startsWith("/auth/forgot-password")
      ) {
        if (isAuthenticated) {
          const dest =
            role && ADMIN_ROLES.has(role) ? "/admin/dashboard" : "/dashboard/profile";
          return Response.redirect(new URL(dest, nextUrl));
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
        token.emailVerified =
          (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role as string;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      // Cast locally — avoids importing @prisma/client which pulls in pg/crypto
      if (token.role) session.user.role = token.role as UserRole;
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
} satisfies NextAuthConfig;
