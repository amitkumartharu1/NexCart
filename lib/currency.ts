/**
 * Currency — pure types, constants, and formatting helpers.
 *
 * IMPORTANT: This file must stay free of ANY Node.js / Prisma imports.
 * It is imported by CurrencyProvider (a Client Component) and therefore
 * gets bundled for the browser. Keep it isomorphic.
 *
 * Server-only DB access lives in lib/currency.server.ts.
 */

// =============================================================================
// Types & constants
// =============================================================================

export type CurrencyCode = "USD" | "NPR";

export interface CurrencyConfig {
  code: CurrencyCode;
  /** Short symbol shown in the UI — $ or Rs. */
  symbol: string;
  /** Intl.NumberFormat locale */
  locale: string;
}

/** Supported currencies. Extend here to add more later. */
export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$",   locale: "en-US" },
  NPR: { code: "NPR", symbol: "Rs.", locale: "en-NP" },
};

// =============================================================================
// Formatting
// =============================================================================

/**
 * Format a monetary amount using a given CurrencyConfig.
 *
 * NPR note: Intl.NumberFormat outputs "NPR 1,234.56" — not the expected
 * "Rs. 1,234.56" used in Nepal. We override the symbol manually.
 */
export function formatWithCurrency(
  amount: number | string | null | undefined,
  config: CurrencyConfig,
  compact = false
): string {
  const value = Number(amount ?? 0);

  if (config.code === "NPR") {
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
      ...(compact ? { notation: "compact" } : {}),
    }).format(value);
    return `${config.symbol}\u00a0${formatted}`;
  }

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    ...(compact ? { notation: "compact" } : {}),
  }).format(value);
}
