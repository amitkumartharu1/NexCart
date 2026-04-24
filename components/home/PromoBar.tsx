"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Tag } from "lucide-react";

interface PromoBarSettings {
  promo_bar_enabled: string;
  promo_bar_text: string;
  promo_bar_link: string;
  promo_bar_color: string; // "primary" | "amber" | "red" | "green"
}

const COLOR_CLASSES: Record<string, string> = {
  primary: "bg-primary text-primary-foreground",
  amber:   "bg-amber-500 text-white",
  red:     "bg-red-500 text-white",
  green:   "bg-emerald-600 text-white",
};

export function PromoBar() {
  const [settings, setSettings] = useState<PromoBarSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this session
    if (sessionStorage.getItem("promo_bar_dismissed") === "1") {
      setDismissed(true);
      return;
    }
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const s = data.settings;
        setSettings({
          promo_bar_enabled: s["promo_bar_enabled"] ?? "false",
          promo_bar_text:    s["promo_bar_text"] ?? "",
          promo_bar_link:    s["promo_bar_link"] ?? "",
          promo_bar_color:   s["promo_bar_color"] ?? "primary",
        });
      })
      .catch(() => {});
  }, []);

  if (
    dismissed ||
    !settings ||
    settings.promo_bar_enabled !== "true" ||
    !settings.promo_bar_text.trim()
  ) {
    return null;
  }

  const colorCls = COLOR_CLASSES[settings.promo_bar_color] ?? COLOR_CLASSES.primary;

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("promo_bar_dismissed", "1");
  }

  const content = (
    <span className="flex items-center justify-center gap-2 text-sm font-semibold px-4 text-center">
      <Tag size={13} className="flex-shrink-0 opacity-80" />
      {settings.promo_bar_text}
    </span>
  );

  return (
    <div className={`relative w-full py-2 ${colorCls}`}>
      <div className="container-wide flex items-center justify-center">
        {settings.promo_bar_link ? (
          <Link
            href={settings.promo_bar_link}
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
