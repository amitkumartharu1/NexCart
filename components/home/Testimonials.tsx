"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Star, Quote, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";

/* ─── Keyframes ────────────────────────────────────────────────── */
const STYLES = `
  @keyframes cardFloat {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-7px); }
  }
  @keyframes scrollTrack {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes testiReveal {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0px)  scale(1); }
  }
  @keyframes orbGlow {
    0%,100% { opacity: 0.4; transform: scale(1); }
    50%      { opacity: 0.75; transform: scale(1.15); }
  }
  @keyframes starPop {
    0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
    60%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes quoteFloat {
    0%,100% { transform: translateY(0px) rotate(-4deg); }
    50%      { transform: translateY(-4px) rotate(-6deg); }
  }
  @keyframes verifiedPop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  .testi-track-wrap:hover .testi-track {
    animation-play-state: paused;
  }
  .testi-card {
    transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.2s ease;
    will-change: transform;
  }
  .testi-card:hover {
    transform: translateY(-6px) scale(1.015) !important;
    animation-play-state: paused;
  }
`;

/* ─── Avatar gradient palette ──────────────────────────────────── */
const AVATAR_GRADS = [
  "linear-gradient(135deg,#1e3a8a,#2563eb)",
  "linear-gradient(135deg,#064e3b,#059669)",
  "linear-gradient(135deg,#4c1d95,#7c3aed)",
  "linear-gradient(135deg,#7c2d12,#ea580c)",
  "linear-gradient(135deg,#713f12,#ca8a04)",
  "linear-gradient(135deg,#881337,#dc2626)",
];
const AVATAR_GLOWS = [
  "59,130,246",
  "16,185,129",
  "139,92,246",
  "249,115,22",
  "234,179,8",
  "239,68,68",
];

/* ─── Data ─────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "Mumbai, IN",
    initials: "SM",
    rating: 5,
    product: "Wireless Pro Headphones",
    body: "Absolutely love my new headphones. The quality is exceptional and delivery was faster than expected. NexCart is my go-to now.",
    floatDelay: "0s",
    gradIdx: 0,
  },
  {
    name: "James K.",
    location: "Bangalore, IN",
    initials: "JK",
    rating: 5,
    product: "Device Repair Service",
    body: "The repair service was outstanding. My laptop was fixed in 2 hours and works like new. Truly professional and knowledgeable team.",
    floatDelay: "0.9s",
    gradIdx: 1,
  },
  {
    name: "Priya R.",
    location: "Delhi, IN",
    initials: "PR",
    rating: 5,
    product: "Smart Watch Ultra",
    body: "Great selection with competitive pricing. The comparison feature helped me make the right choice. Highly recommended to everyone!",
    floatDelay: "0.4s",
    gradIdx: 2,
  },
  {
    name: "Tom W.",
    location: "Hyderabad, IN",
    initials: "TW",
    rating: 5,
    product: "Gaming Mouse Pro",
    body: "Ordered a gaming setup and everything arrived perfectly packaged. Customer support was incredibly helpful throughout.",
    floatDelay: "1.3s",
    gradIdx: 3,
  },
  {
    name: "Nina S.",
    location: "Chennai, IN",
    initials: "NS",
    rating: 5,
    product: "Tech Consultation",
    body: "The consultation saved me hours of research. The specialist knew exactly what I needed and suggested the perfect solution.",
    floatDelay: "0.6s",
    gradIdx: 4,
  },
  {
    name: "Alex B.",
    location: "Pune, IN",
    initials: "AB",
    rating: 5,
    product: "Smart Devices",
    body: "Returns process was painless. Ordered the wrong size, contacted support, and had a replacement in 2 days. Impressive!",
    floatDelay: "1.1s",
    gradIdx: 5,
  },
];

/* Doubled for seamless infinite scroll */
const DOUBLED = [...TESTIMONIALS, ...TESTIMONIALS];

