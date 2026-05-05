import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [
      {
        // Allow all crawlers on public content
        userAgent: "*",
        allow: [
          "/",
          "/shop",
          "/products/",
          "/categories/",
          "/brands/",
          "/services/",
          "/blog/",
          "/about",
          "/contact",
          "/faq",
          "/policies/",
          "/search",
        ],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/cart",
          "/_next/",
        ],
      },
      {
        // Block AI training bots from product/content pages
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "cohere-ai",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
