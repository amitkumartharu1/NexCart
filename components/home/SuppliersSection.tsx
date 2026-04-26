"use client";

import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { Building2 } from "lucide-react";

interface Supplier {
  id:          string;
  name:        string;
  logo:        string | null;
  description: string | null;
  website:     string | null;
  country:     string | null;
}

function SupplierCard({ s }: { s: Supplier }) {
  return (
    <div className="group flex-shrink-0 flex flex-col items-center gap-3 px-8 py-5 rounded-2xl border border-border bg-background hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-default min-w-[160px]">
      {s.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.logo}
          alt={s.name}
          className="h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
        />
      ) : (
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">{s.name.slice(0, 2).toUpperCase()}</span>
        </div>
      )}
      <p className="text-xs font-medium text-foreground-muted group-hover:text-foreground transition-colors text-center whitespace-nowrap">
        {s.name}
      </p>
      {s.country && (
        <span className="text-[10px] text-foreground-muted opacity-60">{s.country}</span>
      )}
    </div>
  );
}

export function SuppliersSection({ suppliers }: { suppliers: Supplier[] }) {
  if (suppliers.length === 0) return null;

  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll animation via CSS — no JS needed for the marquee effect
  return (
    <section className="py-16 px-4 bg-background-subtle overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="flex items-center justify-center gap-2 mx-auto mb-3 w-fit px-4 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20">
            <Building2 size={12} /> Our Partners
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Trusted Suppliers &amp; Partners
          </h2>
          <p className="mt-2 text-sm text-foreground-muted">
            We work with the best brands to bring you quality products
          </p>
        </motion.div>

        {/* Marquee — double the cards for seamless loop */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background-subtle to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background-subtle to-transparent pointer-events-none" />

          <div className="overflow-hidden">
            <div
              ref={trackRef}
              className="flex gap-4"
              style={{
                animation: suppliers.length > 3 ? `supplierScroll ${suppliers.length * 3}s linear infinite` : "none",
              }}
            >
              {/* First pass */}
              {suppliers.map((s) => <SupplierCard key={s.id} s={s} />)}
              {/* Duplicate for seamless loop */}
              {suppliers.length > 3 && suppliers.map((s) => <SupplierCard key={`dup-${s.id}`} s={s} />)}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes supplierScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