/* ─── Single card ──────────────────────────────────────────────── */
function TestiCard({
  t,
  idx,
  isStatic = false,
}: {
  t: (typeof TESTIMONIALS)[number];
  idx: number;
  isStatic?: boolean;
}) {
  const grad = AVATAR_GRADS[t.gradIdx];
  const glowRgb = AVATAR_GLOWS[t.gradIdx];

  return (
    <div
      className="testi-card relative rounded-3xl overflow-hidden flex-shrink-0"
      style={{
        width: 320,
        background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        animation: isStatic
          ? `testiReveal 0.65s cubic-bezier(0.22,1,0.36,1) ${idx * 0.1}s both`
          : `cardFloat ${5 + (idx % 3)}s ease-in-out ${t.floatDelay} infinite`,
      }}
    >
      {/* Shimmer top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${glowRgb},0.7), transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Corner glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(${glowRgb},0.18) 0%, transparent 70%)`,
          filter: "blur(16px)",
          animation: `orbGlow ${4 + (idx % 3)}s ease-in-out infinite`,
        }}
      />

      <div className="relative z-10 p-6 flex flex-col gap-4">
        {/* Quote icon */}
        <div
          className="absolute top-5 right-5 opacity-10"
          style={{ animation: "quoteFloat 4s ease-in-out infinite" }}
        >
          <Quote size={32} style={{ color: `rgba(${glowRgb},1)` }} />
        </div>

        {/* Stars */}
        <div className="flex gap-1">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className="fill-yellow-400 text-yellow-400"
              style={{ animation: `starPop 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both` }}
            />
          ))}
        </div>

        {/* Review body */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          &ldquo;{t.body}&rdquo;
        </p>

        {/* Product tag */}
        <div
          className="inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: `rgba(${glowRgb},0.12)`,
            border: `1px solid rgba(${glowRgb},0.25)`,
            color: `rgba(${glowRgb},1)`,
          }}
        >
          Re: {t.product}
        </div>

        {/* Divider */}
        <div
          className="h-px rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${glowRgb},0.4), transparent)`,
          }}
        />

        {/* Author row */}
        <div className="flex items-center gap-3">
          {/* 3D avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white select-none"
              style={{
                background: grad,
                boxShadow: `0 8px 24px rgba(${glowRgb},0.45), inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            >
              {t.initials}
            </div>
            {/* Verified badge */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
              style={{
                boxShadow: "0 0 8px rgba(16,185,129,0.6)",
                animation: "verifiedPop 0.4s cubic-bezier(0.22,1,0.36,1) 0.3s both",
              }}
            >
              <BadgeCheck size={10} className="text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Name + location */}
          <div>
            <p className="text-sm font-bold text-white leading-tight">{t.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              {t.location}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Export ───────────────────────────────────────────────────── */
export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  /* Manual arrow scroll (static grid on small screens) */
  const scrollBy = useCallback((dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: "smooth" });
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <section
        className="relative w-full overflow-hidden"
        style={{
          background: "linear-gradient(170deg, #08080d 0%, #0d1208 45%, #0b0810 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), " +
              "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Ambient glows */}
        <div
          className="absolute top-0 left-1/4 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />

        <div className="relative z-10 py-20">
          {/* ── Header ── */}
          <div className="text-center max-w-2xl mx-auto mb-14 px-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.28)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Star size={11} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em]">
                Customer Reviews
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight"
            >
              What Our{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #06b6d4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Customers Say
              </span>
            </h2>

            {/* Aggregate rating */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-white">4.9</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                from 12,000+ verified reviews
              </span>
            </div>
          </div>

          {/* ── Infinite marquee (md+) ── */}
          <div className="relative hidden md:block">
            {/* Left edge fade */}
            <div
              className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, #08080d 0%, transparent 100%)",
              }}
            />
            {/* Right edge fade */}
            <div
              className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to left, #08080d 0%, transparent 100%)",
              }}
            />

            <div className="testi-track-wrap overflow-hidden">
              <div
                className="testi-track flex gap-5 py-6"
                style={{
                  width: "max-content",
                  animation: "scrollTrack 40s linear infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
                {DOUBLED.map((t, i) => (
                  <TestiCard key={`${t.name}-${i}`} t={t} idx={i} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Scrollable row (sm only) ── */}
          <div className="relative md:hidden px-4">
            <div
              ref={trackRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none" }}
            >
              {TESTIMONIALS.map((t, i) => (
                <div key={t.name} className="snap-start">
                  <TestiCard t={t} idx={i} isStatic />
                </div>
              ))}
            </div>

            {/* Arrow buttons */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => scrollBy(-1)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* ── Bottom trust line ── */}
          <div className="text-center mt-10 px-4">
            <div className="inline-flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              <BadgeCheck size={13} className="text-emerald-500" />
              All reviews are from verified NexCart purchases
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, var(--background) 100%)",
          }}
        />
      </section>
    </>
  );
}
