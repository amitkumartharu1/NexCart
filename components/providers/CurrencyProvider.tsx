"use client";

/**
 * CurrencyProvider
 *
 * Wraps the app and makes the active currency (USD or NPR) available via
 * useCurrency().  It also calls _setActiveCurrency() synchronously during
 * render so that ALL existing formatCurrency() calls in every client component
 * automatically use the correct currency — no per-file changes needed.
 *
 * The server passes `initialCurrency` (read from DB) so there is zero flash
 * on first render: the module-level singleton is seeded before any child paints.
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { type CurrencyCode, CURRENCIES, type CurrencyConfig } from "@/lib/currency";
import {
  _setActiveCurrency,
  formatCurrency,
  formatCurrencyCompact,
} from "@/lib/utils/format";

// =============================================================================
// Context shape
// =============================================================================

interface CurrencyContextValue {
  /** ISO 4217 code: "USD" | "NPR" */
  currency: CurrencyCode;
  /** Full config object (code, symbol, locale) */
  config: CurrencyConfig;
  /** Shorthand symbol: "$" | "Rs." */
  symbol: string;
  /** Format a price using the active currency */
  formatPrice: (amount: number | string | null | undefined) => string;
  /** Compact format (e.g. $1.2K / Rs. 1.2K) */
  formatPriceCompact: (amount: number | string | null | undefined) => string;
}

// =============================================================================
// Context
// =============================================================================

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  config: CURRENCIES.USD,
  symbol: "$",
  formatPrice: (a) => formatCurrency(a, "USD"),
  formatPriceCompact: (a) => formatCurrencyCompact(a, "USD"),
});

// =============================================================================
// Provider
// =============================================================================

export function CurrencyProvider({
  initialCurrency,
  children,
}: {
  initialCurrency: CurrencyCode;
  children: React.ReactNode;
}) {
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency);

  // ── Synchronous singleton seed ────────────────────────────────────────────
  // useMemo runs during render (before any child), so the format.ts singleton
  // is updated before any child component calls formatCurrency().
  useMemo(() => {
    const cfg = CURRENCIES[currency];
    _setActiveCurrency(cfg.code, cfg.locale, cfg.symbol);
  }, [currency]);

  // ── Async refresh from DB (in case admin changed currency in another tab) ──
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { settings?: Record<string, string | null> } | null) => {
        if (cancelled || !data) return;
        const raw = data.settings?.currency;
        if (raw === "USD" || raw === "NPR") {
          setCurrency(raw);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  const config = CURRENCIES[currency];

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      config,
      symbol: config.symbol,
      formatPrice: (a) => formatCurrency(a, currency, config.locale),
      formatPriceCompact: (a) => formatCurrencyCompact(a, currency, config.locale),
    }),
    [currency, config]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Returns the active currency context.
 *
 * Usage:
 *   const { formatPrice, symbol, currency } = useCurrency();
 *   <span>{formatPrice(product.basePrice)}</span>
 */
export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
