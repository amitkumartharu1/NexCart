"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { ShieldCheck, Truck, RefreshCw, Headphones, Star, Zap } from "lucide-react";

/* ─── Keyframes ────────────────────────────────────────────────── */
const STYLES = `
  @keyframes whyReveal {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0px)  scale(1); }
  }
  @keyframes iconFloat {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-5px) rotate(2deg); }
  }
  @keyframes orbPulseWhy {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.2); }
  }
  @keyframes shimmerLine {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .why-card-tilt {
    transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.2s ease;
    will-change: transform;
  }
`;

const FEATURES = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on all orders over Rs. 999. Express and same-day options available.",
    grad: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    glow: "59,130,246",
    floatDelay: "0s",
    revealDelay: "0s",
    orbDuration: "7.8s",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "Bank-level 256-bit encryption on every transaction. Your data is always safe.",
    grad: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
    glow: "16,185,129",
    floatDelay: "0.7s",
    revealDelay: "0.08s",
    orbDuration: "6.2s",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "14-day hassle-free returns on all products. No questions asked, no stress.",
    grad: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    glow: "139,92,246",
    floatDelay: "1.1s",
    revealDelay: "0.16s",
    orbDuration: "5.9s",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Real humans ready to help around the clock via live chat, email, or phone.",
    grad: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",
    glow: "249,115,22",
    floatDelay: "0.4s",
    revealDelay: "0.24s",
    orbDuration: "6.5s",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description: "Every review is from a verified purchase — no fake ratings, ever.",
    grad: "linear-gradient(135deg, #713f12 0%, #ca8a04 100%)",
    glow: "234,179,8",
    floatDelay: "0.9s",
    revealDelay: "0.32s",
    orbDuration: "7.1s",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Orders confirmed and dispatched within 24 hours on all business days.",
    grad: "linear-gradient(135deg, #881337 0%, #dc2626 100%)",
    glow: "239,68,68",
    floatDelay: "0.2s",
    revealDelay: "0.40s",
    orbDuration: "6.7s",
  },
];

/* ─── Single feature card with 3D tilt ────────────────────────── */
function FeatureCard({
  feature,
}: {
  feature: (typeof FEATURES)[number];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  /* Intersection observer — entrance animation */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top)  / rect.height;
    setTilt({ rx: (ny - 0.5) * -18, ry: (nx - 0.5) * 18, gx: nx * 100, gy: ny * 100 });
  }, []);

  const { icon: Icon, title, description, grad, glow, floatDelay, revealDelay, orbDuration } = feature;
  const glowRgb = `rgba(${glow},`;

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 }); }}
      className="why-card-tilt relative rounded-3xl overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        animation: visible
          ? `whyReveal 0.65s cubic-bezier(0.22,1,0.36,1) ${revealDelay} both`
          : "none",
        background: `linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${hovering ? `rgba(${glow},0.45)` : "rgba(255,255,255,0.07)"}`,
        backdropFilter: "blur(20px)",
        transform: hovering
          ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(16px) scale(1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)",
        boxShadow: hovering
          ? `0 32px 60px rgba(0,0,0,0.35), 0 0 60px ${glowRgb}0.2), inset 0 1px 0 rgba(255,255,255,0.1)`
          : "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Glare overlay */}
      {hovering && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-20"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Ambient corner glow */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${glowRgb}0.22) 0%, transparent 70%)`,
          filter: "blur(20px)",
          animation: `orbPulseWhy ${orbDuration} ease-in-out infinite`,
        }}
      />

      {/* Shimmer top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${glow},0.8), transparent)`,
          opacity: hovering ? 1 : 0.3,
          transition: "opacity 0.3s ease",
          backgroundSize: "200% auto",
          animation: hovering ? "shimmerLine 2s linear infinite" : "none",
        }}
      />

      <div className="relative z-10 p-6 flex flex-col gap-5">
        {/* 3D Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: grad,
            boxShadow: hovering
              ? `0 12px 32px ${glowRgb}0.55), inset 0 1px 0 rgba(255,255,255,0.25)`
              : `0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
            transition: "box-shadow 0.3s ease",
            animation: hovering ? `iconFloat 2.5s ease-in-out ${floatDelay} infinite` : "none",
          }}
        >
          <Icon size={24} className="text-white" strokeWidth={1.8} />
        </div>

        {/* Text */}
        <div>
          <h3 className="text-base font-bold text-white leading-tight mb-2">{title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            {description}
          </p>
        </div>

        {/* Accent line */}
        <div
          className="h-px rounded-full"
          style={{
            background: grad,
            backgroundSize: "200% auto",
            opacity: hovering ? 0.8 : 0.2,
            transition: "opacity 0.3s ease",
            animation: hovering ? "shimmerLine 2.5s linear infinite" : "none",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */
export function WhyNexCart() {
  return (
    <>
      <style>{STYLES}</style>
      <section
        className="relative w-full overflow-hidden"
        style={{ background: "linear-gradient(170deg, #040408 0%, #07100d 45%, #09070f 100%)" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Large background glows */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />

        <div className="container-wide relative z-10 py-20">
          {/* ── Header ── */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.28)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Zap size={11} className="text-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em]">
                Why Choose Us
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight"
              style={{ textShadow: "0 4px 32px rgba(0,0,0,0.6)" }}
            >
              Built for Your{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #eab308 0%, #f97316 50%, #a855f7 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Confidence
              </span>
            </h2>
            <p
              className="mt-4 text-base leading-relaxed max-w-lg mx-auto"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Every decision we make is designed to give you the best possible
              experience — from browsing to your door.
            </p>
          </div>

          {/* ── Cards grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} feature={f} />
            ))}
          </div>
        </div>

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
          }}
        />
      </section>
    </>
  );
}
