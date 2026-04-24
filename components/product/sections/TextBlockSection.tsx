"use client";

import { motion } from "framer-motion";

interface Props {
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  mode: "static" | "3d" | "4d";
  settings?: Record<string, unknown> | null;
}

export function TextBlockSection({ title, subtitle, body, mode }: Props) {
  const isAnimated = mode === "3d" || mode === "4d";

  return (
    <motion.div
      initial={isAnimated ? { opacity: 0, y: 32 } : false}
      whileInView={isAnimated ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.65 }}
      className="relative rounded-2xl overflow-hidden"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 rounded-2xl border border-border"
        style={{ background: "var(--background-subtle, #f9fafb)" }} />

      {/* 4D animated light accent */}
      {mode === "4d" && (
        <motion.div
          className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #6366f1, #ec4899, #6366f1)", backgroundSize: "200% 100%" }}
          animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative z-10 px-8 py-10">
        {title && (
          <motion.h3
            initial={isAnimated ? { opacity: 0, x: -20 } : false}
            whileInView={isAnimated ? { opacity: 1, x: 0 } : undefined}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-2xl font-black text-foreground mb-2"
          >
            {title}
          </motion.h3>
        )}
        {subtitle && (
          <motion.p
            initial={isAnimated ? { opacity: 0 } : false}
            whileInView={isAnimated ? { opacity: 1 } : undefined}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider"
          >
            {subtitle}
          </motion.p>
        )}
        {body && (
          <motion.div
            initial={isAnimated ? { opacity: 0, y: 12 } : false}
            whileInView={isAnimated ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="prose prose-sm max-w-none text-foreground-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>
    </motion.div>
  );
}
