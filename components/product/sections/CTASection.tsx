"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCartStore } from "@/lib/store/cart";

interface Props {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  ctaStyle?: string | null;
  mode: "static" | "3d" | "4d";
  settings?: Record<string, unknown> | null;
  // For in-banner Add to Cart
  productId?: string;
  productName?: string;
  productPrice?: number;
  productSlug?: string;
  basePrice?: number;
  comparePrice?: number | null;
}

export function CTASection({
  title,
  subtitle,
  body,
  ctaText,
  ctaUrl,
  ctaStyle,
  mode,
  settings,
  productName,
  productPrice,
  productSlug,
  basePrice,
  comparePrice,
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isAnimated = mode === "3d" || mode === "4d";

  const showPricing = !!(basePrice && basePrice > 0);
  const discountPct =
    comparePrice && comparePrice > (basePrice ?? 0) && (basePrice ?? 0) > 0
      ? Math.round(((comparePrice - (basePrice ?? 0)) / comparePrice) * 100)
      : null;

  function handleAddToCart() {
    if (!productId || !productName) return;
    addItem({
      productId: productId!,
      name: productName!,
      image: "",
      price: basePrice ?? 0,
      quantity: 1,
      maxQty: 99,
      slug: productSlug ?? "",
    });
    openCart();
  }

  let productId = (settings as any)?.productId as string | undefined;

  return (
    <motion.div
      initial={isAnimated ? { opacity: 0, y: 32 } : false}
      whileInView={isAnimated ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ minHeight: 240 }}
    >
      {/* Background */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #6366f1 100%)" }}
      />

      {/* Animated glow */}
      {mode === "4d" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 60% at 80% 50%, rgba(236,72,153,0.3) 0%, transparent 70%)" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Particle dots */}
      {mode === "4d" && Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            left: `${(i * 8.3) % 100}%`,
            top: `${(i * 13.7) % 100}%`,
            background: i % 2 === 0 ? "#a78bfa" : "#f9a8d4",
            opacity: 0.4,
          }}
          animate={{ y: [0, -16, 0], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 px-10 py-12">
        <div className="flex-1">
          {subtitle && (
            <motion.p
              initial={isAnimated ? { opacity: 0, x: -16 } : false}
              whileInView={isAnimated ? { opacity: 1, x: 0 } : undefined}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2"
            >
              {subtitle}
            </motion.p>
          )}
          {title && (
            <motion.h3
              initial={isAnimated ? { opacity: 0, y: 16 } : false}
              whileInView={isAnimated ? { opacity: 1, y: 0 } : undefined}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-2xl sm:text-3xl font-black text-white mb-3"
            >
              {title}
            </motion.h3>
          )}
          {body && (
            <p className="text-white/60 text-sm max-w-sm">{body}</p>
          )}
        </div>

        <motion.div
          initial={isAnimated ? { opacity: 0, scale: 0.85 } : false}
          whileInView={isAnimated ? { opacity: 1, scale: 1 } : undefined}
          viewport={{ once: true }}
          transition={{ delay: 0.25, type: "spring", stiffness: 180 }}
          className="flex flex-col items-center sm:items-end gap-4"
        >
          {/* Animated price display */}
          {showPricing && (
            <div className="text-center sm:text-right">
              {comparePrice && comparePrice > (basePrice ?? 0) && (
                <div className="flex items-center gap-2 justify-center sm:justify-end mb-1">
                  <span className="text-sm line-through text-white/40">
                    ₹{comparePrice.toLocaleString()}
                  </span>
                  {discountPct && (
                    <motion.span
                      animate={mode === "4d" ? { scale: [1, 1.1, 1], boxShadow: ["0 0 8px #dc2626", "0 0 20px #dc2626", "0 0 8px #dc2626"] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs font-black px-2 py-0.5 rounded-full text-white"
                      style={{ background: "#dc2626" }}
                    >
                      -{discountPct}%
                    </motion.span>
                  )}
                </div>
              )}
              {basePrice && (
                <motion.p
                  animate={mode === "4d" ? { textShadow: ["0 0 10px #ff3b3b", "0 0 24px #ff6b6b", "0 0 10px #ff3b3b"] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl font-black"
                  style={{ color: "#ff3b3b" }}
                >
                  ₹{basePrice.toLocaleString()}
                </motion.p>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* In-banner Add to Cart */}
            {productId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #dc2626, #ef4444)",
                  boxShadow: "0 0 20px rgba(220,38,38,0.5)",
                }}
              >
                Add to Cart
              </motion.button>
            )}
            {ctaText && ctaUrl && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={ctaUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={
                    ctaStyle === "secondary"
                      ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }
                      : {
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        boxShadow: "0 0 24px rgba(99,102,241,0.5)",
                      }
                  }
                >
                  {ctaText}
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
