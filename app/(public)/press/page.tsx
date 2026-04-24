import { Newspaper } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Press — NexCart" };

export default function PressPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="bg-background-subtle border-b border-border">
        <div className="container-wide py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
            <Newspaper size={24} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Press</h1>
          <p className="text-foreground-muted max-w-xl mx-auto">
            Media resources and press inquiries for NexCart.
          </p>
        </div>
      </div>

      <div className="container-wide py-24 text-center">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-6xl">📰</div>
          <h2 className="text-2xl font-bold text-foreground">Press Kit Coming Soon</h2>
          <p className="text-foreground-muted">
            For media inquiries, interviews, or press resources, please reach out to our team directly.
          </p>
          <a
            href="mailto:press@nexcart.com"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            press@nexcart.com
          </a>
          <div className="pt-2">
            <Link href="/contact" className="text-sm text-foreground-muted hover:text-primary transition-colors">
              Or use our contact form →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
