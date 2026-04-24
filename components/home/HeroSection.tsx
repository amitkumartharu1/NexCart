"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, Star, Truck, Headphones } from "lucide-react";

// Default hero background — premium laptop photo
const DEFAULT_BG = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=2560&fit=crop";

// Deterministic particles — no Math.random() (prevents hydration mismatch)
const PARTICLES = [
  { x: 8,  y: 15, s: 2,   d: 0,   dur: 7  },
  { x: 18, y: 72, s: 1.5, d: 1.2, dur: 9  },
  { x: 25, y: 38, s: 3,   d: 0.5, dur: 6  },
  { x: 35, y: 88, s: 1,   d: 2.1, dur: 11 },
  { x: 42, y: 52, s: 2.5, d: 0.8, dur: 8  },
  { x: 55, y: 22, s: 1.5, d: 1.7, dur: 7  },
  { x: 63, y: 65, s: 2,   d: 0.3, dur: 10 },
  { x: 72, y: 40, s: 1,   d: 2.5, dur: 6  },
  { x: 80, y: 78, s: 2.5, d: 1.0, dur: 9  },
  { x: 88, y: 30, s: 1.5, d: 0.6, dur: 7  },
  { x: 5,  y: 55, s: 1,   d: 1.9, dur: 8  },
  { x: 48, y: 92, s: 3,   d: 0.4, dur: 12 },
  { x: 92, y: 60, s: 2,   d: 1.4, dur: 7  },
  { x: 15, y: 45, s: 1.5, d: 2.8, dur: 9  },
  { x: 70, y: 10, s: 2,   d: 0.9, dur: 6  },
];

const TRUST_BADGES = [
  { icon: Truck,       label: "Free Shipping" },
  { icon: ShieldCheck, label: "Secure Pay"    },
  { icon: Star,        label: "4.9★ Rated"    },
  { icon: Zap,         label: "Fast Delivery" },
];

export interface HeroBanner {
  id: string; title: string; subtitle: string | null; description: string | null;
  image: string; link: string | null; ctaText: string | null;
}
export interface HeroSettings {
  title: string; subtitle: string;
  ctaPrimary: string; ctaPrimaryUrl: string;
  ctaSecondary: string; ctaSecondaryUrl: string;
}

const DEFAULTS: HeroSettings = {
  title: "Upgrade Your Tech Experience",
  subtitle: "Premium gadgets, unbeatable deals, and lightning-fast delivery — all in one place.",
  ctaPrimary: "Shop Now",        ctaPrimaryUrl: "/shop",
  ctaSecondary: "Explore Deals", ctaSecondaryUrl: "/shop?filter=sale",
};

interface HeroSectionProps {
  banner?: HeroBanner | null;
  settings?: Partial<HeroSettings> | null;
  bgImage?: string | null;
  overlayOpacity?: string | null;
}

