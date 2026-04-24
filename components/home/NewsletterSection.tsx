"use client";

import { useState } from "react";
import { ArrowRight, Gift, Percent, Tag } from "lucide-react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // TODO (Phase 10): wire to email service
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <section className="py-20 bg-background">
      <div className="container-narrow">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-background-subtle to-background-muted border border-primary/20 p-10 md:p-14 text-center relative overflow-hidden">

          {/* Background accents */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
               style={{ background: "radial-gradient(circle, var(--primary), transparent)" }} aria-hidden />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 blur-3xl"
               style={{ background: "radial-gradient(circle, var(--primary), transparent)" }} aria-hidden />

          <div className="relative z-10 space-y-6 max-w-xl mx-auto">
            {/* Perks */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-foreground-muted">
              {[{ icon: Percent, label: "10% off first order" }, { icon: Gift, label: "Exclusive deals" }, { icon: Tag, label: "Early access sales" }].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border">
                  <Icon size={12} className="text-primary" /> {label}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get Exclusive Offers</h2>
              <p className="text-foreground-muted">
                Join 50,000+ smart shoppers. No spam — just deals, drops, and early access.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-xl bg-primary/10 border border-primary/20 px-6 py-4">
                <p className="font-semibold text-primary">You&apos;re in! 🎉</p>
                <p className="text-sm text-foreground-muted mt-1">Check your inbox for your welcome offer.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  suppressHydrationWarning
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 flex-shrink-0"
                >
                  {loading ? "Joining…" : <><span>Subscribe</span><ArrowRight size={14} /></>}
                </button>
              </form>
            )}

            <p className="text-xs text-foreground-muted">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
