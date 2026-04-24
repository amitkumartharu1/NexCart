"use client";

import { motion } from "framer-motion";

interface Feature {
  icon?: string;
  title: string;
  description?: string;
}

interface Props {
  title?: string | null;
  subtitle?: string | null;
  mode: "static" | "3d" | "4d";
  settings?: Record<string, unknown> | null;
}

const DEFAULT_FEATURES: Feature[] = [
  { icon: "⚡", title: "Lightning Fast", description: "Optimized for peak performance in any condition." },
  { icon: "🔒", title: "Ultra Secure", description: "Military-grade protection built into every layer." },
  { icon: "🎯", title: "Precision Built", description: "Engineered to exact tolerances for flawless operation." },
  { icon: "♻️", title: "Eco Friendly", description: "Sustainable materials. Responsible manufacturing." },
];

export function FeatureListSection({ title, subtitle, mode, settings }: Props) {
  const features: Feature[] = Array.isArray((settings as any)?.features)
    ? (settings as any).features
    : DEFAULT_FEATURES;

  const isAnimated = mode === "3d" || mode === "4d";

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <motion.div
          initial={isAnimated ? { opacity: 0, y: 24 } : false}
          whileInView={isAnimated ? { opacity: 1, y: 0 } : undefined}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          {subtitle && (
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{subtitle}</p>
          )}
          {title && (
            <h3 className="text-2xl font-black text-foreground">{title}</h3>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feat, i) => (
          <motion.div
            key={i}
            initial={isAnimated ? { opacity: 0, y: 24, scale: 0.95 } : false}
            whileInView={isAnimated ? { opacity: 1, y: 0, scale: 1 } : undefined}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.45, type: "spring", stiffness: 180 }}
            whileHover={isAnimated ? { y: -4, scale: 1.02 } : undefined}
            className="relative group rounded-2xl border border-border p-6 flex flex-col gap-3 overflow-hidden cursor-default"
            style={{ background: "var(--background-subtle, #f9fafb)" }}
          >
            {/* Hover glow for 3d/4d */}
            {isAnimated && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
            )}

            {/* Animated top border for 4D */}
            {mode === "4d" && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-0.5 origin-left"
                style={{ background: "linear-gradient(90deg, #6366f1, #ec4899)" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
              />
            )}

            {feat.icon && (
              <span className="text-3xl">{feat.icon}</span>
            )}
            <h4 className="font-bold text-foreground text-sm">{feat.title}</h4>
            {feat.description && (
              <p className="text-xs text-foreground-muted leading-relaxed">{feat.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
