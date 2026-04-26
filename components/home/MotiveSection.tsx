"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Target } from "lucide-react";

interface MotiveData {
  title:       string;
  description: string;
  points:      string[];
}

export function MotiveSection({ data }: { data: MotiveData }) {
  if (!data.title && !data.description && data.points.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-background-subtle">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20">
              <Target size={12} /> Our Mission
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.title}</h2>
          {data.description && (
            <p className="mt-4 text-foreground-muted leading-relaxed max-w-2xl mx-auto text-lg">
              {data.description}
            </p>
          )}
        </motion.div>

        {/* Points */}
        {data.points.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.points.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex items-start gap-3 p-5 bg-background rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={14} className="text-primary" />
                </div>
                <p className="text-foreground leading-relaxed">{point}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
