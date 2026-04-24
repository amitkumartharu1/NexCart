import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { auth } from "@/auth";
import { getGlobalCurrency } from "@/lib/currency.server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexCart — Smart Shopping. Modern Services.",
    template: "%s | NexCart",
  },
  description:
    "NexCart — Smart Shopping. Modern Services. One Premium Platform.",
  keywords: ["ecommerce", "shopping", "services", "gadgets", "electronics"],
  authors: [{ name: "NexCart" }],
  creator: "NexCart",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    siteName: "NexCart",
    title: "NexCart — Smart Shopping. Modern Services.",
    description: "Smart Shopping. Modern Services. One Premium Platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexCart — Smart Shopping. Modern Services.",
    description: "Smart Shopping. Modern Services. One Premium Platform.",
  },
  robots: {
    index: false, // Private platform — no indexing
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch both in parallel — no waterfall
  const [session, initialCurrency] = await Promise.all([
    auth(),
    getGlobalCurrency(),
  ]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider session={session}>
            <CurrencyProvider initialCurrency={initialCurrency}>
              {children}
              <CartDrawer />
              <Toaster richColors position="top-right" />
              <Analytics />
              <SpeedInsights />
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
