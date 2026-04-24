import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// GET /api/settings — public read-only settings for footer, social links, etc.
// Only exposes non-sensitive keys (group != "internal")
export async function GET() {
  const rows = await prisma.siteSettings.findMany({
    where: { NOT: { group: "internal" } },
  });

  const settings: Record<string, string | null> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings }, {
    headers: { "Cache-Control": "no-store" },
  });
}
