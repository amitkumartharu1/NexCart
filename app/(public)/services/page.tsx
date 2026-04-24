"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Wrench,
  ArrowRight,
  Tag,
  Clock,
  Calendar,
  BadgeCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface ServicePackage {
  name: string;
  price: number;
}

interface ServiceCategory {
  name: string;
  slug: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  image: string | null;
  icon: string | null;
  duration: number | null;
  isBookable: boolean;
  serviceCategory: ServiceCategory | null;
  packages: ServicePackage[];
}

const PLACEHOLDER_COUNT = 4;

function ServiceCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-background-subtle" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-background-subtle rounded w-1/4" />
        <div className="h-5 bg-background-subtle rounded w-2/3" />
        <div className="h-4 bg-background-subtle rounded w-full" />
        <div className="h-4 bg-background-subtle rounded w-3/4" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-background-subtle rounded w-1/4" />
          <div className="h-9 bg-background-subtle rounded-lg w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((data) => setServices(data.services ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive unique categories
  const categories = Array.from(
    new Map(
      services
        .filter((s) => s.serviceCategory)
        .map((s) => [s.serviceCategory!.slug, s.serviceCategory!])
    ).values()
  );

  const filtered =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.serviceCategory?.slug === activeCategory);

  return (
    <div className="container-wide pt-24 pb-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl px-8 py-12 text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <BadgeCheck className="w-4 h-4" />
          Expert Services
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Professional Services
        </h1>
        <p className="text-foreground-muted max-w-xl mx-auto text-lg">
          Trusted professionals, transparent pricing, and guaranteed
          satisfaction — from installation to maintenance.
        </p>
      </div>

      {/* Category Filter */}
      {!loading && categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border",
              activeCategory === "all"
                ? "bg-primary text-white border-primary"
                : "bg-background border-border text-foreground-muted hover:text-foreground"
            )}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border",
                activeCategory === cat.slug
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-border text-foreground-muted hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* No Services — Placeholder Cards */}
      {!loading && services.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <div
              key={i}
              className="bg-background border border-dashed border-border rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-video bg-background-subtle flex items-center justify-center">
                <Wrench className="w-10 h-10 text-foreground-muted opacity-40" />
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div className="inline-flex items-center gap-1 text-xs text-foreground-muted">
                  <Tag className="w-3 h-3" />
                  Service
                </div>
                <h3 className="font-bold text-foreground">Coming Soon</h3>
                <p className="text-sm text-foreground-muted">
                  We&apos;re preparing something great. Check back soon.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Cards Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((service) => {
            const startingPrice = service.packages[0]?.price ?? null;

            return (
              <div
                key={service.id}
                className="bg-background border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200"
              >
                {/* Image / Icon */}
                <div className="relative aspect-video bg-background-subtle overflow-hidden">
                  {service.image ? (
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {service.icon ? (
                        <span className="text-4xl">{service.icon}</span>
                      ) : (
                        <Wrench className="w-10 h-10 text-foreground-muted opacity-40" />
                      )}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-1 gap-2">
                  {service.serviceCategory && (
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <Tag className="w-3 h-3" />
                      {service.serviceCategory.name}
                    </div>
                  )}

                  <h2 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {service.name}
                  </h2>

                  {service.shortDescription && (
                    <p className="text-sm text-foreground-muted line-clamp-2 flex-1">
                      {service.shortDescription}
                    </p>
                  )}

                  {service.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration} min
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <div>
                      {startingPrice !== null ? (
                        <div>
                          <p className="text-xs text-foreground-muted">
                            Starting at
                          </p>
                          <p className="font-bold text-primary">
                            {formatCurrency(startingPrice)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground-muted">
                          Contact for pricing
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/services/${service.slug}`}
                      className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      {service.isBookable ? (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          Book Now
                        </>
                      ) : (
                        <>
                          Learn More
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
