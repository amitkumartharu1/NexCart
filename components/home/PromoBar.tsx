"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Tag } from "lucide-react";

interface PromoState {
  text: string;
  link: string;
  color: string;
}

const COLOR_CLASSES: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  amber:   "bg-amber-500 text-white",
  red:     "bg-red-500 text-white",
  green:   "bg-emerald-600 text-white",
};

export function PromoBar() {
  const [promo, setPromo]       = useState<PromoState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("promo_bar_dismissed") === "1") {
      setDismissed(true);
      return;
    }

    // Fetch PROMO_BAR banners AND site-settings in parallel
    Promise.all([
      fetch("/api/banners?position=PROMO_BAR").then((r) => r.ok ? r.json() : null),
      fetch("/api/settings").then((r) => r.ok ? r.json() : null),
    ])
      .then(([bannerData, settingsData]) => {
        // ── Banner table takes priority ──────────────────────────
        const banner = bannerData?.banners?.[0] ?? null;
        if (banner?.title) {
          setPromo({
            text:  banner.subtitle ? `${banner.title} — ${banner.subtitle}` : banner.title,
            link:  banner.link ?? "",
            color: "primary",
          });
          return;
        }

        // ── Fallback: SiteSettings (promo_bar_* keys) ────────────
        const s = settingsData?.settings ?? {};
        if (s["promo_bar_enabled"] === "true" && s["promo_bar_text"]?.trim()) {
          setPromo({
            text:  s["promo_bar_text"],
            link:  s["promo_bar_link"] ?? "",
            color: s["promo_bar_color"] ?? "primary",
          });
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("promo_bar_dismissed", "1");
  }

  if (dismissed || !promo) return null;

  const colorCls = COLOR_CLASSES[promo.color] ?? COLOR_CLASSES.primary;

  const content = (
    <span className="flex items-center justify-center gap-2 text-sm font-semibold px-4 text-center">
      <Tag size={13} className="flex-shrink-0 opacity-80" />
      {promo.text}
    </span>
  );

  return (
    <div className={`relative w-full py-2 ${colorCls}`}>
      <div className="container-wide flex items-center justify-center">
        {promo.link ? (
          <Link
            href={promo.link}
            className="flex-1 flex justify-center hover:opacity-90 transition-opacity"
          >
            {content}
          </Link>
        ) : (
          <div className="flex-1 flex justify-center">{content}</div>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-4 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
