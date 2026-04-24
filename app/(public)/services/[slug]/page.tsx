"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Clock, BadgeCheck, Wrench,
  Tag, CheckCircle2, PhoneCall,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

interface ServiceFaq {
  question: string;
  answer: string;
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
  serviceCategory: { name: string; slug: string } | null;
  packages: ServicePackage[];
  faqs?: ServiceFaq[];
}

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/services/${slug}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setService(data.service);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container-wide pt-24 pb-10 space-y-6 animate-pulse">
        <div className="h-6 bg-background-subtle rounded w-32" />
        <div className="h-64 bg-background-subtle rounded-2xl" />
        <div className="h-40 bg-background-subtle rounded-2xl" />
      </div>
    );
  }

  if (notFound || !service) {
    return (
      <div className="container-wide pt-24 pb-10 text-center">
        <Wrench size={48} className="mx-auto text-foreground-muted opacity-30 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Service not found</h2>
        <p className="text-foreground-muted mb-6">This service doesn&apos;t exist or is no longer available.</p>
        <Link href="/services" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
          View All Services
        </Link>
      </div>
    );
  }

  return (
    <div className="container-wide pt-24 pb-16 max-w-4xl">
      {/* Back */}
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> All Services
      </Link>

      {/* Hero */}
      <div className="rounded-2xl overflow-hidden border border-border mb-8">
        {service.image ? (
          <div className="relative aspect-[3/1] w-full bg-background-subtle">
            <Image src={service.image} alt={service.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="aspect-[3/1] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            {service.icon ? (
              <span className="text-7xl">{service.icon}</span>
            ) : (
              <Wrench size={56} className="text-primary opacity-40" />
            )}
          </div>
        )}
        <div className="p-6 bg-background">
          {service.serviceCategory && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-3">
              <Tag size={12} />
              {service.serviceCategory.name}
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground mb-2">{service.name}</h1>
          {service.shortDescription && (
            <p className="text-foreground-muted text-base leading-relaxed">{service.shortDescription}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-foreground-muted">
            {service.duration && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {service.duration} minutes
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={14} className="text-emerald-500" />
              Verified Professional
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {service.description && (
            <div className="bg-background rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-3">About This Service</h2>
              <p className="text-foreground-muted text-sm leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>
          )}

          {/* FAQs */}
          {service.faqs && service.faqs.length > 0 && (
            <div className="bg-background rounded-xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {service.faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="font-medium text-foreground text-sm">{faq.question}</p>
                    <p className="text-foreground-muted text-sm mt-1 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — packages + booking */}
        <div className="space-y-4">
          {/* Packages */}
          {service.packages.length > 0 ? (
            <div className="bg-background rounded-xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-4">Packages</h2>
              <div className="space-y-3">
                {service.packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-lg border border-border p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground text-sm">{pkg.name}</p>
                      <span className="font-bold text-primary">{formatCurrency(pkg.price)}</span>
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-foreground-muted">{pkg.description}</p>
                    )}
                    {pkg.duration && (
                      <p className="text-xs text-foreground-subtle flex items-center gap-1">
                        <Clock size={11} />
                        {pkg.duration} min
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-background rounded-xl border border-border p-5">
              <p className="text-sm text-foreground-muted text-center py-2">Contact us for pricing</p>
            </div>
          )}

          {/* Booking CTA */}
          <div className="bg-background rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 size={16} className="text-primary" />
              {service.isBookable ? "Book This Service" : "Request a Quote"}
            </div>
            <p className="text-xs text-foreground-muted">
              {service.isBookable
                ? "Schedule at a time that works for you."
                : "Tell us what you need and we'll get back to you."}
            </p>
            <a
              href={`mailto:${""}&subject=Enquiry: ${service.name}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <PhoneCall size={14} />
              {service.isBookable ? "Book Now" : "Get Quote"}
            </a>
          </div>

          {/* Trust badges */}
          <div className="bg-background-subtle rounded-xl p-4 space-y-2 text-xs text-foreground-muted">
            {[
              "Certified professionals",
              "Satisfaction guaranteed",
              "Transparent pricing",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
