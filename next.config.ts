import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  // Prevent these Node.js-only packages from being bundled into
  // Server Components or the Edge runtime by Turbopack/webpack.
  serverExternalPackages: [
    "argon2",
    "bcryptjs",
    "@prisma/client",
    "@prisma/adapter-pg",
    "prisma",
    "pg",
    "pg-native",
  ],

  // Security headers on every response
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/admin", destination: "/admin/dashboard", permanent: false },
      { source: "/dashboard", destination: "/dashboard/profile", permanent: false },
    ];
  },
};

export default nextConfig;
