import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { HeroSection, type HeroBanner, type HeroSettings } from "@/components/home/HeroSection";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { WhyNexCart } from "@/components/home/WhyNexCart";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { RecentlyRestocked } from "@/components/home/RecentlyRestocked";
import { OfferSection } from "@/components/home/OfferSection";

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
}> {
  try {
    const [bannerRow, settingsRows] = await Promise.all([
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

    return {
      banner: bannerRow as HeroBanner | null,
      settings,
      bgImage: settingsMap.hero_bg_image ?? null,
      overlayOpacity: settingsMap.hero_overlay_opacity ?? null,
    };
  } catch {
    return { banner: null, settings: {}, bgImage: null, overlayOpacity: null };
  }
}

export default async function HomePage() {
  const { banner, settings, bgImage, overlayOpacity } = await getHeroData();

  return (
    <div className="flex flex-col">
      <HeroSection banner={banner} settings={settings} bgImage={bgImage} overlayOpacity={overlayOpacity} />
      <FeaturedCategories />
      <RecentlyRestocked />
      <OfferSection />
      <TrendingProducts />
      <FeaturedServices />
      <WhyNexCart />
      <Testimonials />
      <NewsletterSection />
    </div>
  );
}
