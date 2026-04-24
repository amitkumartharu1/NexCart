"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Gift, Sparkles, ArrowRight, Clock, Tag, Zap, Star } from "lucide-react";

/* ─── Keyframes injected once ─────────────────────────────────── */
const STYLES = `
  @keyframes offerFloat {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-8px) rotate(0.5deg); }
    66%      { transform: translateY(-4px) rotate(-0.3deg); }
  }
  @keyframes giftFloat {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-10px) rotate(-0.8deg); }
  }
  @keyframes shimmerSweep {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes orbPulse {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%      { opacity: 0.9; transform: scale(1.15); }
  }
  @keyframes digitFlip {
    0%   { transform: rotateX(0deg); }
    50%  { transform: rotateX(-90deg); opacity:0; }
    51%  { transform: rotateX(90deg);  opacity:0; }
    100% { transform: rotateX(0deg);  opacity:1; }
  }
  @keyframes sparkle {
    0%,100% { opacity:0; transform: scale(0) rotate(0deg); }
    50%      { opacity:1; transform: scale(1) rotate(180deg); }
  }
  @keyframes sectionReveal {
    from { opacity:0; transform: translateY(32px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes badgePing {
    0%   { transform: scale(1); opacity: 1; }
    75%  { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  .offer-card-tilt { transition: transform 0.15s ease-out, box-shadow 0.15s ease-out; }
  .offer-shimmer-btn {
    background-size: 200% auto;
    animation: shimmerSweep 2.5s linear infinite;
  }
`;

