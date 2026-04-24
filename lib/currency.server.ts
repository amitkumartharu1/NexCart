/**
 * Currency — server-only DB access.
 *
 * This file imports Prisma and may only be used in:
 * - Server Components
 * - Route Handlers (app/api/*)
 * - Server Actions
 *
 * Never import this in a Client Component or any file that is also
 * imported by a Client Component.
 */

import { prisma } from "@/lib/db/prisma";
import type { CurrencyCode } from "@/lib/currency";

/**
 * Reads the active currency from SiteSettings.
 * Falls back to USD if the setting is missing or the DB is unreachable.
 */
export async function getGlobalCurrency(): Promise<CurrencyCode> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { key: "currency" },
      select: { value: true },
    });
    return row?.value === "NPR" ? "NPR" : "USD";
  } catch {
    return "USD";
  }
}
