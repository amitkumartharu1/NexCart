/**
 * Server layout for /products/[slug]
 *
 * Exports generateMetadata so each product page gets proper title,
 * description, and Open Graph tags — even though the page.tsx itself
 * is a client component and cannot export generateMetadata directly.
 *
 * Next.js resolves metadata hierarchically: layout → page.
 * Since page.tsx exports none, this layout's metadata wins.
 */
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      name: true,
      shortDescription: true,
      description: true,
      metaTitle: true,
      metaDesc: true,
      metaKeywords: true,
      images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
      brand: { select: { name: true } },
      category: { select: { name: true } },
      basePrice: true,
    },
  });

  if (!product) return {};

  const title       = product.metaTitle ?? product.name;
  const description = product.metaDesc ?? product.shortDescription ?? product.description?.slice(0, 160) ?? "";
  const imageUrl    = product.images[0]?.url ?? null;
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl     = `${baseUrl}/products/${slug}`;

  return {
    title,
    description,
    keywords: product.metaKeywords.length
      ? product.metaKeywords
      : [product.name, product.brand?.name, product.category?.name].filter(Boolean) as string[],
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "website",
      title,
      description,
      url: pageUrl,
      siteName: "NexCart",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 800, height: 800, alt: product.images[0]?.altText ?? product.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
    // Product structured data injected via script tag below in the layout
    other: {
      "product:price:amount":   String(Number(product.basePrice)),
      "product:price:currency": "NPR",
    },
  };
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>;
}
