"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu, Zap, Shirt, Sparkles, Home, Gamepad2,
  Smartphone, Watch, ArrowRight, Tag, Layers, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  _count: { products: number };
}

// Icon map for slug → Lucide icon
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  electronics:    Cpu,
  gadgets:        Zap,
  fashion:        Shirt,
  beauty:         Sparkles,
  "home-office":  Home,
  gaming:         Gamepad2,
  "smart-devices": Smartphone,
  accessories:    Watch,
  mobile:         Smartphone,
  computers:      Cpu,
  watches:        Watch,
  clothing:       Shirt,
};

function getIcon(slug: string) {
  // Fuzzy match: exact slug, then partial slug contain
  if (ICON_MAP[slug]) return ICON_MAP[slug];
  const entry = Object.entries(ICON_MAP).find(([key]) =>
    slug.includes(key) || key.includes(slug.split("-")[0])
  );
  return entry ? entry[1] : Package;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K+`;
  return n > 0 ? `${n}+` : "Available";
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-background border border-border animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-background-subtle" />
      <div className="space-y-1 text-center">
        <div className="h-2.5 w-16 rounded-full bg-background-subtle mx-auto" />
        <div className="h-2 w-10 rounded-full bg-background-subtle mx-auto" />
      </div>
    </div>
  );
}

export function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/categories?featured=true&limit=8")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        setCategories(data.categories ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <section className="py-20 bg-background-subtle">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Browse</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Shop by Category</h2>
          </div>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error || categories.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-border">
            <Layers size={28} className="mx-auto mb-2 text-foreground-muted opacity-40" />
            <p className="text-sm text-foreground-muted">
              {error ? "Couldn't load categories" : "No categories yet"}
            </p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-3",
            categories.length <= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8"
          )}>
            {categories.map(({ id, name, slug, _count }) => {
              const Icon = getIcon(slug);
              return (
                <Link
                  key={id}
                  href={`/categories/${slug}`}
                  className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-background border border-border hover:border-primary/40 hover:shadow-md transition-all duration-200 hover:-translate-y-1 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{name}</p>
                    <p className="text-xs text-foreground-muted mt-0.5">{formatCount(_count.products)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="sm:hidden mt-6 text-center">
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline">
            View all categories →
          </Link>
        </div>
      </div>
    </section>
  );
}
