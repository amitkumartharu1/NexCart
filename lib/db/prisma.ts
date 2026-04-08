/**
 * Prisma Client singleton — Node.js runtime only.
 *
 * Prisma 7 requires a driver adapter. We use @prisma/adapter-pg with pg.
 * This file MUST NOT be imported from middleware or any Edge-runtime code.
 */

// Hard fail if somehow loaded in Edge runtime
if (typeof (globalThis as Record<string, unknown>)["EdgeRuntime"] !== "undefined") {
  throw new Error(
    "[NexCart] lib/db/prisma.ts was imported in the Edge runtime. " +
      "This is a bug — do not import database code from middleware or Edge routes."
  );
}

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
        'Add it to your .env file: DATABASE_URL="postgresql://user:pass@localhost:5432/nexcart"'
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
