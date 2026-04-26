import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Known CDNs / OAuth avatars
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Demo / seed data placeholder images
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Allow any https host for admin-entered asset URLs (section builder, etc.)
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "**" },
    ],
  },

  // Prevent these Node.js-only packages from being bundled into
  // Server Components or the Edge runtime by Turbopack/webpack.
  serverExternalPackages: [
    "argon2",         // optional — falls back to bcryptjs if native build unavailable
    "bcryptjs",
    "@prisma/client",
    "@prisma/adapter-pg",
    "prisma",
    "pg",
    "pg-native",
    "nodemailer",     // Node.js only — email sending
    "exceljs",        // Node.js only — Excel export
  ],

  // Suppress the NODE_ENV warning — Vercel sets this correctly at runtime
  env: {
    NEXT_SUPPRESS_ENV_WARNING: "1",
  },

  // Security headers on every response
  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // Content-Security-Policy
    // style-src needs 'unsafe-inline' — Tailwind v4 injects <style> blocks at runtime
    // script-src 'unsafe-eval' needed in dev for Next.js HMR; locked down in prod
    const cspDirectives = [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://picsum.photos https://fastly.picsum.photos https://images.unsplash.com https://*.cloudinary.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.cloudinary.com https://accounts.google.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ];

    const securityHeaders = [
      { key: "X-Content-Type-Options",  value: "nosniff" },
      { key: "X-Frame-Options",          value: "DENY" },
      { key: "X-XSS-Protection",         value: "1; mode=block" },
      { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Content-Security-Policy",   value: cspDirectives.join("; ") },
      // HSTS — enforce HTTPS for 1 year; only in production
      ...(!isDev
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
        : []),
    ];

    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async redirects() {
    return [
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      { source: "/dashboard", destination: "/dashboard/profile", permanent: false },
    ];
  },
};

export default nextConfig;
