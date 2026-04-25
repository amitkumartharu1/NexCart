/**
 * Full Auth.js v5 configuration — Node.js runtime only.
 *
 * Extends auth.config.ts with:
 * - Prisma adapter (requires pg driver)
 * - Credentials provider (requires bcryptjs)
 * - Google OAuth
 * - DB callbacks (role refresh, audit logging)
 *
 * Import from here in:
 * - Server Components
 * - Server Actions
 * - API routes
 * - app/api/auth/[...nextauth]/route.ts
 *
 * DO NOT import from middleware.ts — use auth.config.ts there.
 */

import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { auditLoginAttempt } from "@/lib/security/audit";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "./auth.config";
import type { UserRole } from "@prisma/client";

// ─── Typed credential errors (Auth.js v5) ─────────────────────────────────────
// Extending CredentialsSignin lets Auth.js surface the `code` in signIn() result.

class AccountSuspendedError extends CredentialsSignin {
  code = "AccountSuspended";
}

class AccountInactiveError extends CredentialsSignin {
  code = "AccountInactive";
}

// ─────────────────────────────────────────────────────────────────────────────

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [
    // -----------------------------------------------------------------
    // Credentials (email + password)
    // -----------------------------------------------------------------
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request?.headers?.get?.("x-forwarded-for") ??
          request?.headers?.get?.("x-real-ip") ??
          null;

        // Validate shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        let user: {
          id: string; email: string; name: string | null;
          firstName: string | null; lastName: string | null;
          image: string | null; role: UserRole; status: string;
          emailVerified: Date | null; passwordHash: string | null;
        } | null = null;

        try {
          user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true, email: true, name: true,
              firstName: true, lastName: true,
              image: true, role: true, status: true,
              emailVerified: true, passwordHash: true,
            },
          });
        } catch (dbErr) {
          console.error("[Auth] DB error during user lookup:", dbErr);
          return null;
        }

        if (!user || !user.passwordHash) {
          await auditLoginAttempt({ email, success: false, ipAddress: ip, reason: "user_not_found" });
          return null;
        }

        if (user.status === "SUSPENDED") {
          await auditLoginAttempt({ userId: user.id, email, success: false, ipAddress: ip, reason: "account_suspended" });
          throw new AccountSuspendedError();
        }

        if (user.status === "INACTIVE") {
          await auditLoginAttempt({ userId: user.id, email, success: false, ipAddress: ip, reason: "account_inactive" });
          throw new AccountInactiveError();
        }

        // Verify password
        let valid = false;
        try {
          valid = await verifyPassword(password, user.passwordHash);
        } catch (pwErr) {
          console.error("[Auth] Password verification error:", pwErr);
          return null;
        }

        if (!valid) {
          await auditLoginAttempt({ userId: user.id, email, success: false, ipAddress: ip, reason: "invalid_password" });
          return null;
        }

        // Update last login (non-blocking — don't let this fail the login)
        prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastLoginIp: ip },
        }).catch((err) => console.error("[Auth] Failed to update lastLoginAt:", err));

        await auditLoginAttempt({ userId: user.id, email, success: true, ipAddress: ip });

        return {
          id:           user.id,
          email:        user.email,
          name:         (user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()) || null,
          image:        user.image,
          role:         user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),

    // -----------------------------------------------------------------
    // Google OAuth
    // -----------------------------------------------------------------
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId:     process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  callbacks: {
    ...authConfig.callbacks,

    // Override jwt to also do DB role refresh (Node.js only — has prisma access)
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id           = user.id as string;
        token.role         = (user as { role?: UserRole }).role ?? "CUSTOMER";
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }

      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Refresh role from DB every 5 minutes to pick up role/status changes
      if (token.id && !user) {
        const now         = Date.now();
        const lastRefresh = (token.lastRoleRefresh as number) ?? 0;
        if (now - lastRefresh > 5 * 60 * 1000) {
          try {
            const dbUser = await prisma.user.findUnique({
              where:  { id: token.id as string },
              select: { role: true, status: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              if (dbUser.status === "SUSPENDED") {
                return { ...token, error: "AccountSuspended" };
              }
            }
          } catch {
            // Non-critical — keep existing token
          }
          token.lastRoleRefresh = now;
        }
      }

      return token;
    },
  },

  events: {
    async signOut(message) {
      const token   = "token" in message ? message.token : null;
      const actorId = token?.id as string | undefined;
      if (actorId) {
        prisma.auditLog
          .create({ data: { actorId, action: "LOGOUT", resource: "Session" } })
          .catch(() => {/* non-critical */});
      }
    },

    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        await prisma.user.upsert({
          where:  { email: user.email },
          update: {},
          create: {
            email:         user.email,
            name:          user.name,
            image:         user.image,
            role:          "CUSTOMER",
            status:        "ACTIVE",
            emailVerified: new Date(),
          },
        });
      }
    },
  },

  debug: false,
});
