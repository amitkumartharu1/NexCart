/**
 * Auth.js v5 configuration for NexCart.
 *
 * Exports: auth, handlers, signIn, signOut
 * - auth()       → get session in Server Components / API routes
 * - handlers     → GET/POST handlers for /api/auth/[...nextauth]
 * - signIn/Out   → call from Server Actions
 */

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { auditLoginAttempt } from "@/lib/security/audit";
import { loginSchema } from "@/lib/validations/auth";
import type { UserRole } from "@prisma/client";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
    maxAge: parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "30") * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },

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
        // Extract IP for audit logging
        const ip =
          request?.headers?.get?.("x-forwarded-for") ??
          request?.headers?.get?.("x-real-ip") ??
          null;

        // Validate input shape
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;

        // Find user
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

        // Check account status
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

        // Verify password
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

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: ip,
          },
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
          name: user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),

    // -----------------------------------------------------------------
    // Google OAuth (enabled when env vars are set)
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
    // -------------------------------------------------------------------
    // jwt callback: persists role into the JWT token
    // Called every time a JWT is created or updated
    // -------------------------------------------------------------------
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in — attach role from user object
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: UserRole }).role ?? "CUSTOMER";
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }

      // Handle session update (called via update() from client)
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      // Refresh role from DB on each request (keeps role changes live)
      // Only do this every 5 minutes to avoid hammering DB
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
              // Force sign-out by invalidating token
              return { ...token, error: "AccountSuspended" };
            }
          }
          token.lastRoleRefresh = now;
        }
      }

      return token;
    },

    // -------------------------------------------------------------------
    // session callback: exposes token data to useSession() / auth()
    // -------------------------------------------------------------------
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.role) {
        session.user.role = token.role as UserRole;
      }
      if (token.emailVerified !== undefined) {
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      if (token.error) {
        (session as { error?: string }).error = token.error as string;
      }
      return session;
    },

    // -------------------------------------------------------------------
    // signIn callback: runs after successful OAuth sign-in
    // Used to set default role for new OAuth users
    // -------------------------------------------------------------------
    async signIn({ user, account }) {
      if (account?.provider !== "credentials" && user.email) {
        // Ensure OAuth users have CUSTOMER role and ACTIVE status
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
      return true;
    },
  },

  events: {
    async signOut(message) {
      // Log sign-out in audit trail (JWT strategy passes token)
      const token = "token" in message ? message.token : null;
      const actorId = token?.id as string | undefined;
      if (actorId) {
        try {
          await prisma.auditLog.create({
            data: {
              actorId,
              action: "LOGOUT",
              resource: "Session",
            },
          });
        } catch {
          // Non-critical
        }
      }
    },
  },

  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