/* ─── 3D Tilt Card wrapper ─────────────────────────────────────── */
function TiltCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 });
  const [hovering, setHovering] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (ny - 0.5) * -14, y: (nx - 0.5) * 14, gx: nx * 100, gy: ny * 100 });
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setTilt({ x: 0, y: 0, gx: 50, gy: 50 }); }}
      className={`offer-card-tilt ${className}`}
      style={{
        ...style,
        transform: hovering
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(8px)`
          : "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        boxShadow: hovering
          ? "0 32px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.12)"
          : "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
        "--gx": `${tilt.gx}%`,
        "--gy": `${tilt.gy}%`,
      } as React.CSSProperties}
    >
      {/* Dynamic glare */}
      {hovering && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
          style={{
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.13) 0%, transparent 55%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

/* ─── Flip Countdown digit ─────────────────────────────────────── */
function FlipDigit({ value, label }: { value: number; label: string }) {
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlipping(true);
      const t = setTimeout(() => { setPrev(value); setFlipping(false); }, 300);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-12 h-14 flex items-center justify-center rounded-xl overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Fold line */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/40 z-10" />
        <span
          className="text-2xl font-black text-white tabular-nums"
          style={{
            animation: flipping ? "digitFlip 0.3s ease-in-out" : "none",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/50">{label}</span>
    </div>
  );
}

function Countdown({ endDate }: { endDate: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setEnded(true); return { d: 0, h: 0, m: 0, s: 0 }; }
      setEnded(false);
      return {
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      };
    }
    setTime(calc());
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (ended) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
        style={{
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171",
        }}
      >
        <Clock size={14} />
        Offer Ended
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1.5">
      <FlipDigit value={time.d} label="days" />
      <span className="text-white/60 font-black text-xl mb-3.5">:</span>
      <FlipDigit value={time.h} label="hrs" />
      <span className="text-white/60 font-black text-xl mb-3.5">:</span>
      <FlipDigit value={time.m} label="min" />
      <span className="text-white/60 font-black text-xl mb-3.5">:</span>
      <FlipDigit value={time.s} label="sec" />
    </div>
  );
}

/* ─── Floating sparkle particles ──────────────────────────────── */
function Sparkle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `sparkle ${2 + delay}s ease-in-out ${delay}s infinite`,
      }}
    >
      <Star
        size={size}
        className="fill-white text-white"
        style={{ opacity: 0, filter: "drop-shadow(0 0 3px rgba(255,255,255,0.8))" }}
      />
    </div>
  );
}

const OFFER_SPARKLES = [
  { x: 8,  y: 15, delay: 0,    size: 8  },
  { x: 85, y: 20, delay: 0.7,  size: 6  },
  { x: 20, y: 75, delay: 1.3,  size: 5  },
  { x: 92, y: 65, delay: 0.4,  size: 7  },
  { x: 50, y: 8,  delay: 1.8,  size: 5  },
  { x: 70, y: 85, delay: 0.9,  size: 6  },
];

const GIVEAWAY_SPARKLES = [
  { x: 5,  y: 20, delay: 0.2,  size: 7  },
  { x: 80, y: 10, delay: 1.1,  size: 5  },
  { x: 15, y: 80, delay: 0.6,  size: 6  },
  { x: 90, y: 70, delay: 1.5,  size: 8  },
  { x: 45, y: 5,  delay: 0.3,  size: 5  },
  { x: 60, y: 90, delay: 1.9,  size: 6  },
];

/* ─── Main export ──────────────────────────────────────────────── */
export function OfferSection() {
  const [settings, setSettings] = useState<{
    offer_enabled: string;
    offer_title: string;
    offer_description: string;
    offer_badge: string;
    offer_link: string;
    giveaway_enabled: string;
    giveaway_title: string;
    giveaway_description: string;
    giveaway_end_date: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const s = data.settings;
        setSettings({
          offer_enabled:        s["offer_enabled"]        ?? "false",
          offer_title:          s["offer_title"]          ?? "",
          offer_description:    s["offer_description"]    ?? "",
          offer_badge:          s["offer_badge"]          ?? "",
          offer_link:           s["offer_link"]           ?? "",
          giveaway_enabled:     s["giveaway_enabled"]     ?? "false",
          giveaway_title:       s["giveaway_title"]       ?? "",
          giveaway_description: s["giveaway_description"] ?? "",
          giveaway_end_date:    s["giveaway_end_date"]    ?? "",
        });
      })
      .catch(() => {});
  }, []);

  if (!settings) return null;

  const showOffer    = settings.offer_enabled    === "true" && settings.offer_title.trim();
  const showGiveaway = settings.giveaway_enabled === "true" && settings.giveaway_title.trim();
  if (!showOffer && !showGiveaway) return null;

  return (
    <>
      <style>{STYLES}</style>
      <section
        className="relative w-full overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0a0a0f 0%, #0f1a14 40%, #12100a 100%)",
          animation: "sectionReveal 0.7s ease-out",
        }}
      >
        {/* ── Deep background layers ── */}
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Large ambient orbs */}
        <div
          className="absolute -left-32 top-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(5,150,105,0.18) 0%, transparent 65%)",
            animation: "orbPulse 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 bottom-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 65%)",
            animation: "orbPulse 8s ease-in-out 2s infinite",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
          }}
        />

        {/* ── Content ── */}
        <div className="container-wide relative z-10 py-16">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{
                background: "rgba(5,150,105,0.12)",
                border: "1px solid rgba(5,150,105,0.3)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Zap size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Exclusive Deals
              </span>
            </div>
            <h2
              className="text-3xl md:text-4xl font-black text-white leading-tight"
              style={{ textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
            >
              Offers &amp;{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #10b981, #34d399, #fbbf24)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Giveaways
              </span>
            </h2>
            <p className="text-white/50 text-sm mt-2">
              Limited-time deals crafted just for you — don't miss out.
            </p>
          </div>

          {/* Cards grid */}
          <div
            className={`grid gap-6 ${
              showOffer && showGiveaway
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 max-w-xl mx-auto"
            }`}
          >
            {/* ══ Offer Card ══ */}
            {showOffer && (
              <TiltCard
                className="relative rounded-3xl overflow-hidden"
                style={{
                  animation: "offerFloat 7s ease-in-out infinite",
                  background:
                    "linear-gradient(135deg, rgba(5,150,105,0.22) 0%, rgba(16,185,129,0.10) 50%, rgba(0,0,0,0.3) 100%)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Sparkles */}
                {OFFER_SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

                {/* Shimmering top border */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(52,211,153,0.8), rgba(16,185,129,1), rgba(52,211,153,0.8), transparent)",
                    animation: "shimmerSweep 3s linear infinite",
                    backgroundSize: "200% auto",
                  }}
                />

                {/* Decorative glow orbs */}
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
                <div
                  className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(5,150,105,0.25) 0%, transparent 70%)",
                    filter: "blur(16px)",
                  }}
                />

                <div className="relative z-10 p-7 flex flex-col gap-5">
                  {/* Badge */}
                  {settings.offer_badge && (
                    <div className="self-start relative">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white"
                        style={{
                          background: "linear-gradient(135deg, #059669, #10b981)",
                          boxShadow: "0 4px 16px rgba(5,150,105,0.5)",
                        }}
                      >
                        <Tag size={10} />
                        {settings.offer_badge}
                      </span>
                      {/* Ping effect */}
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "rgba(16,185,129,0.4)",
                          animation: "badgePing 2s ease-out infinite",
                        }}
                      />
                    </div>
                  )}

                  {/* Icon + title */}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))",
                        border: "1px solid rgba(16,185,129,0.3)",
                        boxShadow: "0 4px 16px rgba(5,150,105,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <Sparkles size={24} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-black text-xl text-white leading-tight"
                        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                      >
                        {settings.offer_title}
                      </h3>
                      {settings.offer_description && (
                        <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                          {settings.offer_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  {settings.offer_link && (
                    <Link
                      href={settings.offer_link}
                      className="offer-shimmer-btn self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 hover:scale-105 hover:-translate-y-0.5"
                      style={{
                        background:
                          "linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%)",
                        backgroundSize: "200% auto",
                        boxShadow: "0 6px 20px rgba(5,150,105,0.4)",
                      }}
                    >
                      Shop the Offer
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              </TiltCard>
            )}

            {/* ══ Giveaway Card ══ */}
            {showGiveaway && (
              <TiltCard
                className="relative rounded-3xl overflow-hidden"
                style={{
                  animation: "giftFloat 8s ease-in-out 1s infinite",
                  background:
                    "linear-gradient(135deg, rgba(251,146,60,0.22) 0%, rgba(245,158,11,0.10) 50%, rgba(0,0,0,0.3) 100%)",
                  border: "1px solid rgba(251,146,60,0.25)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Sparkles */}
                {GIVEAWAY_SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

                {/* Shimmering top border */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(251,191,36,0.8), rgba(251,146,60,1), rgba(251,191,36,0.8), transparent)",
                    animation: "shimmerSweep 3s linear 1.5s infinite",
                    backgroundSize: "200% auto",
                  }}
                />

                {/* Decorative glow orbs */}
                <div
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(251,146,60,0.35) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
                <div
                  className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(245,158,11,0.25) 0%, transparent 70%)",
                    filter: "blur(16px)",
                  }}
                />

                <div className="relative z-10 p-7 flex flex-col gap-5">
                  {/* Badge */}
                  <div className="self-start relative">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white"
                      style={{
                        background: "linear-gradient(135deg, #d97706, #f59e0b)",
                        boxShadow: "0 4px 16px rgba(245,158,11,0.5)",
                      }}
                    >
                      <Gift size={10} />
                      Giveaway
                    </span>
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "rgba(245,158,11,0.4)",
                        animation: "badgePing 2s ease-out 0.5s infinite",
                      }}
                    />
                  </div>

                  {/* Icon + title */}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(245,158,11,0.15))",
                        border: "1px solid rgba(251,146,60,0.3)",
                        boxShadow: "0 4px 16px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                      }}
                    >
                      <Gift size={24} className="text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-black text-xl text-white leading-tight"
                        style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                      >
                        {settings.giveaway_title}
                      </h3>
                      {settings.giveaway_description && (
                        <p className="text-white/60 text-sm mt-1.5 leading-relaxed">
                          {settings.giveaway_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Countdown */}
                  {settings.giveaway_end_date && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={12} className="text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">
                          Ends in
                        </span>
                      </div>
                      <Countdown endDate={settings.giveaway_end_date} />
                    </div>
                  )}
                </div>
              </TiltCard>
            )}
          </div>
        </div>

        {/* Bottom fade transition into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, var(--background))",
          }}
        />
      </section>
    </>
  );
}
