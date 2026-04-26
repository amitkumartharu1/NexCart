"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Clock,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { toast } from "sonner";

type OrderStatus =
  | "PENDING"
  | "PAYMENT_VERIFICATION"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "RETURN_REQUESTED"
  | "RETURNED";

interface OrderItem {
  id: string;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { name: string; images: { url: string }[] } | null;
  variant: { name: string } | null;
}

interface OrderStatusHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; email: string | null; phone: string | null } | null;
  items: OrderItem[];
  payments: {
    id: string;
    status: string;
    method: string;
    manualTransactionId: string | null;
    proofImage: string | null;
  }[];
  shippingAddress: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  } | null;
  statusHistory: OrderStatusHistory[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:               "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  PAYMENT_VERIFICATION:  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CONFIRMED:             "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PROCESSING:            "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  SHIPPED:               "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  OUT_FOR_DELIVERY:      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  DELIVERED:             "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED:             "bg-red-500/10 text-red-600 dark:text-red-400",
  FAILED:                "bg-red-500/10 text-red-700 dark:text-red-400",
  REFUNDED:              "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  PARTIALLY_REFUNDED:    "bg-orange-500/10 text-orange-500 dark:text-orange-400",
  RETURN_REQUESTED:      "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  RETURNED:              "bg-pink-500/10 text-pink-700 dark:text-pink-500",
};

