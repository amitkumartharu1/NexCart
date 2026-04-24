import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { headers } from "next/headers";

const FOOTER_LINKS = {
  Shop: [
    { label: "All Products", href: "/shop" },
    { label: "Electronics", href: "/categories/electronics" },
    { label: "Gadgets", href: "/categories/gadgets" },
    { label: "Fashion", href: "/categories/fashion" },
    { label: "New Arrivals", href: "/shop?filter=new" },
    { label: "Best Sellers", href: "/shop?filter=bestseller" },
  ],
  Services: [
    { label: "All Services", href: "/services" },
    { label: "Repair", href: "/services/repair" },
    { label: "Installation", href: "/services/installation" },
    { label: "Consultation", href: "/services/consultation" },
    { label: "Book a Service", href: "/services#book" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  Support: [
    { label: "FAQ", href: "/faq" },
    { label: "Shipping Policy", href: "/policies/shipping" },
    { label: "Return Policy", href: "/policies/returns" },
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms of Service", href: "/policies/terms" },
  ],
};

// Fetch site settings — uses the host header so it works on any port
async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "localhost:3001";
    const proto = hdrs.get("x-forwarded-proto") ?? "http";
    const res = await fetch(`${proto}://${host}/api/settings`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { settings: Record<string, string | null> };
    const settings: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.settings)) {
      if (v !== null) settings[k] = v;
    }
    return settings;
  } catch {
    return {};
  }
}

// Social media SVG icons
function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z" />
    </svg>
  );
}
function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

export async function Footer() {
  const s = await getSiteSettings();

  const siteName    = s["site_name"]    ?? "NexCart";
  const siteTagline = s["site_tagline"] ?? "Smart Shopping. Modern Services. One Premium Platform.";
  const siteEmail   = s["site_email"]   ?? "";
  const sitePhone   = s["site_phone"]   ?? "";
  const siteAddress = s["site_address"] ?? "";

  // Build social links — only show if enabled AND url is set
  const socials: { label: string; href: string; icon: React.ReactNode }[] = [];
  if (s["social_facebook_enabled"] !== "false" && s["social_facebook_url"]) {
    socials.push({ label: "Facebook", href: s["social_facebook_url"], icon: <FacebookIcon /> });
  }
  if (s["social_instagram_enabled"] !== "false" && s["social_instagram_url"]) {
    socials.push({ label: "Instagram", href: s["social_instagram_url"], icon: <InstagramIcon /> });
  }
  if (s["social_tiktok_enabled"] !== "false" && s["social_tiktok_url"]) {
    socials.push({ label: "TikTok", href: s["social_tiktok_url"], icon: <TikTokIcon /> });
  }
  if (s["social_youtube_enabled"] !== "false" && s["social_youtube_url"]) {
    socials.push({ label: "YouTube", href: s["social_youtube_url"], icon: <YoutubeIcon /> });
  }

  // Fallback social placeholders when no settings are saved yet
  const showFallbackSocials = socials.length === 0;

  return (
    <footer className="bg-background-subtle border-t border-border mt-auto">
      {/* Main footer */}
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight">
                {siteName.replace("NexCart", "Nex").includes("Nex")
                  ? <>Nex<span className="text-primary">Cart</span></>
                  : siteName}
              </span>
            </Link>
            <p className="text-sm text-foreground-muted leading-relaxed max-w-xs">
              {siteTagline}
            </p>
            <div className="space-y-2 text-sm text-foreground-muted">
              {siteEmail && (
                <div className="flex items-center gap-2">
                  <Mail size={14} className="flex-shrink-0 text-primary" />
                  <a href={`mailto:${siteEmail}`} className="hover:text-primary transition-colors">{siteEmail}</a>
                </div>
              )}
              {sitePhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="flex-shrink-0 text-primary" />
                  <a href={`tel:${sitePhone}`} className="hover:text-primary transition-colors">{sitePhone}</a>
                </div>
              )}
              {siteAddress && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="flex-shrink-0 text-primary mt-0.5" />
                  <span>{siteAddress}</span>
                </div>
              )}
            </div>

            {/* Dynamic social links */}
            {socials.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {socials.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-primary hover:border-primary transition-colors"
                  >
                    {icon}
                  </a>
                ))}
              </div>
            )}

            {/* Fallback socials when none configured */}
            {showFallbackSocials && (
              <div className="flex items-center gap-3 pt-1">
                {[
                  { label: "Facebook", icon: <FacebookIcon /> },
                  { label: "Instagram", icon: <InstagramIcon /> },
                  { label: "TikTok", icon: <TikTokIcon /> },
                ].map(({ label, icon }) => (
                  <span
                    key={label}
                    aria-label={label}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-foreground-muted opacity-40 cursor-default"
                    title={`${label} — configure in Admin Settings`}
                  >
                    {icon}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {group}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-t border-border bg-background-subtle/50">
        <div className="container-wide py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Payment logos */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span className="text-xs text-foreground-muted font-medium mr-1">We accept:</span>
            {[
              { label: "Visa", bg: "#1a1f71", text: "#fff", abbr: "VISA" },
              { label: "eSewa", bg: "#60bb46", text: "#fff", abbr: "eSewa" },
              { label: "Khalti", bg: "#5c2d91", text: "#fff", abbr: "Khalti" },
            ].map(({ label, bg, text, abbr }) => (
              <span
                key={label}
                title={label}
                className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black tracking-wide border border-border"
                style={{ background: bg, color: text }}
              >
                {abbr}
              </span>
            ))}
          </div>
          {/* Trust line */}
          <p className="text-xs text-foreground-muted flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Trusted by <strong className="text-foreground mx-0.5">50,000+</strong> customers across India
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/policies/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/policies/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/policies/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
