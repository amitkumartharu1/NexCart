/**
 * Full Auth.js v5 configuration — Node.js runtime only.
 *
 * Extends auth.config.ts with:
 * - Prisma adapter (requires pg driver)
 * - Credentials provider (requires argon2/bcrypt)
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
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { auditLoginAttempt } from "@/lib/security/audit";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "./auth.config";
import type { UserRole } from "@prisma/client";

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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request?.headers?.get?.("x-forwarded-for") ??
          request?.headers?.get?.("x-real-ip") ??
          null;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true,
            status: true,
            emailVerified: true,
            passwordHash: true,
          },
        });

        if (!user || !user.passwordHash) {
          await auditLoginAttempt({
            email,
            success: false,
            ipAddress: ip,
            reason: "user_not_found",
          });
          return null;
        }

        if (user.status === "SUSPENDED") {
          await auditLoginAttempt({
            userId: user.id,
            email,
            success: false,
            ipAddress: ip,
            reason: "account_suspended",
          });
          throw new Error("AccountSuspended");
        }

        if (user.status === "INACTIVE") {
          await auditLoginAttempt({
            userId: user.id,
            email,
            success: false,
            ipAddress: ip,
            reason: "account_inactive",
          });
          throw new Error("AccountInactive");
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await auditLoginAttempt({
            userId: user.id,
            email,
            success: false,
            ipAddress: ip,
            reason: "invalid_password",
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), lastLoginIp: ip },
        });

        await auditLoginAttempt({
          userId: user.id,
          email,
          success: true,
          ipAddress: ip,
        });

        return {
          id: user.id,
          email: user.email,
          name:
            user.name ??
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          image: user.image,
          role: user.role,
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
            clientId: process.env.AUTH_GOOGLE_ID,
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
      // Initial sign-in
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "CUSTOMER";
        token.emailVerified =
          (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }

      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Refresh role from DB every 5 minutes to pick up role/status changes
      if (token.id && !user) {
        const now = Date.now();
        const lastRefresh = (token.lastRoleRefresh as number) ?? 0;
        if (now - lastRefresh > 5 * 60 * 1000) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            if (dbUser.status === "SUSPENDED") {
              return { ...token, error: "AccountSuspended" };
            }
          }
          token.lastRoleRefresh = now;
        }
      }

      return token;
    },
  },

  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const actorId = token?.id as string | undefined;
      if (actorId) {
        try {
          await prisma.auditLog.create({
            data: { actorId, action: "LOGOUT", resource: "Session" },
          });
        } catch {
          // Non-critical
        }
      }
    },

    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            role: "CUSTOMER",
            status: "ACTIVE",
            emailVerified: new Date(),
          },
        });
      }
    },
  },

  debug: false,
});
