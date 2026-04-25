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

export default async function HomePage() {
  const { banner, settings, bgImage, overlayOpacity, featuredProduct } = await getHeroData();

  return (
    <div className="flex flex-col">
      <HeroSection
        banner={banner}
        settings={settings}
        bgImage={bgImage}
        overlayOpacity={overlayOpacity}
        featuredProduct={featuredProduct}
      />
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
