import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Wrench, Shield, Zap, Users, Globe } from "lucide-react";

export const metadata: Metadata = { title: "About Us — NexCart" };

const VALUES = [
  { icon: Shield, title: "Trust & Security", desc: "Every transaction is secured with enterprise-grade encryption and fraud protection." },
  { icon: Zap, title: "Fast & Reliable", desc: "Lightning-fast checkout, real-time inventory, and reliable delivery across Nepal." },
  { icon: Users, title: "Customer First", desc: "Our 24/7 support team is always here to help you shop with confidence." },
  { icon: Globe, title: "Local & Global", desc: "Bridging Nepal's local brands with international quality standards." },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-20 bg-background">
        <div className="container-wide text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <ShoppingBag size={12} /> Our Story
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Smart Shopping.<br />
            <span className="text-primary">Modern Services.</span>
          </h1>
          <p className="text-lg text-foreground-muted leading-relaxed">
            NexCart was built with a simple mission: make premium shopping and professional services accessible to everyone in Nepal and beyond. We combine cutting-edge technology with local expertise to deliver an unmatched commerce experience.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-background-subtle border-y border-border">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[["10,000+","Products Listed"],["500+","Happy Customers"],["50+","Services Offered"],["99%","Satisfaction Rate"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-3xl font-bold text-primary">{n}</p>
                <p className="text-sm text-foreground-muted mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-background">
        <div className="container-wide">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-background-subtle rounded-2xl border border-border p-6 text-center hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-foreground-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to experience NexCart?</h2>
          <p className="text-white/80 mb-8">Join thousands of happy customers shopping smarter.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="px-8 py-3 rounded-xl bg-white text-primary font-semibold hover:bg-white/90 transition-colors">Browse Products</Link>
            <Link href="/services" className="px-8 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors">Explore Services</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
