"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { ImageBannerSection } from "./sections/ImageBannerSection";
import { MotionBannerSection } from "./sections/MotionBannerSection";
import { TextBlockSection } from "./sections/TextBlockSection";
import { FeatureListSection } from "./sections/FeatureListSection";
import { CTASection } from "./sections/CTASection";

// Three.js showcase — loaded client-side only (heavy bundle)
const ThreeDShowcaseSection = dynamic(
  () => import("./sections/ThreeDShowcaseSection").then((m) => m.ThreeDShowcaseSection),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-2xl flex items-center justify-center border border-border"
        style={{ minHeight: 480, background: "linear-gradient(135deg, #0a0a1a, #1a0a2e)" }}
      >
        <div className="flex flex-col items-center gap-3 text-white/40">
          <div className="w-10 h-10 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-xs">Loading 3D scene…</p>
        </div>
      </div>
    ),
  }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductSection {
  id: string;
  type: string;
  mode: string;
  sortOrder: number;
  isVisible: boolean;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  assetUrl?: string | null;
  assetType?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  ctaStyle?: string | null;
  settings?: Record<string, unknown> | null;
}

interface Props {
  productSlug: string;
  productId?: string;
  productName?: string;
  basePrice?: number;
  comparePrice?: number | null;
}

// ---------------------------------------------------------------------------
// Performance detection — falls back to "static" on low-end devices
// ---------------------------------------------------------------------------

function detectPerformanceTier(): "high" | "low" {
  if (typeof window === "undefined") return "high";
  const cores = (navigator as any).hardwareConcurrency ?? 4;
  const mem   = (navigator as any).deviceMemory ?? 4; // GB, Chrome only
  if (cores <= 2 || mem <= 2) return "low";
  return "high";
}

// ---------------------------------------------------------------------------
// Section dispatcher
// ---------------------------------------------------------------------------

function Section({
  section,
  tier,
  productId,
  productName,
  basePrice,
  comparePrice,
  productSlug,
}: {
  section: ProductSection;
  tier: "high" | "low";
  productId?: string;
  productName?: string;
  basePrice?: number;
  comparePrice?: number | null;
  productSlug?: string;
}) {
  // On low-end devices, downgrade 3d/4d → static
  const mode = tier === "low" ? "static" : (section.mode as "static" | "3d" | "4d");

  const commonProps = {
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    assetUrl: section.assetUrl,
    assetType: section.assetType,
    ctaText: section.ctaText,
    ctaUrl: section.ctaUrl,
    ctaStyle: section.ctaStyle,
    settings: section.settings,
    mode,
  };

  switch (section.type) {
    case "3d_showcase":
      return <ThreeDShowcaseSection {...commonProps} />;

    case "motion_banner":
      return <MotionBannerSection {...commonProps} />;

    case "image_banner":
      return <ImageBannerSection {...commonProps} />;

    case "text_block":
      return <TextBlockSection {...commonProps} />;

    case "feature_list":
      return <FeatureListSection {...commonProps} />;

    case "cta_section":
      return (
        <CTASection
          {...commonProps}
          productId={productId}
          productName={productName}
          basePrice={basePrice}
          comparePrice={comparePrice}
          productSlug={productSlug}
        />
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function ProductSectionRenderer({ productSlug, productId, productName, basePrice, comparePrice }: Props) {
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loading, setLoading] = useState(true);
  const tier = useMemo(() => detectPerformanceTier(), []);

  useEffect(() => {
    fetch(`/api/products/${productSlug}/sections`)
      .then((r) => r.ok ? r.json() : { sections: [] })
      .then((d) => setSections(d.sections ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productSlug]);

  if (loading) return null; // Silent load — no skeleton (optional to add)
  if (sections.length === 0) return null;

  return (
    <section className="mt-12 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest px-3">
          Product Story
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {sections.map((section) => (
        <div key={section.id} className="w-full">
          <Section
            section={section}
            tier={tier}
            productId={productId}
            productName={productName}
            basePrice={basePrice}
            comparePrice={comparePrice}
            productSlug={productSlug}
          />
        </div>
      ))}
    </section>
  );
}
