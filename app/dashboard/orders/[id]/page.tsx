"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Package, Truck, MapPin, CreditCard,
  CheckCircle2, Clock, PackageCheck, PackageSearch,
  CircleDot, Bike, Upload,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Delivery Progress Tracker
// ---------------------------------------------------------------------------

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
  | "REFUNDED";

interface DeliveryStep {
  status: OrderStatus[];   // which DB statuses map to this step
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const DELIVERY_STEPS: DeliveryStep[] = [
  {
    status: ["PENDING", "CONFIRMED"],
    label: "Order Confirmed",
    sublabel: "We received your order",
    icon: <CheckCircle2 size={20} />,
  },
  {
    status: ["PROCESSING"],
    label: "Packing",
    sublabel: "Your items are being packed",
    icon: <PackageCheck size={20} />,
  },
  {
    status: ["SHIPPED"],
    label: "Processing & Shipped",
    sublabel: "On its way to you",
    icon: <PackageSearch size={20} />,
  },
  {
    status: ["OUT_FOR_DELIVERY"],
    label: "Out for Delivery",
    sublabel: "Almost there!",
    icon: <Bike size={20} />,
  },
  {
    status: ["DELIVERED"],
    label: "Delivered",
    sublabel: "Enjoy your order!",
    icon: <Package size={20} />,
  },
];

function getStepIndex(status: OrderStatus): number {
  for (let i = 0; i < DELIVERY_STEPS.length; i++) {
    if (DELIVERY_STEPS[i].status.includes(status)) return i;
  }
  return -1; // cancelled / refunded
}

function DeliveryTracker({ status }: { status: OrderStatus }) {
  const isCancelled = status === "CANCELLED" || status === "REFUNDED" || status === "FAILED";
  const activeIndex = isCancelled ? -1 : getStepIndex(status);

  if (isCancelled) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-5 flex items-center gap-3">
        <CircleDot size={20} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-400">
            Order {status === "REFUNDED" ? "Refunded" : status === "FAILED" ? "Payment Failed" : "Cancelled"}
          </p>
          <p className="text-xs text-red-600/80 dark:text-red-500 mt-0.5">
            This order has been {status === "FAILED" ? "marked as failed due to payment issue" : status.toLowerCase()}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-2xl border border-border p-6">
      <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2">
        <Truck size={16} className="text-primary" />
        Delivery Progress
      </h2>

      {/* Steps */}
      <div className="relative">
        {/* connector line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />

        <div className="space-y-0">
          {DELIVERY_STEPS.map((step, i) => {
            const isDone = i < activeIndex;
            const isActive = i === activeIndex;
            const isPending = i > activeIndex;

            return (
              <div key={i} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                {/* Icon circle */}
                <div
                  className={cn(
                    "relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    isDone
                      ? "bg-primary border-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-foreground-muted"
                  )}
                >
                  {isDone ? <CheckCircle2 size={18} /> : step.icon}
                </div>

                {/* Text */}
                <div className="pt-1.5">
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      isActive ? "text-primary" : isDone ? "text-foreground" : "text-foreground-muted"
                    )}
                  >
                    {step.label}
                    {isActive && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                        Current
                      </span>
                    )}
                  </p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      isPending ? "text-foreground-subtle" : "text-foreground-muted"
                    )}
                  >
                    {step.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  PENDING:              "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  PAYMENT_VERIFICATION: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  CONFIRMED:            "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PROCESSING:           "bg-purple-500/10 text-purple-600 border-purple-500/20",
  SHIPPED:              "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  OUT_FOR_DELIVERY:     "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  DELIVERED:            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CANCELLED:            "bg-red-500/10 text-red-600 border-red-500/20",
  FAILED:               "bg-red-500/10 text-red-700 border-red-500/20",
  REFUNDED:             "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

interface Address {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}

interface OrderItem {
  id: string;
  name: string;
  sku: string | null;
  image: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Payment {
  id: string;
  method: string;
  status: string;
  amount: number;
  providerPaymentId: string | null;
  manualTransactionId: string | null;
  proofImage: string | null;
  createdAt: string;
}

interface StatusHistory {
  status: string;
  note: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  createdAt: string;
  address: Address | null;
  items: OrderItem[];
  payments: Payment[];
  statusHistory: StatusHistory[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Proof submission state
  const [txnId, setTxnId] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/orders/${id}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setOrder(data.order);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Poll every 10s when awaiting payment verification, else every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/orders/${id}/poll`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.status && order?.status !== data.status) {
            // Status changed — fetch full order
            fetch(`/api/dashboard/orders/${id}`)
              .then((r) => r.ok ? r.json() : null)
              .then((full) => { if (full?.order) setOrder(full.order); })
              .catch(() => {});
          }
        })
        .catch(() => {});
    }, order?.status === "PAYMENT_VERIFICATION" ? 10_000 : 30_000);
    return () => clearInterval(interval);
  }, [id, order?.status]);

  const handleSubmitProof = async () => {
    if (!txnId.trim()) {
      toast.error("Please enter the transaction ID");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          transactionId: txnId.trim(),
          proofImage: proofUrl.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      toast.success("Payment proof submitted! We'll verify and process your order shortly.");
      setTxnId("");
      setProofUrl("");
      // Refresh order
      const refreshed = await fetch(`/api/dashboard/orders/${id}`).then((r) => r.json()).catch(() => null);
      if (refreshed?.order) setOrder(refreshed.order);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit proof");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-background-subtle rounded w-48" />
        <div className="h-48 bg-background-subtle rounded-2xl" />
        <div className="h-40 bg-background-subtle rounded-2xl" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16">
        <Package size={48} className="mx-auto text-foreground-muted opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Order not found</h2>
        <p className="text-foreground-muted mb-6">
          This order doesn&apos;t exist or doesn&apos;t belong to your account.
        </p>
        <Link
          href="/dashboard/orders"
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const payment = order.payments[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} /> My Orders
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order #{order.orderNumber}</h1>
            <p className="text-sm text-foreground-muted mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border",
              STATUS_STYLES[order.status] ?? "bg-background-subtle text-foreground-muted border-border"
            )}
          >
            {order.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* ── Delivery Progress Tracker ── */}
      <DeliveryTracker status={order.status} />

      {/* ── Payment Proof Submission (eSewa / Khalti, PENDING, not yet submitted) ── */}
      {order.status === "PENDING" &&
        payment &&
        (payment.method === "ESEWA" || payment.method === "KHALTI") &&
        !payment.manualTransactionId && (
        /* Show proof form for eSewa and Khalti QR (both stored as ESEWA/KHALTI) */
        <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Upload size={16} className="text-amber-600 dark:text-amber-400" />
            <h2 className="font-semibold text-amber-800 dark:text-amber-300">
              Submit Payment Proof
            </h2>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
            Your order is pending. Please scan the{" "}
            {payment.method === "ESEWA" ? "eSewa" : "Khalti"} QR code shown at checkout,
            send the payment, and enter your transaction ID below.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder={payment.method === "ESEWA" ? "e.g. 000ABC123456" : "e.g. TXNXXXXXXXX"}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40 font-mono placeholder:font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Screenshot URL{" "}
                <span className="font-normal opacity-70">(optional — upload to Imgur or similar)</span>
              </label>
              <input
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://i.imgur.com/..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              />
            </div>

            <button
              onClick={handleSubmitProof}
              disabled={submitting || !txnId.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Upload size={15} />
              {submitting ? "Submitting…" : "Submit Payment Proof"}
            </button>
          </div>
        </div>
      )}

      {/* ── Under Verification Banner ── */}
      {order.status === "PAYMENT_VERIFICATION" && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-5 flex items-start gap-3">
          <Clock size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Payment Under Verification
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              We received your payment proof and are verifying it. Your order will be
              processed automatically once confirmed — usually within a few hours.
            </p>
            {payment?.manualTransactionId && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-mono">
                Txn ID: {payment.manualTransactionId}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tracking number (if available) */}
      {order.trackingNumber && (
        <div className="bg-background rounded-xl border border-border p-5 flex items-center gap-4">
          <Truck size={20} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">
              Tracking: {order.trackingNumber}
            </p>
            {order.estimatedDelivery && (
              <p className="text-xs text-foreground-muted mt-0.5">
                Estimated delivery: {formatDate(order.estimatedDelivery)}
              </p>
            )}
          </div>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-background-subtle transition-colors"
            >
              Track
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items + Timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Items */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Package size={16} className="text-primary" />
                Order Items
              </h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 px-5 py-4">
                  <div className="w-14 h-14 rounded-xl bg-background-subtle border border-border flex-shrink-0 overflow-hidden relative">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                    {item.sku && (
                      <p className="text-xs text-foreground-muted">SKU: {item.sku}</p>
                    )}
                    <p className="text-xs text-foreground-muted mt-1">
                      {formatCurrency(Number(item.unitPrice))} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrency(Number(item.totalPrice))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History Timeline */}
          {order.statusHistory.length > 0 && (
            <div className="bg-background rounded-xl border border-border p-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                <Clock size={16} className="text-primary" />
                Status History
              </h2>
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-4">
                  {order.statusHistory.map((entry, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className="absolute -left-5 top-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.status.replace(/_/g, " ")}
                        </p>
                        {entry.note && (
                          <p className="text-xs text-foreground-muted">{entry.note}</p>
                        )}
                        <p className="text-xs text-foreground-subtle mt-0.5">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-background rounded-xl border border-border p-5 space-y-3 text-sm">
            <h2 className="font-semibold text-foreground">Order Summary</h2>
            <div className="space-y-2 text-foreground-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-foreground">{formatCurrency(Number(order.subtotal))}</span>
              </div>
              {Number(order.shippingAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-foreground">
                    {formatCurrency(Number(order.shippingAmount))}
                  </span>
                </div>
              )}
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span className="text-foreground">
                    {formatCurrency(Number(order.taxAmount))}
                  </span>
                </div>
              )}
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground text-base">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.address && (
            <div className="bg-background rounded-xl border border-border p-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-primary" />
                Shipping Address
              </h2>
              <div className="text-sm text-foreground-muted space-y-0.5">
                <p className="font-medium text-foreground">
                  {order.address.firstName} {order.address.lastName}
                </p>
                <p>{order.address.addressLine1}</p>
                {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                <p>
                  {order.address.city}
                  {order.address.state ? `, ${order.address.state}` : ""}{" "}
                  {order.address.postalCode}
                </p>
                <p>{order.address.country}</p>
                {order.address.phone && <p className="pt-1">{order.address.phone}</p>}
              </div>
            </div>
          )}

          {/* Payment */}
          {payment && (
            <div className="bg-background rounded-xl border border-border p-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                <CreditCard size={15} className="text-primary" />
                Payment
              </h2>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Method</span>
                  <span className="font-medium text-foreground">
                    {{
                      ESEWA:            "eSewa",
                      KHALTI:           "Khalti",
                      STRIPE:           "Debit / Credit Card",
                      CASH_ON_DELIVERY: "Cash on Delivery",
                      OTHER:            "eSewa (QR)",
                    }[payment.method] ?? payment.method.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Status</span>
                  <span
                    className={cn(
                      "font-medium",
                      payment.status === "COMPLETED"
                        ? "text-emerald-600"
                        : payment.status === "PENDING" || payment.status === "UNPAID"
                        ? "text-amber-600"
                        : payment.status === "FAILED"
                        ? "text-red-600"
                        : "text-foreground"
                    )}
                  >
                    {(payment.status === "PENDING" || payment.status === "UNPAID") &&
                    (payment.method === "ESEWA" || payment.method === "KHALTI")
                      ? "Awaiting Verification"
                      : payment.status === "UNPAID"
                      ? "Pending"
                      : payment.status.charAt(0) + payment.status.slice(1).toLowerCase()}
                  </span>
                </div>
                {payment.providerPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Ref</span>
                    <span className="text-xs font-mono text-foreground truncate max-w-[120px]">
                      {payment.providerPaymentId}
                    </span>
                  </div>
                )}
              </div>

              {/* Awaiting verification notice */}
              {(payment.method === "ESEWA" || payment.method === "KHALTI") &&
                payment.status === "PENDING" && (
                <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
                  Your {payment.method === "ESEWA" ? "eSewa" : "Khalti"} payment is being
                  verified. Order processing will begin once confirmed.
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-background rounded-xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-2">Order Notes</h2>
              <p className="text-sm text-foreground-muted">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
