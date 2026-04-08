import Link from "next/link";
import { Wrench, Settings, MessageCircle, Monitor, Truck, ArrowRight, Clock, Star } from "lucide-react";

const SERVICES = [
  { name: "Device Repair", slug: "repair", icon: Wrench, description: "Professional repair for all your devices — phones, laptops, and more.", price: "From $49", rating: 4.9, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Installation", slug: "installation", icon: Settings, description: "Expert setup and installation for smart devices, home systems, and AV.", price: "From $79", rating: 4.8, color: "text-purple-500", bg: "bg-purple-500/10" },
  { name: "Consultation", slug: "consultation", icon: MessageCircle, description: "One-on-one tech consultation with certified specialists.", price: "From $39", rating: 4.9, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Digital Services", slug: "digital", icon: Monitor, description: "Web design, software setup, data recovery, and digital solutions.", price: "From $59", rating: 4.7, color: "text-orange-500", bg: "bg-orange-500/10" },
];

export function FeaturedServices() {
  return (
    <section className="py-20 bg-background-subtle">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Services</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What We Offer</h2>
            <p className="mt-2 text-foreground-muted">Professional services delivered by certified experts.</p>
          </div>
          <Link href="/services" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors">
            All services <ArrowRight size={14} />
          </Link>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group card-premium p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 space-y-4"
            >
              <div className={`w-12 h-12 rounded-xl ${service.bg} flex items-center justify-center`}>
                <service.icon size={22} className={service.color} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{service.name}</h3>
                <p className="text-sm text-foreground-muted leading-relaxed">{service.description}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-primary">{service.price}</span>
                <div className="flex items-center gap-1 text-xs text-foreground-muted">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {service.rating}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <Clock size={11} />
                <span>Book online — quick confirmation</span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-8 rounded-2xl bg-primary/5 border border-primary/20 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-foreground">Need a custom service?</h3>
            <p className="text-sm text-foreground-muted mt-1">Tell us what you need and we&apos;ll find the right solution for you.</p>
          </div>
          <Link href="/contact" className="flex-shrink-0 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors">
            Get a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
