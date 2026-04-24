"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  // Pricing settings from admin — defaults match the admin defaults
  const [shippingMode, setShippingMode] = useState<"free" | "paid">("paid");
  const [shippingCost, setShippingCost] = useState(150);
  const [taxRate, setTaxRate] = useState(13); // percentage e.g. 13

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const s = data.settings;
        if (s["shipping_mode"])  setShippingMode((s["shipping_mode"] as "free" | "paid") ?? "paid");
        if (s["shipping_cost"])  setShippingCost(Number(s["shipping_cost"]));
        if (s["tax_rate"])       setTaxRate(Number(s["tax_rate"]));
      })
      .catch(() => {});
  }, []);

  const sub = subtotal();
  // Admin controls: "free" = no charge, "paid" = flat rate
  const shipping = shippingMode === "free" ? 0 : shippingCost;
  // Prices are VAT-inclusive — extract tax from subtotal for display only; don't add on top
  const tax = sub - sub / (1 + taxRate / 100);
  const total = sub + shipping; // tax already inside product prices

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20">
        <div className="bg-background-subtle rounded-2xl p-12 flex flex-col items-center gap-6 max-w-md w-full text-center">
          <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border-2 border-dashed border-border">
            <ShoppingCart className="w-10 h-10 text-foreground-muted" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-foreground-muted">
              Looks like you haven&apos;t added anything yet. Browse our
              products and find something you love!
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wide py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        <span className="ml-1 text-foreground-muted text-lg">
          ({items.length} {items.length === 1 ? "item" : "items"})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId ?? "default"}`}
              className="bg-background border border-border rounded-xl p-4 flex gap-4"
            >
              {/* Image */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-background-subtle">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-foreground-muted" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2"
                >
                  {item.name}
                </Link>
                {item.variantName && (
                  <p className="text-sm text-foreground-muted mt-0.5">
                    {item.variantName}
                  </p>
                )}
                <p className="text-primary font-bold mt-1">
                  {formatCurrency(item.price)}
                </p>

                {/* Controls row */}
                <div className="flex items-center justify-between mt-3">
                  {/* Qty stepper */}
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.variantId
                        )
                      }
                      className="w-8 h-8 flex items-center justify-center hover:bg-background-subtle transition-colors text-foreground-muted hover:text-foreground"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-foreground">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.variantId
                        )
                      }
                      disabled={
                        item.maxQty !== undefined &&
                        item.quantity >= item.maxQty
                      }
                      className="w-8 h-8 flex items-center justify-center hover:bg-background-subtle transition-colors text-foreground-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line total + remove */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() =>
                        removeItem(item.productId, item.variantId)
                      }
                      className="text-foreground-muted hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Continue Shopping */}
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-background border border-border rounded-xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-foreground mb-5">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">
                  {formatCurrency(sub)}
                </span>
              </div>

              <div className="flex justify-between text-foreground-muted">
                <span>Estimated Shipping</span>
                <span
                  className={cn(
                    "font-medium",
                    shipping === 0 ? "text-green-600" : "text-foreground"
                  )}
                >
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </span>
              </div>

              {shippingMode === "paid" && shipping > 0 && (
                <p className="text-xs text-foreground-muted bg-background-subtle rounded-lg px-3 py-2">
                  Flat shipping rate of <strong>{formatCurrency(shippingCost)}</strong> applied.
                </p>
              )}

              <div className="flex justify-between text-foreground-muted text-xs">
                <span>Incl. VAT ({taxRate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>

              <div className="border-t border-border pt-3 flex justify-between font-bold text-base text-foreground">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-xs text-foreground-muted text-center mt-4">
              Secure checkout. Taxes and final shipping calculated at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
