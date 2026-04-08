/**
 * Prisma Client singleton — Prisma 7 + driver adapter setup.
 *
 * Prisma 7 requires a driver adapter instead of reading DATABASE_URL
 * from the environment implicitly. We use @prisma/adapter-pg with the
 * standard `pg` package for PostgreSQL.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env file.\n" +
        "Example: DATABASE_URL=\"postgresql://postgres:password@localhost:5432/nexcart\""
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

// Prevent multiple Prisma client instances during Next.js hot reload in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
