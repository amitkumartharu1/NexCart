"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";

const BADGES = [
  { icon: Zap, label: "Fast Delivery" },
  { icon: ShieldCheck, label: "Secure Payments" },
  { icon: Sparkles, label: "Premium Quality" },
];

export function HeroSection() {
  const orb1 = useRef<HTMLDivElement>(null);
  const orb2 = useRef<HTMLDivElement>(null);

  // Subtle parallax on mouse move
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      if (orb1.current) orb1.current.style.transform = `translate(${x * 0.6}px, ${y * 0.6}px)`;
      if (orb2.current) orb2.current.style.transform = `translate(${-x * 0.4}px, ${-y * 0.4}px)`;
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background pt-16">

      {/* Ambient background orbs */}
      <div
        ref={orb1}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ background: "radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        ref={orb2}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
        aria-hidden
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />

      <div className="container-narrow relative z-10 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase">
            <Sparkles size={12} />
            Premium Commerce Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]">
            <span className="block text-foreground">Nex</span>
            <span className="block gradient-text">Cart</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            Smart Shopping. Modern Services. One Premium Platform.
            <br className="hidden md:block" />
            Everything you need — products, services, and seamless experiences.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Shop Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-background text-foreground font-semibold text-sm hover:bg-accent hover:border-border-strong transition-all duration-200 hover:-translate-y-0.5"
            >
              Explore Services
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-foreground-muted">
                <Icon size={15} className="text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-8 pt-8 max-w-lg mx-auto border-t border-border">
            {[
              { value: "10K+", label: "Products" },
              { value: "50+", label: "Services" },
              { value: "99%", label: "Satisfaction" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-foreground-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        aria-hidden
      />
    </section>
  );
}
