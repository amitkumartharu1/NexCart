"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  title?: string | null;
  subtitle?: string | null;
  assetUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  ctaStyle?: string | null;
  mode: "static" | "3d" | "4d";
  settings?: Record<string, unknown> | null;
}

// 3D tilt card using mouse position
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    const y = -((e.clientX - rect.left) / rect.width - 0.5) * 20;
    setTilt({ x, y });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={className}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      <motion.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ImageBannerSection({ title, subtitle, assetUrl, ctaText, ctaUrl, ctaStyle, mode }: Props) {
  const bgColor = (mode === "3d" || mode === "4d")
    ? "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
    : "linear-gradient(135deg, #1a1a2e, #16213e)";

  const content = (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: 360, background: bgColor }}>
      {/* Background image */}
      {assetUrl && (
        <>
          <Image
            src={assetUrl}
            alt={title ?? "Banner"}
            fill
            className="object-cover"
            style={{
              opacity: mode === "static" ? 1 : 0.85,
              ...(mode === "3d" ? { transform: "translateZ(-40px) scale(1.1)" } : {}),
            }}
          />
          {/* Gradient overlay — lighter so the image shows through */}
          <div className="absolute inset-0" style={{
            background: mode === "static"
              ? "linear-gradient(to right, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.05))"
              : "linear-gradient(to right, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.15))",
          }} />
        </>
      )}

      {/* Neon glow orbs for 3D/4D mode */}
      {(mode === "3d" || mode === "4d") && (
        <>
          <div className="absolute top-8 right-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
          <div className="absolute bottom-8 left-16 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }} />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-10 py-14" style={{ minHeight: 360 }}>
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3"
          >
            {title}
          </motion.h2>
        )}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base text-white/70 max-w-md mb-6"
          >
            {subtitle}
          </motion.p>
        )}
        {ctaText && ctaUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href={ctaUrl}
              className={
                ctaStyle === "secondary"
                  ? "inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all"
                  : ctaStyle === "ghost"
                    ? "inline-flex items-center gap-2 text-white font-semibold text-sm underline underline-offset-4 hover:opacity-80 transition-opacity"
                    : "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg"
              }
              style={ctaStyle === "primary" ? {
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 20px rgba(99,102,241,0.4)",
              } : undefined}
            >
              {ctaText}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );

  if (mode === "3d") {
    return <TiltCard className="w-full">{content}</TiltCard>;
  }

  return <div className="w-full">{content}</div>;
}
