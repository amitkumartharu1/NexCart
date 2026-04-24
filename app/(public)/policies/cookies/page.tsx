import Link from "next/link";
import { Cookie } from "lucide-react";

export const metadata = { title: "Cookie Policy — NexCart" };

const sections = [
  {
    title: "What Are Cookies?",
    content: `Cookies are small text files stored on your device when you visit a website. They help the site remember information about your visit, such as your preferred language, login status, and shopping cart contents, making your next visit easier and the site more useful to you.`,
  },
  {
    title: "How We Use Cookies",
    content: `NexCart uses cookies to deliver, protect, and improve our services. We use cookies to keep you signed in, remember your cart, understand how you use our site, and show you relevant content.`,
  },
  {
    title: "Types of Cookies We Use",
    subsections: [
      {
        name: "Essential Cookies",
        description:
          "These cookies are necessary for the website to function and cannot be switched off. They are set in response to actions you take, such as logging in or adding items to your cart.",
      },
      {
        name: "Performance Cookies",
        description:
          "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. All information is aggregated and anonymous.",
      },
      {
        name: "Functional Cookies",
        description:
          "These cookies enable the website to provide enhanced functionality and personalization, such as remembering your preferences and settings.",
      },
      {
        name: "Targeting Cookies",
        description:
          "These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant advertisements on other sites.",
      },
    ],
  },
  {
    title: "Third-Party Cookies",
    content: `We may allow third-party services (such as payment processors, analytics providers, and social media platforms) to set cookies on our site. These third parties have their own privacy policies and we do not control how they use their cookies.`,
  },
  {
    title: "Managing Cookies",
    content: `You can control and manage cookies in several ways. Most browsers allow you to refuse or accept cookies, delete existing cookies, and set preferences for certain websites. Note that disabling cookies may affect the functionality of our site — for example, you may not be able to stay logged in or use the shopping cart.`,
    list: [
      "Chrome: Settings → Privacy and security → Cookies and other site data",
      "Firefox: Options → Privacy & Security → Cookies and Site Data",
      "Safari: Preferences → Privacy → Manage Website Data",
      "Edge: Settings → Cookies and site permissions",
    ],
  },
  {
    title: "Cookie Retention",
    content: `Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period (usually between 30 days and 2 years) or until you delete them manually.`,
  },
  {
    title: "Updates to This Policy",
    content: `We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business practices. We will notify you of significant changes by posting a notice on our website.`,
  },
  {
    title: "Contact Us",
    content: `If you have any questions about our use of cookies, please contact us at privacy@nexcart.com or visit our Contact page.`,
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <div className="bg-background-subtle border-b border-border">
        <div className="container-wide py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
            <Cookie size={24} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Cookie Policy</h1>
          <p className="text-foreground-muted max-w-xl mx-auto">
            Learn how NexCart uses cookies to improve your shopping experience.
          </p>
          <p className="text-xs text-foreground-muted mt-4">Last updated: January 1, 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-wide py-16 max-w-3xl">
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-foreground mb-3">{section.title}</h2>
              {section.content && (
                <p className="text-foreground-muted leading-relaxed">{section.content}</p>
              )}
              {section.list && (
                <ul className="mt-3 space-y-1.5">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-foreground-muted text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.subsections && (
                <div className="mt-4 space-y-4">
                  {section.subsections.map((sub) => (
                    <div key={sub.name} className="rounded-xl border border-border bg-background-subtle p-5">
                      <h3 className="font-semibold text-foreground mb-1">{sub.name}</h3>
                      <p className="text-sm text-foreground-muted">{sub.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-14 pt-8 border-t border-border flex flex-wrap gap-4 text-sm text-foreground-muted">
          <Link href="/policies/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/policies/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          <Link href="/policies/shipping" className="hover:text-primary transition-colors">Shipping Policy</Link>
          <Link href="/policies/returns" className="hover:text-primary transition-colors">Returns Policy</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
