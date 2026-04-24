"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag, ArrowLeft, CreditCard, Truck, Shield,
  Smartphone, Banknote, CheckCircle2, ScanLine, Wallet,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Payment method definitions — all possible methods
// ---------------------------------------------------------------------------

type PaymentId = "ESEWA_QR" | "KHALTI_QR" | "KHALTI" | "STRIPE" | "COD" | "BANK_TRANSFER";

// Maps payment setting key → PaymentId
const PAYMENT_METHOD_CONFIG: {
  id: PaymentId;
  settingKey: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "ESEWA_QR",
    settingKey: "payment_esewa_enabled",
    label: "eSewa",
    desc: "Scan QR code and pay instantly",
    icon: <Smartphone size={20} className="text-green-500" />,
  },
  {
    id: "KHALTI_QR",
    settingKey: "payment_khalti_qr_enabled",
    label: "Khalti",
    desc: "Scan Khalti QR code and pay",
    icon: <Wallet size={20} className="text-purple-500" />,
  },
  {
    id: "KHALTI",
    settingKey: "payment_khalti_enabled",
    label: "Khalti (Gateway)",
    desc: "Redirect to Khalti payment page",
    icon: <Wallet size={20} className="text-purple-400" />,
  },
  {
    id: "STRIPE",
    settingKey: "payment_stripe_enabled",
    label: "Debit / Credit Card",
    desc: "Visa, Mastercard — secure checkout",
    icon: <CreditCard size={20} className="text-blue-500" />,
  },
  {
    id: "COD",
    settingKey: "payment_cod_enabled",
    label: "Cash on Delivery",
    desc: "Pay when your order arrives",
    icon: <Banknote size={20} className="text-amber-500" />,
  },
  {
    id: "BANK_TRANSFER",
    settingKey: "payment_bank_enabled",
    label: "Bank Transfer",
    desc: "Direct bank / wire transfer",
    icon: <Banknote size={20} className="text-indigo-500" />,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QrSettings {
  enabled: boolean;
  imageUrl: string;
  accountName: string;
  instructions: string;
}

interface KhaltiQrSettings {
  imageUrl: string;
  accountName: string;
  instructions: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentId | null>(null);
  const [enabledMethods, setEnabledMethods] = useState<Set<string>>(
    new Set(["payment_esewa_enabled", "payment_cod_enabled", "payment_khalti_enabled"])
  );
  const [qrSettings, setQrSettings] = useState<QrSettings>({
    enabled: false,
    imageUrl: "",
    accountName: "",
    instructions: "Scan the QR code below and send the exact amount shown.",
  });
  const [khaltiQrSettings, setKhaltiQrSettings] = useState<KhaltiQrSettings>({
    imageUrl: "",
    accountName: "",
    instructions: "Scan the QR code below and send the exact amount shown.",
  });
  const [shippingMode, setShippingMode] = useState<"free" | "paid">("paid");
  const [shippingCost, setShippingCost] = useState(150);
  const [taxRate, setTaxRate] = useState(13); // percentage

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Nepal",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/checkout");
    }
    if (session?.user) {
      setForm((f) => ({ ...f, name: session.user.name ?? "", email: session.user.email ?? "" }));
    }
  }, [session, status, router]);

  // Load pricing + payment settings from admin
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const s = data.settings;
        setQrSettings({
          enabled: true,
          imageUrl: s["qr_payment_image_url"] ?? "",
          accountName: s["qr_payment_account_name"] ?? "NexCart eSewa",
          instructions:
            s["qr_payment_instructions"] ??
            "Scan the QR code below and send the exact amount shown.",
        });
        if (s["shipping_mode"])  setShippingMode((s["shipping_mode"] as "free" | "paid") ?? "paid");
        if (s["shipping_cost"])  setShippingCost(Number(s["shipping_cost"]));
        if (s["tax_rate"])       setTaxRate(Number(s["tax_rate"]));

        // Build set of enabled payment setting keys
        const enabled = new Set<string>();
        // Khalti QR settings
        setKhaltiQrSettings({
          imageUrl: s["khalti_qr_image_url"] ?? "",
          accountName: s["khalti_qr_account_name"] ?? "NexCart Khalti",
          instructions: s["khalti_qr_instructions"] ?? "Scan the QR code below and send the exact amount shown.",
        });

        const pmKeys = ["payment_esewa_enabled", "payment_khalti_qr_enabled", "payment_khalti_enabled", "payment_cod_enabled", "payment_stripe_enabled", "payment_bank_enabled"];
        for (const k of pmKeys) {
          if (s[k] === "true") enabled.add(k);
        }
        setEnabledMethods(enabled);

        // Auto-select first enabled method
        const first = PAYMENT_METHOD_CONFIG.find((m) => enabled.has(m.settingKey));
        if (first) setPaymentMethod(first.id);
      })
      .catch(() => {});
  }, []);

  // Shipping: admin controls mode
  const shipping = shippingMode === "free" ? 0 : shippingCost;
  // VAT-inclusive: total = subtotal + shipping only; tax is extracted for display
  const tax = subtotal() - subtotal() / (1 + taxRate / 100);
  const total = subtotal() + shipping;

  // Visible payment methods (filtered by admin settings)
  const visibleMethods = PAYMENT_METHOD_CONFIG.filter((m) => enabledMethods.has(m.settingKey));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    setLoading(true);
    try {
      // Map UI payment method to API enum
      // ESEWA_QR → "ESEWA", KHALTI_QR stays as "KHALTI_QR" (API handles no-redirect)
      // BANK_TRANSFER, COD, STRIPE, KHALTI pass through directly
      const apiMethod =
        paymentMethod === "ESEWA_QR" ? "ESEWA" : paymentMethod;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
          })),
          shippingAddress: form,
          paymentMethod: apiMethod,
          subtotal: subtotal(),
          shippingAmount: shipping,
          taxAmount: tax,
          total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");

      // Stripe / Khalti API gateway → redirect to payment page
      // Note: KHALTI_QR is a QR scan (no redirect), only KHALTI (gateway) redirects
      if (data.redirectUrl && (paymentMethod === "STRIPE" || paymentMethod === "KHALTI")) {
        window.location.href = data.redirectUrl;
        return;
      }

      // eSewa QR / COD → order placed, go to tracking page
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/dashboard/orders/${data.orderId}?placed=1`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-background-subtle flex items-center justify-center">
          <ShoppingBag size={28} className="text-foreground-muted" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="text-foreground-muted mt-1">Add some items before checking out</p>
        </div>
        <Link
          href="/shop"
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-subtle pt-20 pb-16">
      <div className="container-wide max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Cart
          </Link>
          <span className="text-foreground-muted">/</span>
          <span className="text-sm font-medium text-foreground">Checkout</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Left — Form ── */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Contact */}
              <div className="bg-background rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+977-98XXXXXXXX"
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-background rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Truck size={16} className="text-primary" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Province</label>
                      <input
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Postal Code</label>
                      <input
                        value={form.zip}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                      <input
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-background rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  Payment Method
                </h2>

                {visibleMethods.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-700 dark:text-amber-400">
                    No payment methods are currently enabled. Please contact the store.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-border-strong hover:bg-background-subtle"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            paymentMethod === method.id ? "border-primary" : "border-border"
                          )}
                        >
                          {paymentMethod === method.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        {method.icon}
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{method.label}</p>
                          <p className="text-xs text-foreground-muted mt-0.5">{method.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* ── eSewa QR Panel ── */}
                {paymentMethod === "ESEWA_QR" && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                      <ScanLine size={16} />
                      Scan &amp; Pay with eSewa
                    </div>

                    {qrSettings.imageUrl ? (
                      <div className="flex flex-col items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrSettings.imageUrl}
                          alt="eSewa QR Code"
                          className="w-48 h-48 object-contain rounded-xl border-2 border-green-300 bg-white p-2 shadow"
                        />
                        {qrSettings.accountName && (
                          <p className="text-sm font-medium text-foreground">
                            {qrSettings.accountName}
                          </p>
                        )}
                        <div className="w-full text-center rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 px-4 py-2">
                          <p className="text-xs text-green-800 dark:text-green-300">
                            Send exactly{" "}
                            <span className="font-bold">{formatCurrency(total)}</span>
                          </p>
                        </div>
                        <p className="text-xs text-foreground-muted text-center leading-relaxed">
                          {qrSettings.instructions}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-foreground-muted">
                        <ScanLine size={32} className="mx-auto mb-2 opacity-40" />
                        eSewa QR not set up yet.{" "}
                        <Link href="/admin/settings" className="text-primary underline">
                          Add QR in Admin → Settings
                        </Link>
                      </div>
                    )}

                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
                      After payment, click &ldquo;Place Order&rdquo;. We&apos;ll confirm once we verify your
                      eSewa transaction.
                    </div>
                  </div>
                )}

                {/* ── Khalti QR Panel ── */}
                {paymentMethod === "KHALTI_QR" && (
                  <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold text-sm">
                      <ScanLine size={16} />
                      Scan &amp; Pay with Khalti
                    </div>

                    {khaltiQrSettings.imageUrl ? (
                      <div className="flex flex-col items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={khaltiQrSettings.imageUrl}
                          alt="Khalti QR Code"
                          className="w-48 h-48 object-contain rounded-xl border-2 border-purple-300 bg-white p-2 shadow"
                        />
                        {khaltiQrSettings.accountName && (
                          <p className="text-sm font-medium text-foreground">
                            {khaltiQrSettings.accountName}
                          </p>
                        )}
                        <div className="w-full text-center rounded-lg bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 px-4 py-2">
                          <p className="text-xs text-purple-800 dark:text-purple-300">
                            Send exactly{" "}
                            <span className="font-bold">{formatCurrency(total)}</span>
                          </p>
                        </div>
                        <p className="text-xs text-foreground-muted text-center leading-relaxed">
                          {khaltiQrSettings.instructions}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-foreground-muted">
                        <ScanLine size={32} className="mx-auto mb-2 opacity-40" />
                        Khalti QR not set up yet.{" "}
                        <Link href="/admin/settings" className="text-primary underline">
                          Add QR in Admin → Settings
                        </Link>
                      </div>
                    )}

                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
                      After payment, click &ldquo;Place Order&rdquo;. We&apos;ll confirm once we verify your
                      Khalti transaction.
                    </div>
                  </div>
                )}

                {/* ── Khalti API redirect info panel ── */}
                {paymentMethod === "KHALTI" && (
                  <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-900 p-4 flex items-start gap-3">
                    <Wallet size={16} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                      You&apos;ll be redirected to Khalti&apos;s secure payment page. Complete the
                      payment there and you&apos;ll be brought back automatically.
                    </p>
                  </div>
                )}

                {/* ── Card info panel ── */}
                {paymentMethod === "STRIPE" && (
                  <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4 flex items-start gap-3">
                    <Shield size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                      You&apos;ll be redirected to Stripe&apos;s secure page to enter your card details.
                      We never store your card information.
                    </p>
                  </div>
                )}

                {/* ── COD info panel ── */}
                {paymentMethod === "COD" && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-4 flex items-start gap-3">
                    <Truck size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Pay in cash when your order is delivered. Please have the exact amount ready.
                      Your order will be confirmed immediately.
                    </p>
                  </div>
                )}

                {/* ── Bank Transfer info panel ── */}
                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-900 p-4 flex items-start gap-3">
                    <Banknote size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed space-y-1">
                      <p className="font-semibold">Bank Transfer Instructions</p>
                      <p>Transfer the exact order amount to our bank account. After placing the order, you will receive bank details via email. Your order will be processed once the transfer is confirmed.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !paymentMethod || visibleMethods.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary-hover transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {(paymentMethod === "ESEWA_QR" || paymentMethod === "KHALTI_QR") && <ScanLine size={16} />}
                    {(paymentMethod === "KHALTI")   && <Wallet size={16} />}
                    {paymentMethod === "STRIPE"        && <CreditCard size={16} />}
                    {paymentMethod === "COD"           && <CheckCircle2 size={16} />}
                    {paymentMethod === "BANK_TRANSFER" && <Banknote size={16} />}
                    {(paymentMethod === "ESEWA_QR" || paymentMethod === "KHALTI_QR")
                      ? "I've Paid — Confirm Order"
                      : paymentMethod === "COD"
                      ? `Place Order — ${formatCurrency(total)}`
                      : paymentMethod === "KHALTI"
                      ? `Pay ${formatCurrency(total)} with Khalti`
                      : paymentMethod === "BANK_TRANSFER"
                      ? `Place Order — ${formatCurrency(total)}`
                      : paymentMethod === "STRIPE"
                      ? `Pay ${formatCurrency(total)} with Card`
                      : "Select a payment method"}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-foreground-muted flex items-center justify-center gap-1.5">
                <Shield size={11} className="text-emerald-500" />
                Secured with 256-bit SSL encryption
              </p>
            </form>
          </div>

          {/* ── Right — Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-2xl border border-border p-5 sticky top-24 space-y-4">
              <h2 className="font-semibold text-foreground">Order Summary</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-background-subtle border border-border flex-shrink-0 relative">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={14} className="text-foreground-muted" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      {item.variantName && (
                        <p className="text-xs text-foreground-muted">{item.variantName}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-foreground-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex justify-between text-foreground-muted">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-emerald-500 font-medium" : ""}>
                    {shipping === 0 ? "Free" : formatCurrency(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-foreground-muted text-xs">
                  <span>Incl. VAT ({taxRate}%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-foreground-muted bg-background-subtle rounded-xl p-3">
                <Shield size={12} className="text-emerald-500 flex-shrink-0" />
                Your payment is secured with 256-bit SSL encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
