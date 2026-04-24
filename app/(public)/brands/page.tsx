"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tag, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

function BrandCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl p-6 animate-pulse flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-background-subtle" />
      <div className="h-4 bg-background-subtle rounded w-2/3" />
    </div>
  );
}

function BrandInitial({ name }: { name: string }) {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
  ];
  const colorClass = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
        colorClass
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/brands")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((data) => setBrands(data.brands ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-wide py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Layers className="w-4 h-4" />
          All Brands
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Browse by Brand
        </h1>
        <p className="text-foreground-muted max-w-lg mx-auto">
          Discover products from your favourite brands. Quality you can trust,
          from names you know.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <BrandCardSkeleton key={i} />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
          <div className="w-20 h-20 rounded-full bg-background-subtle border-2 border-dashed border-border flex items-center justify-center">
            <Tag className="w-8 h-8 text-foreground-muted" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-1">
              No brands yet
            </h2>
            <p className="text-foreground-muted">
              Brands will appear here once they&apos;re added to the store.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/shop?brand=${brand.id}`}
              className="bg-background border border-border rounded-xl p-6 flex flex-col items-center gap-3 group hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              {brand.logo ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-background-subtle">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>
              ) : (
                <BrandInitial name={brand.name} />
              )}
              <p className="font-semibold text-foreground text-center group-hover:text-primary transition-colors text-sm">
                {brand.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
