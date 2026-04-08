import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

// =============================================================================
// Currency
// =============================================================================

const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-US";

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyCompact(
  amount: number | string | null | undefined,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
): string {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// =============================================================================
// Numbers
// =============================================================================

export function formatNumber(
  value: number | string | null | undefined,
  locale = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale).format(Number(value ?? 0));
}

export function formatPercent(
  value: number,
  locale = DEFAULT_LOCALE
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
