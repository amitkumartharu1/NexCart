/**
 * NexCart Middleware — Edge Runtime
 *
 * Uses auth.config.ts (edge-safe, no Node.js deps).
 * Route protection logic lives in authConfig.callbacks.authorized.
 *
 * DO NOT import prisma, pg, argon2, bcrypt, or crypto here.
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public folder (images, icons, models, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|icons|images|models).*)",
  ],
};
