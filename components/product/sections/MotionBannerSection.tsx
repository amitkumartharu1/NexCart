"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

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

// Floating particle dot
function Particle({ delay, x, y, size, color }: {
  delay: number; x: string; y: string; size: number; color: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, opacity: 0.5 }}
      animate={{
        y: [0, -24, 0],
        x: [0, 8, -8, 0],
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.3, 1],
      }}
      transition={{
        duration: 3 + delay,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

const PARTICLES = [
  { delay: 0,   x: "10%",  y: "20%", size: 8,  color: "#6366f1" },
  { delay: 0.5, x: "85%",  y: "15%", size: 5,  color: "#ec4899" },
  { delay: 1.0, x: "70%",  y: "75%", size: 10, color: "#8b5cf6" },
  { delay: 1.5, x: "20%",  y: "70%", size: 6,  color: "#3b82f6" },
  { delay: 0.7, x: "50%",  y: "10%", size: 4,  color: "#a78bfa" },
  { delay: 2.0, x: "40%",  y: "85%", size: 7,  color: "#f43f5e" },
  { delay: 0.3, x: "92%",  y: "50%", size: 5,  color: "#22d3ee" },
  { delay: 1.8, x: "5%",   y: "50%", size: 9,  color: "#818cf8" },
];

export function MotionBannerSection({ title, subtitle, assetUrl, ctaText, ctaUrl, ctaStyle, mode }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax transforms
  const bgY    = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "30%"]), { stiffness: 60, damping: 20 });
  const textY  = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]), { stiffness: 60, damping: 20 });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale   = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.92]);

  // Animated lighting gradient
  const gradientX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const is4D = mode === "4d";

  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: 420 }}>
      {/* Background layer */}
      <motion.div
        className="absolute inset-0"
        style={{ y: is4D ? bgY : 0 }}
      >
        {assetUrl ? (
          <>
            <Image src={assetUrl} alt={title ?? "Banner"} fill className="object-cover" />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(15,5,40,0.7) 100%)",
            }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          }} />
        )}
      </motion.div>

      {/* Cinematic animated light beam */}
      {is4D && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 40% at ${gradientX} 50%, rgba(99,102,241,0.25) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Floating particles */}
      {is4D && PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* Static subtle glow for 3d mode */}
      {mode === "3d" && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 50% 60% at 80% 50%, rgba(139,92,246,0.2) 0%, transparent 70%)",
          }} />
        </>
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-start justify-center px-10 py-16"
        style={is4D ? { y: textY, opacity, scale } : {}}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        {/* Animated badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-purple-400/30"
          style={{
            background: "rgba(99,102,241,0.15)",
            color: "#a78bfa",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          {is4D ? "4D Motion Experience" : "3D Visual Showcase"}
        </motion.div>

        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-3xl sm:text-5xl font-black text-white leading-tight mb-4 max-w-xl"
            style={{ textShadow: "0 0 40px rgba(139,92,246,0.5)" }}
          >
            {title}
          </motion.h2>
        )}

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-white/65 text-base max-w-md mb-8 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {ctaText && ctaUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, type: "spring", stiffness: 200 }}
          >
            <Link
              href={ctaUrl}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
              style={{
                background: ctaStyle === "secondary"
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
                boxShadow: ctaStyle !== "secondary"
                  ? "0 0 30px rgba(139,92,246,0.6), 0 4px 20px rgba(0,0,0,0.3)"
                  : "none",
                border: ctaStyle === "secondary" ? "1px solid rgba(255,255,255,0.2)" : "none",
              }}
            >
              {ctaText}
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
