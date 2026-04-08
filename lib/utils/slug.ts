import slugifyLib from "slugify";
import { nanoid } from "nanoid";

/**
 * Generate a URL-safe slug from a string.
 * Suitable for products, services, categories, brands, blogs.
 */
export function createSlug(input: string): string {
  return slugifyLib(input, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Generate a unique slug by appending a short random suffix.
 * Use when you need guaranteed uniqueness without a DB round-trip.
 */
export function createUniqueSlug(input: string): string {
  const base = createSlug(input);
  const suffix = nanoid(6).toLowerCase();
  return `${base}-${suffix}`;
}

/**
 * Generate a unique order number.
 * Format: NC-YYYYMMDD-XXXXXX (e.g. NC-20240115-A3K9P2)
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = nanoid(6).toUpperCase();
  return `NC-${dateStr}-${random}`;
}

/**
 * Generate a booking reference.
 * Format: BK-XXXXXXXXXX
 */
export function generateBookingRef(): string {
  return `BK-${nanoid(10).toUpperCase()}`;
}

/**
 * Generate a support ticket reference.
 * Format: TK-XXXXXXXXXX
 */
export function generateTicketRef(): string {
  return `TK-${nanoid(10).toUpperCase()}`;
}

/**
 * Generate an invoice number.
 * Format: INV-YYYYMMDD-XXXXXX
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = nanoid(6).toUpperCase();
  return `INV-${dateStr}-${random}`;
}
