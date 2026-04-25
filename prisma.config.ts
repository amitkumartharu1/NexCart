import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Pooled URL for runtime queries (used by PrismaClient via adapter-pg)
    url: process.env.DATABASE_URL!,
    // Direct (non-pooled) URL for migrations — required for Neon/PgBouncer
    ...(process.env.DIRECT_URL ? { directUrl: process.env.DIRECT_URL } : {}),
  },
});
