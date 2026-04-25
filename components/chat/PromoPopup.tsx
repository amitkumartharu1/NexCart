"use client";

import { useState, useEffect } from "react";
import { X, Clock, Flame, Users, Tag } from "lucide-react";
import Link from "next/link";

interface PopupConfig {
  enabled:         boolean;
  title:           string;
  description:     string;
  badge:           string; // "scarcity" | "urgency" | "social" | "discount"
  cta_text:        string;
  cta_link:        string;
  coupon_code:     string;
  delay_seconds:   number;
  suppress_hours:  number;
}

const DEFAULTS: PopupConfig = {
  enabled:        true,
  title:          "🔥 Limited Time Offer!",
  description:    "Get 20% OFF on your first order. Use code below at checkout.",
  badge:          "urgency",
  cta_text:       "Shop Now",
  cta_link:       "/shop",
  coupon_code:    "FIRST20",
  delay_seconds:  6,
  suppress_hours: 24,
};

const BADGE_CONFIG = {
  urgency:  { icon: Clock,  text: "⚡ Sale ends soon",                  bg: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  scarcity: { icon: Flame,  text: "🔥 Only a few items left!",           bg: "bg-red-500/10 text-red-600 border-red-500/20" },
  social:   { icon: Users,  text: "👥 120+ people bought this today",    bg: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  discount: { icon: Tag,    text: "💰 Exclusive discount — today only",  bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

function getSuppressKey() { return "nexcart_promo_suppress"; }

function isSuppressed(hours: number): boolean {
  try {
    const raw = localStorage.getItem(getSuppressKey());
    if (!raw) return false;
    const expiry = parseInt(raw);
    return Date.now() < expiry;
  } catch { return false; }
}

function suppress(hours: number) {
  try {
    localStorage.setItem(getSuppressKey(), String(Date.now() + hours * 60 * 60 * 1000));
  } catch { /* ignore */ }
}

export function PromoPopup() {
  const [config,  setConfig]  = useState<PopupConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    // Fetch popup config from settings
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const s = data?.settings ?? {};

        const cfg: PopupConfig = {
          enabled:        s["popup_enabled"]        !== "false",
          title:          s["popup_title"]          || DEFAULTS.title,
          description:    s["popup_description"]    || DEFAULTS.description,
          badge:          s["popup_badge"]          || DEFAULTS.badge,
          cta_text:       s["popup_cta_text"]       || DEFAULTS.cta_text,
          cta_link:       s["popup_cta_link"]       || DEFAULTS.cta_link,
          coupon_code:    s["popup_coupon_code"]    || DEFAULTS.coupon_code,
          delay_seconds:  parseInt(s["popup_delay_seconds"]  ?? "6"),
          suppress_hours: parseInt(s["popup_suppress_hours"] ?? "24"),
        };

        if (!cfg.enabled) return;
        if (isSuppressed(cfg.suppress_hours)) return;

        setConfig(cfg);

        // Show after delay
        const t = setTimeout(() => setVisible(true), cfg.delay_seconds * 1000);
        return () => clearTimeout(t);
      })
      .catch(() => {/* no popup on error */});
  }, []);

  const close = () => {
    setVisible(false);
    if (config) suppress(config.suppress_hours);
  };

  const copyCode = async () => {
    if (!config?.coupon_code) return;
    try {
      await navigator.clipboard.writeText(config.coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  if (!visible || !config) return null;

  const badge = BADGE_CONFIG[config.badge as keyof typeof BADGE_CONFIG] ?? BADGE_CONFIG.urgency;
  const BadgeIcon = badge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-background rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

        {/* Close */}
        <button
          onClick={close}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
        >
          <X size={14} />
        </button>

        <div className="p-6 space-y-4">
          {/* Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
            <BadgeIcon size={11} />
            {badge.text}
          </span>

          {/* Title & description */}
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">{config.title}</h2>
            <p className="text-sm text-foreground-muted mt-1.5 leading-relaxed">{config.description}</p>
          </div>

          {/* Coupon code */}
          {config.coupon_code && (
            <button
              onClick={copyCode}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors group"
            >
              <span className="text-lg font-black text-primary tracking-widest">{config.coupon_code}</span>
              <span className="text-xs font-medium text-foreground-muted group-hover:text-primary transition-colors">
                {copied ? "✓ Copied!" : "Tap to copy"}
              </span>
            </button>
          )}

          {/* CTA */}
          <Link
            href={config.cta_link}
            onClick={close}
            className="block w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold text-center hover:opacity-90 transition-opacity"
          >
            {config.cta_text} →
          </Link>

          {/* Dismiss */}
          <button
            onClick={close}
            className="w-full text-xs text-foreground-subtle hover:text-foreground-muted transition-colors py-1"
          >
            No thanks, I don&apos;t want a discount
          </button>
        </div>
      </div>
    </div>
  );
}
