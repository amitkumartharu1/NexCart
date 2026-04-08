import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

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

const SOCIAL_LINKS = [
  { label: "Twitter", href: "#", letter: "𝕏" },
  { label: "Instagram", href: "#", letter: "IG" },
  { label: "YouTube", href: "#", letter: "YT" },
  { label: "GitHub", href: "#", letter: "GH" },
];

export function Footer() {
  return (
    <footer className="bg-background-subtle border-t border-border mt-auto">
      {/* Main footer */}
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold tracking-tight">
                Nex<span className="text-primary">Cart</span>
              </span>
            </Link>
            <p className="text-sm text-foreground-muted leading-relaxed max-w-xs">
              Smart Shopping. Modern Services. One Premium Platform. Your trusted destination for tech, fashion, and professional services.
            </p>
            <div className="space-y-2 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <Mail size={14} className="flex-shrink-0 text-primary" />
                <span>hello@nexcart.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="flex-shrink-0 text-primary" />
                <span>+1 (555) 000-0000</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="flex-shrink-0 text-primary mt-0.5" />
                <span>123 Commerce Street, Tech City, TC 10001</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ label, href, letter }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-xs font-bold text-foreground-muted hover:text-primary hover:border-primary transition-colors"
                >
                  {letter}
                </a>
              ))}
            </div>
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

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <p>© {new Date().getFullYear()} NexCart. All rights reserved.</p>
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
