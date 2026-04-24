import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

// =============================================================================
// Active-currency module singleton (client-side only)
//
// CurrencyProvider calls _setActiveCurrency() synchronously during render so
// every formatCurrency() call that follows uses the correct code/locale.
// On the server this stays at the environment-variable defaults — server
// components that need DB currency should call getGlobalCurrency() + pass it
// explicitly, or use formatWithCurrency() from lib/currency.ts directly.
// =============================================================================

let _activeCurrency: string = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";
let _activeLocale: string  = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-US";
let _activeSymbol: string  = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "$";

/** Called by CurrencyProvider during its synchronous render phase. */
export function _setActiveCurrency(
  code: string,
  locale: string,
  symbol: string
): void {
  // Guard: only mutate on the client — module is shared across requests on the server.
  if (typeof window === "undefined") return;
  _activeCurrency = code;
  _activeLocale   = locale;
  _activeSymbol   = symbol;
}

// =============================================================================
// Currency
// =============================================================================

/**
 * Format a monetary value.
 *
 * When called with no explicit `currency` / `locale` it uses whatever
 * CurrencyProvider has set as the active currency (defaults to env vars).
 *
 * NPR special-case: Intl outputs "NPR 1,234.56" — we reformat to "Rs. 1,234.56".
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = _activeCurrency,
  locale: string   = _activeLocale
): string {
  const value = Number(amount ?? 0);

  if (currency === "NPR") {
    const formatted = new Intl.NumberFormat("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `Rs.\u00a0${formatted}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyCompact(
  amount: number | string | null | undefined,
  currency: string = _activeCurrency,
  locale: string   = _activeLocale
): string {
  const value = Number(amount ?? 0);

  if (currency === "NPR") {
    const formatted = new Intl.NumberFormat("en-NP", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    return `Rs.\u00a0${formatted}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Returns the active currency symbol ($ or Rs.) */
export function getCurrencySymbol(): string {
  return _activeSymbol;
}

// =============================================================================
// Numbers
// =============================================================================

export function formatNumber(
  value: number | string | null | undefined,
  locale = _activeLocale
): string {
  return new Intl.NumberFormat(locale).format(Number(value ?? 0));
}

export function formatPercent(
  value: number,
  locale = _activeLocale
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

// =============================================================================
// Dates
// =============================================================================

export function formatDate(
  date: Date | string | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  if (!date) return "";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "";
  return format(parsed, pattern);
}

export function formatDateTime(
  date: Date | string | null | undefined
): string {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return "";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

// =============================================================================
// Strings
// =============================================================================

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str
    .split(/[\s_-]+/)
    .map(capitalize)
    .join(" ");
}

export function formatOrderStatus(status: string): string {
  return titleCase(status.replace(/_/g, " "));
}

// =============================================================================
// File sizes
// =============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}
