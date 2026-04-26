"use client";

import { motion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";

interface FounderData {
  name:   string;
  role:   string;
  bio:    string;
  vision: string;
  image:  string;
}

export function FounderSection({ data }: { data: FounderData }) {
  if (!data.name) return null;

  return (
    <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-background via-primary/3 to-background">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/4 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20">
            <Sparkles size={12} /> Meet the Founder
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Photo side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col items-center md:items-end"
          >
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 blur-xl" />
              {data.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.image}
                  alt={data.name}
                  className="relative w-52 h-52 md:w-64 md:h-64 rounded-full object-cover border-4 border-background shadow-2xl"
                />
              ) : (
                <div className="relative w-52 h-52 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-background shadow-2xl">
                  <span className="text-white font-bold text-5xl">
                    {data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
              >
                ✦ {data.role}
              </motion.div>
            </div>
          </motion.div>

          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {data.name}
              </h2>
              <p className="text-primary font-semibold mt-1">{data.role}</p>
            </div>

            {data.bio && (
              <p className="text-foreground-muted leading-relaxed">{data.bio}</p>
            )}

            {data.vision && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="relative bg-primary/5 border border-primary/15 rounded-2xl p-5"
              >
                <Quote size={24} className="text-primary/30 mb-2" />
                <p className="text-foreground font-medium leading-relaxed italic">
                  &ldquo;{data.vision}&rdquo;
                </p>
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
