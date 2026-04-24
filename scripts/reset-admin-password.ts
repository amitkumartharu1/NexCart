/**
 * One-time script to reset the admin password.
 * Run: npx tsx scripts/reset-admin-password.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/security/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@nexcart.com";
const newPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@NexCart2024!";

async function main() {
  const hash = await hashPassword(newPassword);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: hash, status: "ACTIVE" },
    select: { email: true, role: true },
  });
  console.log(`✅ Password reset for ${user.email} (${user.role})`);
  console.log(`   Login with: ${email} / ${newPassword}`);
}

main()
  .catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
