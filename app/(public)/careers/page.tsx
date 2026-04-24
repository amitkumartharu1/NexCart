import { Briefcase } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Careers — NexCart" };

export default function CareersPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="bg-background-subtle border-b border-border">
        <div className="container-wide py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
            <Briefcase size={24} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Careers</h1>
          <p className="text-foreground-muted max-w-xl mx-auto">
            Join the team building the future of smart shopping.
          </p>
        </div>
      </div>

      <div className="container-wide py-24 text-center">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-6xl">🚀</div>
          <h2 className="text-2xl font-bold text-foreground">We&apos;re Hiring</h2>
          <p className="text-foreground-muted">
            We don&apos;t have open positions listed here yet, but we&apos;re always looking for talented people. Send your CV to{" "}
            <a href="mailto:careers@nexcart.com" className="text-primary hover:underline">careers@nexcart.com</a>
            {" "}and we&apos;ll be in touch.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
