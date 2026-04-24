"use client";

import { useCartStore } from "@/lib/store/cart";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { formatCurrency as formatPrice } from "@/lib/utils/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, itemCount, subtotal } = useCartStore();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={closeCart}
        aria-hidden
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="font-semibold text-foreground">Shopping Cart</h2>
            {itemCount() > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount()}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-background-subtle transition-colors text-foreground-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-background-subtle flex items-center justify-center">
                <ShoppingBag size={28} className="text-foreground-muted" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Your cart is empty</p>
                <p className="text-sm text-foreground-muted mt-1">Start shopping to add items</p>
              </div>
              <Link
                href="/shop"
                onClick={closeCart}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="flex gap-3">
                <Link href={`/products/${item.slug}`} onClick={closeCart} className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-background-subtle border border-border">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`} onClick={closeCart}>
                    <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">{item.name}</p>
                  </Link>
                  {item.variantName && (
                    <p className="text-xs text-foreground-muted">{item.variantName}</p>
                  )}
                  <p className="text-sm font-semibold text-primary mt-0.5">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 border border-border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                        className="w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                        disabled={item.quantity >= (item.maxQty ?? 99)}
                        className="w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground-muted">Subtotal ({itemCount()} items)</span>
              <span className="font-bold text-foreground text-base">{formatPrice(subtotal())}</span>
            </div>
            <p className="text-xs text-foreground-muted">Shipping and taxes calculated at checkout</p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
            >
              Checkout <ArrowRight size={16} />
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="flex items-center justify-center w-full py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
            >
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