const TIMELINE_DOT: Record<string, string> = {
  PENDING:               "bg-yellow-500",
  PAYMENT_VERIFICATION:  "bg-amber-500",
  CONFIRMED:             "bg-blue-500",
  PROCESSING:            "bg-purple-500",
  SHIPPED:               "bg-indigo-500",
  OUT_FOR_DELIVERY:      "bg-cyan-500",
  DELIVERED:             "bg-emerald-500",
  CANCELLED:             "bg-red-500",
  FAILED:                "bg-red-700",
  REFUNDED:              "bg-orange-500",
  PARTIALLY_REFUNDED:    "bg-orange-400",
  RETURN_REQUESTED:      "bg-pink-500",
  RETURNED:              "bg-pink-700",
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAYMENT_VERIFICATION",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "RETURN_REQUESTED",
  "RETURNED",
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESEWA:            "eSewa",
  KHALTI:           "Khalti",
  STRIPE:           "Debit / Credit Card",
  CASH_ON_DELIVERY: "Cash on Delivery",
  BANK_TRANSFER:    "Bank Transfer",
  OTHER:            "Other",
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Update form state
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // Payment verification state
  const [verifying, setVerifying] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json().catch(() => ({}));
      setOrder(data.order);
      setNewStatus(data.order.status);
      setTrackingNumber(data.order.trackingNumber ?? "");
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus !== order?.status ? newStatus : undefined,
          trackingNumber: trackingNumber || undefined,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Update failed");
      }
      toast.success("Order updated successfully");
      setNote("");
      await fetchOrder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = async (action: "APPROVE" | "REJECT") => {
    if (!payment?.id) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: rejectNote || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Verification failed");
      }
      toast.success(action === "APPROVE" ? "Payment approved — order is now Processing" : "Payment rejected");
      setRejectNote("");
      setShowRejectInput(false);
      await fetchOrder();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify payment");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-background-subtle rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-background border border-border rounded-xl p-5 space-y-3"
                >
                  <div className="h-5 w-32 bg-background-subtle rounded animate-pulse" />
                  <div className="space-y-2">
                    {Array(3)
                      .fill(null)
                      .map((__, j) => (
                        <div
                          key={j}
                          className="h-4 bg-background-subtle rounded animate-pulse"
                        />
                      ))}
                  </div>
                </div>
              ))}
          </div>
          <div className="space-y-4">
            <div className="bg-background border border-border rounded-xl p-5 h-48 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-foreground-muted">
        <Package size={40} className="opacity-30" />
        <p className="text-lg font-medium text-foreground">Order not found</p>
        <button
          onClick={() => router.push("/admin/orders")}
          className="flex items-center gap-2 text-primary text-sm hover:underline"
        >
          <ArrowLeft size={14} /> Back to orders
        </button>
      </div>
    );
  }

  const payment = order.payments[0] ?? null;

  const showVerificationCard =
    order.status === "PAYMENT_VERIFICATION" &&
    payment?.status === "PENDING" &&
    (payment?.method === "ESEWA" || payment?.method === "KHALTI");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/orders")}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Order #{order.orderNumber}
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            "ml-auto text-xs font-semibold px-3 py-1 rounded-full",
            STATUS_STYLES[order.status] ?? "bg-background-subtle text-foreground-muted"
          )}
        >
          {order.status.replace(/_/g, " ")}
        </span>
        <a
          href={`/admin/orders/${order.id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-foreground-muted text-xs font-medium hover:text-foreground hover:bg-background-subtle transition-colors"
        >
          <Printer size={13} />
          Invoice
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Payment Verification Card ── */}
          {showVerificationCard && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-700 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-amber-600 dark:text-amber-400" />
                <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                  Payment Proof — Awaiting Verification
                </h2>
                <span className="ml-auto text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-semibold">
                  {PAYMENT_METHOD_LABELS[payment!.method] ?? payment!.method}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Transaction ID */}
                <div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
                    Transaction ID
                  </p>
                  <p className="font-mono text-sm font-semibold text-foreground bg-background border border-border rounded-lg px-3 py-2 break-all">
                    {payment?.manualTransactionId ?? (
                      <span className="text-foreground-muted font-normal italic">Not provided</span>
                    )}
                  </p>
                </div>

                {/* Proof image */}
                <div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
                    Payment Screenshot
                  </p>
                  {payment?.proofImage ? (
                    <a
                      href={payment.proofImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink size={14} />
                      View Screenshot
                    </a>
                  ) : (
                    <p className="text-sm text-foreground-muted italic">No screenshot uploaded</p>
                  )}
                </div>
              </div>

              {/* Proof image preview */}
              {payment?.proofImage && (
                <div className="mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={payment.proofImage}
                    alt="Payment proof"
                    className="max-h-48 rounded-lg border border-border object-contain bg-background"
                  />
                </div>
              )}

              {/* Reject note input */}
              {showRejectInput && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                    Rejection reason (optional)
                  </label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="e.g. Screenshot unclear, transaction ID not found…"
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleVerify("APPROVE")}
                  disabled={verifying}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  {verifying ? "Processing…" : "Approve Payment"}
                </button>

                {!showRejectInput ? (
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={verifying}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    Reject
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerify("REJECT")}
                      disabled={verifying}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      <XCircle size={15} />
                      {verifying ? "Processing…" : "Confirm Reject"}
                    </button>
                    <button
                      onClick={() => { setShowRejectInput(false); setRejectNote(""); }}
                      className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Package size={16} className="text-foreground-muted" />
              <h2 className="font-semibold text-foreground">
                Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-background-subtle border border-border flex-shrink-0">
                    {item.image ?? item.product?.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(item.image ?? item.product?.images[0]?.url)!}
                        alt={item.name ?? item.product?.name ?? "Product"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground line-clamp-1">
                      {item.name ?? item.product?.name ?? "Unknown product"}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-foreground-muted">
                        {item.variant.name}
                      </p>
                    )}
                    <p className="text-xs text-foreground-muted">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(Number(item.totalPrice))}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {formatCurrency(Number(item.unitPrice))} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order totals */}
            <div className="px-5 py-4 border-t border-border space-y-2 bg-background-subtle/50">
              <div className="flex justify-between text-sm text-foreground-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-foreground-muted">
                <span>Shipping</span>
                <span>
                  {Number(order.shippingAmount) === 0
                    ? "Free"
                    : formatCurrency(Number(order.shippingAmount))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-foreground-muted">
                <span>Incl. Tax</span>
                <span>{formatCurrency(Number(order.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Customer */}
            <div className="bg-background border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <User size={15} className="text-foreground-muted" />
                <h2 className="font-semibold text-foreground text-sm">
                  Customer
                </h2>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-foreground">
                  {order.user?.name ?? "Unknown"}
                </p>
                {order.user?.email && (
                  <p className="text-foreground-muted">{order.user.email}</p>
                )}
                {order.user?.phone && (
                  <p className="text-foreground-muted">{order.user.phone}</p>
                )}
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-background border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-foreground-muted" />
                <h2 className="font-semibold text-foreground text-sm">
                  Shipping Address
                </h2>
              </div>
              {order.shippingAddress ? (
                <div className="space-y-0.5 text-sm text-foreground-muted">
                  <p className="font-medium text-foreground">
                    {order.shippingAddress.name}
                  </p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && (
                    <p>{order.shippingAddress.line2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p>{order.shippingAddress.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-foreground-muted">
                  No shipping address
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          {payment && (
            <div className="bg-background border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={15} className="text-foreground-muted" />
                <h2 className="font-semibold text-foreground text-sm">
                  Payment
                </h2>
              </div>
              <div className="flex items-center gap-6 text-sm flex-wrap">
                <div>
                  <p className="text-foreground-muted text-xs mb-0.5">Method</p>
                  <p className="font-medium text-foreground">
                    {PAYMENT_METHOD_LABELS[payment.method] ??
                      payment.method.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-foreground-muted text-xs mb-0.5">Status</p>
                  <p className="font-medium text-foreground">
                    {payment.status === "PENDING" && (payment.method === "ESEWA" || payment.method === "KHALTI")
                      ? "Awaiting Verification"
                      : payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}
                  </p>
                </div>
                {payment.manualTransactionId && (
                  <div>
                    <p className="text-foreground-muted text-xs mb-0.5">Transaction ID</p>
                    <p className="font-mono text-foreground">{payment.manualTransactionId}</p>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <p className="text-foreground-muted text-xs mb-0.5">Tracking #</p>
                    <p className="font-medium text-foreground font-mono">
                      {order.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status History */}
          {order.statusHistory.length > 0 && (
            <div className="bg-background border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} className="text-foreground-muted" />
                <h2 className="font-semibold text-foreground text-sm">
                  Status History
                </h2>
              </div>
              <ol className="relative border-l border-border ml-2 space-y-5">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="pl-5 relative">
                    <span
                      className={cn(
                        "absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                        TIMELINE_DOT[entry.status] ?? "bg-gray-400"
                      )}
                    />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full",
                            STATUS_STYLES[entry.status] ?? "bg-background-subtle text-foreground-muted"
                          )}
                        >
                          {entry.status.replace(/_/g, " ")}
                        </span>
                        {entry.note && (
                          <p className="text-sm text-foreground-muted mt-1">
                            {entry.note}
                          </p>
                        )}
                      </div>
                      <time className="text-xs text-foreground-muted whitespace-nowrap flex-shrink-0">
                        {formatDateTime(entry.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right column — Update form */}
        <div className="space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={15} className="text-foreground-muted" />
              <h2 className="font-semibold text-foreground text-sm">
                Update Order
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) =>
                    setNewStatus(e.target.value as OrderStatus)
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 text-foreground"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                  Tracking Number
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 font-mono placeholder:font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                  Note{" "}
                  <span className="font-normal opacity-70">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note about this update…"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={updating || !newStatus}
                className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? "Updating…" : "Update Order"}
              </button>
            </div>
          </div>

          {/* Quick info card */}
          <div className="bg-background border border-border rounded-xl p-5 space-y-3 text-sm">
            <h3 className="font-semibold text-foreground text-sm">
              Order Summary
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-foreground-muted">
                <span>Order #</span>
                <span className="font-mono text-foreground">
                  {order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Total</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Items</span>
                <span className="text-foreground">{order.items.length}</span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Last updated</span>
                <span className="text-foreground text-xs">
                  {formatDateTime(order.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
