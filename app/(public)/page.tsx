import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { HeroSection, type HeroBanner, type HeroSettings, type FeaturedProduct } from "@/components/home/HeroSection";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { WhyNexCart } from "@/components/home/WhyNexCart";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { RecentlyRestocked } from "@/components/home/RecentlyRestocked";
import { OfferSection } from "@/components/home/OfferSection";
import { FounderSection } from "@/components/home/FounderSection";
import { MotiveSection } from "@/components/home/MotiveSection";
import { TeamSection } from "@/components/home/TeamSection";
import { SuppliersSection } from "@/components/home/SuppliersSection";

export const metadata: Metadata = {
  title: "NexCart — Smart Shopping. Modern Services.",
  description:
    "Your premium destination for electronics, gadgets, fashion and professional services. Smart Shopping. Modern Services. One Platform.",
};

// Always re-render so admin banner/settings changes show immediately.
export const dynamic = "force-dynamic";

async function getHeroData(): Promise<{
  banner: HeroBanner | null;
  settings: Partial<HeroSettings>;
  bgImage: string | null;
  overlayOpacity: string | null;
  featuredProduct: FeaturedProduct | null;
}> {
  try {
    const [bannerRow, settingsRows, featuredProductRow] = await Promise.all([
      // First active HERO banner
      prisma.banner.findFirst({
        where: { position: "HERO", isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true,
          image: true,
          link: true,
          ctaText: true,
        },
      }),
      // Homepage settings
      prisma.siteSettings.findMany({
        where: {
          key: {
            in: [
              "hero_title",
              "hero_subtitle",
              "hero_cta_primary",
              "hero_cta_primary_url",
              "hero_cta_secondary",
              "hero_cta_secondary_url",
              "hero_bg_image",
              "hero_overlay_opacity",
            ],
          },
        },
        select: { key: true, value: true },
      }),
      // A featured product to show in the hero card
      prisma.product.findFirst({
        where: { status: "ACTIVE", isFeatured: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          comparePrice: true,
          category: { select: { name: true } },
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { url: true, altText: true },
          },
        },
      }).then((p) =>
        // If no featured product, fall back to any active product with an image
        p
          ? p
          : prisma.product.findFirst({
              where: {
                status: "ACTIVE",
                images: { some: {} },
              },
              orderBy: { viewCount: "desc" },
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                comparePrice: true,
                category: { select: { name: true } },
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                  select: { url: true, altText: true },
                },
              },
            })
      ),
    ]);

    const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
    const settings: Partial<HeroSettings> = {
      ...(settingsMap.hero_title ? { title: settingsMap.hero_title } : {}),
      ...(settingsMap.hero_subtitle ? { subtitle: settingsMap.hero_subtitle } : {}),
      ...(settingsMap.hero_cta_primary ? { ctaPrimary: settingsMap.hero_cta_primary } : {}),
      ...(settingsMap.hero_cta_primary_url ? { ctaPrimaryUrl: settingsMap.hero_cta_primary_url } : {}),
      ...(settingsMap.hero_cta_secondary ? { ctaSecondary: settingsMap.hero_cta_secondary } : {}),
      ...(settingsMap.hero_cta_secondary_url ? { ctaSecondaryUrl: settingsMap.hero_cta_secondary_url } : {}),
    };

    const fp = featuredProductRow;
    const featuredProduct: FeaturedProduct | null = fp
      ? {
          name:         fp.name,
          slug:         fp.slug,
          basePrice:    Number(fp.basePrice),
          comparePrice: fp.comparePrice ? Number(fp.comparePrice) : null,
          category:     fp.category?.name ?? null,
          imageUrl:     fp.images[0]?.url ?? null,
          imageAlt:     fp.images[0]?.altText ?? fp.name,
        }
      : null;

    return {
      banner: bannerRow as HeroBanner | null,
      settings,
      bgImage: settingsMap.hero_bg_image ?? null,
      overlayOpacity: settingsMap.hero_overlay_opacity ?? null,
      featuredProduct,
    };
  } catch {
    return { banner: null, settings: {}, bgImage: null, overlayOpacity: null, featuredProduct: null };
  }
}

async function getCmsData() {
  try {
    const [settingsRows, teamMembers, suppliers] = await Promise.all([
      prisma.siteSettings.findMany({
        where: {
          key: {
            in: [
              "section_founder_enabled", "founder_name", "founder_role",
              "founder_bio", "founder_vision", "founder_image",
              "section_motive_enabled", "motive_title", "motive_description", "motive_points",
              "section_team_enabled", "section_suppliers_enabled",
            ],
          },
        },
        select: { key: true, value: true },
      }),
      prisma.teamMember.findMany({
        where:   { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.supplier.findMany({
        where:   { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);
    const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value ?? ""]));
    let motivePoints: string[] = [];
    try { motivePoints = JSON.parse(s["motive_points"] || "[]"); } catch { /* */ }

    return {
      founder: {
        enabled: s["section_founder_enabled"] !== "false",
        name:    s["founder_name"]    || "",
        role:    s["founder_role"]    || "",
        bio:     s["founder_bio"]     || "",
        vision:  s["founder_vision"]  || "",
        image:   s["founder_image"]   || "",
      },
      motive: {
        enabled:     s["section_motive_enabled"] !== "false",
        title:       s["motive_title"]       || "",
        description: s["motive_description"] || "",
        points:      motivePoints,
      },
      teamEnabled:      s["section_team_enabled"]      !== "false",
      suppliersEnabled: s["section_suppliers_enabled"] !== "false",
      teamMembers,
      suppliers,
    };
  } catch {
    return {
      founder:          { enabled: false, name: "", role: "", bio: "", vision: "", image: "" },
      motive:           { enabled: false, title: "", description: "", points: [] },
      teamEnabled:      false,
      suppliersEnabled: false,
      teamMembers:      [],
      suppliers:        [],
    };
  }
}

export default async function HomePage() {
  const [
    { banner, settings, bgImage, overlayOpacity, featuredProduct },
    cms,
  ] = await Promise.all([getHeroData(), getCmsData()]);

  return (
    <div className="flex flex-col">
      <HeroSection
        banner={banner}
        settings={settings}
        bgImage={bgImage}
        overlayOpacity={overlayOpacity}
        featuredProduct={featuredProduct}
      />

      {/* Founder spotlight — right after hero if set */}
      {cms.founder.enabled && cms.founder.name && (
        <FounderSection data={cms.founder} />
      )}

      <FeaturedCategories />
      <RecentlyRestocked />
      <OfferSection />
      <TrendingProducts />

      {/* Website motive section */}
      {cms.motive.enabled && (
        <MotiveSection data={cms.motive} />
      )}

      <FeaturedServices />
      <WhyNexCart />

      {/* Team section */}
      {cms.teamEnabled && cms.teamMembers.length > 0 && (
        <TeamSection members={cms.teamMembers} />
      )}

      {/* Suppliers carousel */}
      {cms.suppliersEnabled && cms.suppliers.length > 0 && (
        <SuppliersSection suppliers={cms.suppliers} />
      )}

      <Testimonials />
      <NewsletterSection />
    </div>
  );
}
