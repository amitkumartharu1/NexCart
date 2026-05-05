import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function url(path: string): string {
  return `${BASE_URL}${path}`;
}

export const revalidate = 3600; // re-generate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic routes in parallel — no waterfall
  const [products, categories, services, blogs] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000, // cap for very large catalogs
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.service.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blog.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
    }),
  ]);

  // ── Static pages ───────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"),              lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: url("/shop"),          lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: url("/categories"),    lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: url("/brands"),        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: url("/services"),      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: url("/search"),        lastModified: new Date(), changeFrequency: "daily",   priority: 0.6 },
    { url: url("/blog"),          lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: url("/about"),         lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/contact"),       lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/faq"),           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/policies/privacy"),  lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/policies/terms"),    lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/policies/shipping"), lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: url("/policies/returns"),  lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // ── Dynamic: Products ──────────────────────────────────────────────────────
  const productPages: MetadataRoute.Sitemap = products.map(({ slug, updatedAt }) => ({
    url:             url(`/products/${slug}`),
    lastModified:    updatedAt,
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }));

  // ── Dynamic: Categories ────────────────────────────────────────────────────
  const categoryPages: MetadataRoute.Sitemap = categories.map(({ slug, updatedAt }) => ({
    url:             url(`/categories/${slug}`),
    lastModified:    updatedAt,
    changeFrequency: "weekly" as const,
    priority:        0.7,
  }));

  // ── Dynamic: Services ──────────────────────────────────────────────────────
  const servicePages: MetadataRoute.Sitemap = services.map(({ slug, updatedAt }) => ({
    url:             url(`/services/${slug}`),
    lastModified:    updatedAt,
    changeFrequency: "weekly" as const,
    priority:        0.7,
  }));

  // ── Dynamic: Blog posts ───────────────────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = blogs.map(({ slug, updatedAt }) => ({
    url:             url(`/blog/${slug}`),
    lastModified:    updatedAt,
    changeFrequency: "monthly" as const,
    priority:        0.6,
  }));

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...servicePages,
    ...blogPages,
  ];
}
