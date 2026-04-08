import Link from "next/link";
import { Cpu, Zap, Shirt, Sparkles, Home, Gamepad2, Smartphone, Watch, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { name: "Electronics", slug: "electronics", icon: Cpu, count: "2.4K+" },
  { name: "Gadgets", slug: "gadgets", icon: Zap, count: "1.8K+" },
  { name: "Fashion", slug: "fashion", icon: Shirt, count: "3.2K+" },
  { name: "Beauty", slug: "beauty", icon: Sparkles, count: "950+" },
  { name: "Home & Office", slug: "home-office", icon: Home, count: "1.1K+" },
  { name: "Gaming", slug: "gaming", icon: Gamepad2, count: "680+" },
  { name: "Smart Devices", slug: "smart-devices", icon: Smartphone, count: "420+" },
  { name: "Accessories", slug: "accessories", icon: Watch, count: "2.1K+" },
];

export function FeaturedCategories() {
  return (
    <section className="py-20 bg-background-subtle">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Browse</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Shop by Category</h2>
          </div>
          <Link href="/categories" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map(({ name, slug, icon: Icon, count }) => (
            <Link
              key={slug}
              href={`/categories/${slug}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-background border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground leading-tight">{name}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{count}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline">
            View all categories →
          </Link>
        </div>
      </div>
    </section>
  );
}
