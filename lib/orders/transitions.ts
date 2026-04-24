/**
 * Order status transition validator.
 * Enforces the strict state machine — invalid transitions are rejected at the API layer.
 *
 * Valid flows:
 *   PENDING → PAYMENT_VERIFICATION → PROCESSING → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
 *   PENDING → FAILED
 *   PENDING → CANCELLED
 *   PAYMENT_VERIFICATION → FAILED  (admin rejects proof)
 *   PAYMENT_VERIFICATION → CANCELLED
 *   PROCESSING → CANCELLED
 *   DELIVERED → RETURN_REQUESTED → RETURNED
 *   Any → REFUNDED / PARTIALLY_REFUNDED  (finance team)
 */

import type { OrderStatus } from "@prisma/client";

// Adjacency list — from status → allowed next statuses
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAYMENT_VERIFICATION", "CONFIRMED", "FAILED", "CANCELLED"],
  PAYMENT_VERIFICATION: ["PROCESSING", "CONFIRMED", "FAILED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED", "REFUNDED", "PARTIALLY_REFUNDED"],
  FAILED: ["PENDING"], // allow retry
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  RETURNED: ["REFUNDED", "PARTIALLY_REFUNDED"],
  REFUNDED: [],
  PARTIALLY_REFUNDED: ["REFUNDED"],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedNext(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** Throws if the transition is invalid — use inside API route handlers */
export function assertValidTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidTransition(from, to)) {
    throw new Error(
      `Invalid transition: ${from} → ${to}. Allowed: [${allowedNext(from).join(", ") || "none"}]`
    );
  }
}

/** Human-readable label for each status */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAYMENT_VERIFICATION: "Payment Verification",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return Requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially Refunded",
};

/** Badge colour map (Tailwind classes) */
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PAYMENT_VERIFICATION: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  PROCESSING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  RETURN_REQUESTED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  RETURNED: "bg-orange-200 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300",
  REFUNDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PARTIALLY_REFUNDED: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-500",
};