export function HeroSection({ banner, settings, bgImage, overlayOpacity }: HeroSectionProps) {
  const s: HeroSettings = { ...DEFAULTS, ...settings };
  const hasBannerImage = !!(banner?.image && banner.image.length > 0);

  const headline   = banner?.title    || s.title;
  const subline    = banner?.subtitle || s.subtitle;
  const ctaPrimary = banner?.ctaText  || s.ctaPrimary;
  const ctaHref    = banner?.link     || s.ctaPrimaryUrl;

  // Background: admin-uploaded → prop → default laptop photo
  const backgroundSrc = bgImage || DEFAULT_BG;
  const overlayAlpha  = parseFloat(overlayOpacity ?? "0.72");

  // Mouse parallax
  const orb1  = useRef<HTMLDivElement>(null);
  const orb2  = useRef<HTMLDivElement>(null);
  const float = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth  - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      if (orb1.current)  orb1.current.style.transform  = `translate(${x * 28}px, ${y * 28}px)`;
      if (orb2.current)  orb2.current.style.transform  = `translate(${-x * 18}px, ${-y * 18}px)`;
      if (float.current) float.current.style.transform =
        `perspective(1200px) rotateY(${x * -7}deg) rotateX(${y * 5}deg) translateZ(20px)`;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <>
      <style>{`
        @keyframes heroFloat {
          0%,100% { transform: perspective(1200px) rotateY(-3deg) rotateX(2deg) translateZ(20px) translateY(0px); }
          50%      { transform: perspective(1200px) rotateY(-3deg) rotateX(2deg) translateZ(20px) translateY(-16px); }
        }
        @keyframes particle {
          0%,100% { opacity:0.2; transform:translateY(0) scale(1); }
          50%      { opacity:0.7; transform:translateY(-14px) scale(1.5); }
        }
        @keyframes shimmerHero {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes badgePing {
          0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.45); }
          50%      { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
        }
        @keyframes bgZoom {
          0%   { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        .hero-grad-text {
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #f0abfc, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerHero 4s linear infinite;
        }
        .hero-cta-primary {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          box-shadow: 0 0 20px rgba(59,130,246,0.35);
          transition: all 0.3s ease;
        }
        .hero-cta-primary:hover {
          box-shadow: 0 0 32px rgba(59,130,246,0.6), 0 0 60px rgba(124,58,237,0.25);
          transform: translateY(-2px) scale(1.03);
        }
        .hero-cta-secondary {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .hero-cta-secondary:hover {
          background: rgba(255,255,255,0.14);
          box-shadow: 0 0 20px rgba(255,255,255,0.08);
          transform: translateY(-2px);
        }
        .product-card-float { animation: heroFloat 4.5s ease-in-out infinite; }
        .product-card-link  { transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .product-card-link:hover { transform: scale(1.02); }
      `}</style>

      <section className="relative min-h-screen flex items-center overflow-hidden">

        {/* ── Layer 1: Background image with slow zoom ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          style={{ animation: "bgZoom 20s ease-in-out alternate infinite" }}
        />

        {/* ── Layer 2: Primary dark overlay (admin-controllable opacity) ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(160deg,
              rgba(2,2,18,${overlayAlpha}) 0%,
              rgba(3,7,32,${overlayAlpha - 0.05}) 40%,
              rgba(6,2,21,${overlayAlpha - 0.08}) 70%,
              rgba(1,1,8,${overlayAlpha}) 100%)`,
          }}
        />

        {/* ── Layer 3: Blue/purple glow accents ── */}
        <div
          ref={orb1}
          className="absolute pointer-events-none transition-transform duration-700 ease-out"
          style={{
            width: 700, height: 700, borderRadius: "50%",
            top: "-10%", left: "-15%",
            background: "radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div
          ref={orb2}
          className="absolute pointer-events-none transition-transform duration-700 ease-out"
          style={{
            width: 500, height: 500, borderRadius: "50%",
            bottom: "0%", right: "10%",
            background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
        />

        {/* ── Layer 4: Grid pattern ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* ── Particles ── */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.s * 2, height: p.s * 2,
              background: i % 3 === 0 ? "rgba(96,165,250,0.9)" : i % 3 === 1 ? "rgba(167,139,250,0.9)" : "rgba(255,255,255,0.7)",
              animation: `particle ${p.dur}s ease-in-out ${p.d}s infinite`,
            }}
          />
        ))}

        {/* ── Main content ── */}
        <div className="container-wide relative z-10 py-24 md:py-32 w-full">
          {hasBannerImage ? (
            /* Admin split-banner layout */
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-7">
                <HeroText s={s} headline={headline} subline={subline ?? ""} ctaPrimary={ctaPrimary ?? s.ctaPrimary} ctaHref={ctaHref ?? s.ctaPrimaryUrl} />
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image src={banner!.image} alt={banner!.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" priority unoptimized />
              </div>
            </div>
          ) : (
            /* Premium split: text left · product card right */
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* ── Left: Text ── */}
              <div className="space-y-8 text-center lg:text-left">
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.18em]"
                  style={{ background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.38)", color: "#60a5fa", animation: "badgePing 3s ease-in-out infinite" }}
                >
                  <Headphones size={11} /> Premium Tech Store
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
                  {headline.includes("Tech") ? (
                    <>
                      <span className="block text-white drop-shadow-lg">Upgrade Your</span>
                      <span className="block hero-grad-text">Tech Experience</span>
                    </>
                  ) : headline.includes("\n") ? (
                    headline.split("\n").map((line, i) => (
                      <span key={i} className={`block ${i === 0 ? "text-white drop-shadow-lg" : "hero-grad-text"}`}>{line}</span>
                    ))
                  ) : (
                    <span className="hero-grad-text">{headline}</span>
                  )}
                </h1>

                {/* Subtext */}
                <p className="text-base md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {subline}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                  <Link href={ctaHref || "/shop"} className="hero-cta-primary group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white">
                    {ctaPrimary || "Shop Now"}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link href={s.ctaSecondaryUrl} className="hero-cta-secondary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white">
                    {s.ctaSecondary}
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3">
                  {TRUST_BADGES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                      <Icon size={13} className="text-blue-400" /> {label}
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center lg:justify-start gap-8 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  {[{ value: "10K+", label: "Products" }, { value: "50K+", label: "Customers" }, { value: "4.9★", label: "Rating" }].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <div className="text-xl font-black text-white">{value}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: 3D Floating Product Card (fully clickable) ── */}
              <div className="relative flex items-center justify-center lg:justify-end">
                <Link href="/products/premium-wireless-headphones" className="product-card-link block">
                  <div ref={float} className="product-card-float relative" style={{ transformStyle: "preserve-3d" }}>
                    {/* Outer glow */}
                    <div className="absolute -inset-10 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(35px)" }} />

                    {/* Card */}
                    <div className="relative w-72 sm:w-80 lg:w-96 rounded-3xl overflow-hidden cursor-pointer"
                      style={{
                        background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        backdropFilter: "blur(24px)",
                        boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 60px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
                      }}
                    >
                      {/* Image area */}
                      <div className="relative h-56 flex items-center justify-center overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c0a1e 100%)" }}>
                        <div className="absolute w-48 h-48 rounded-full"
                          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)", filter: "blur(30px)" }} />
                        <div className="relative z-10 w-32 h-32 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", boxShadow: "0 0 40px rgba(79,70,229,0.55), 0 0 80px rgba(124,58,237,0.2)" }}>
                          <Headphones size={56} className="text-white" strokeWidth={1.2} />
                        </div>
                        {/* Badges */}
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-black text-white"
                          style={{ background: "rgba(220,38,38,0.92)", boxShadow: "0 0 14px rgba(220,38,38,0.5)" }}>
                          −50% OFF
                        </div>
                        <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", color: "#facc15" }}>
                          🔥 Hot Deal
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="p-5">
                        <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Gadgets</p>
                        <h3 className="text-base font-bold text-white mb-3">Premium Wireless Headphones</h3>
                        {/* Stars */}
                        <div className="flex items-center gap-1.5 mb-4">
                          {[1,2,3,4,5].map((n) => (
                            <svg key={n} width="12" height="12" viewBox="0 0 24 24" fill="#facc15">
                              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                            </svg>
                          ))}
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>(2.4k reviews)</span>
                        </div>
                        {/* Price — red new, gray strikethrough old */}
                        <div className="flex items-baseline gap-3 mb-4">
                          <span className="text-2xl font-black" style={{ color: "#ef4444", textShadow: "0 0 20px rgba(239,68,68,0.4)" }}>Rs. 2,499</span>
                          <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.35)" }}>Rs. 4,999</span>
                        </div>
                        <div className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                          style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", boxShadow: "0 8px 24px rgba(37,99,235,0.35)" }}>
                          🛒 View Product
                        </div>
                      </div>
                    </div>

                    {/* Floating widgets */}
                    <div className="absolute -left-8 top-12 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 pointer-events-none"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", backdropFilter: "blur(10px)", color: "#34d399", animation: "heroFloat 5s ease-in-out 0.5s infinite" }}>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Free Shipping
                    </div>
                    <div className="absolute -right-6 bottom-20 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 pointer-events-none"
                      style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", backdropFilter: "blur(10px)", color: "#60a5fa", animation: "heroFloat 6s ease-in-out 1.2s infinite" }}>
                      🔒 Secure Pay
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }} />
      </section>
    </>
  );
}

function HeroText({ s, headline, subline, ctaPrimary, ctaHref }: {
  s: HeroSettings; headline: string; subline: string; ctaPrimary: string; ctaHref: string;
}) {
  return (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.18em]"
        style={{ background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.38)", color: "#60a5fa" }}>
        <Headphones size={11} /> Premium Tech Store
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight">
        <span className="block text-white drop-shadow-lg">{headline.split("\n")[0] || headline}</span>
        {headline.includes("\n") && (
          <span className="block" style={{
            background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>{headline.split("\n")[1]}</span>
        )}
      </h1>
      <p className="text-base md:text-lg max-w-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{subline}</p>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <Link href={ctaHref} className="hero-cta-primary group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white">
          {ctaPrimary} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
        <Link href={s.ctaSecondaryUrl} className="hero-cta-secondary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white">
          {s.ctaSecondary}
        </Link>
      </div>
    </>
  );
}
