/**
 * NexCart Proxy — Edge Runtime
 * (Next.js 16 renamed "middleware" to "proxy")
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
     * Match all paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (image optimization)
     * - favicon.ico
     * - public folder (images, icons, models, etc.)
     * - api/auth      ← Auth.js route handler must handle these directly;
     *                   if the edge middleware intercepts /api/auth/* it
     *                   returns 404 because authConfig has no full handlers.
     */
    "/((?!_next/static|_next/image|favicon.ico|public|icons|images|models|api/auth).*)",
  ],
};
