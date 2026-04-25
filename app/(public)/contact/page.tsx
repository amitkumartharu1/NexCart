"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS = {
  contact_email:       "support@nexcart.com",
  contact_email_sub:   "We reply within 24 hours",
  contact_phone:       "+977-9800000000",
  contact_phone_sub:   "Mon-Sat, 9am-6pm NPT",
  contact_address:     "Kathmandu, Nepal",
  contact_address_sub: "Visit our showroom",
  contact_hours:       "Mon-Sat: 9am - 6pm",
  contact_hours_sub:   "Closed on Sundays",
  contact_map_url:     "",
};

type Settings = typeof DEFAULTS;

export default function ContactPage() {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [info, setInfo]       = useState<Settings>(DEFAULTS);

  // Fetch contact info from DB settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.settings) {
          setInfo((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(prev) as (keyof Settings)[]) {
              if (data.settings[key]) merged[key] = data.settings[key];
            }
            return merged;
          });
        }
      })
      .catch(() => {/* keep defaults */});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error((err as any).error ?? "Failed to send message. Please try again.");
        return;
      }

      toast.success("Message sent! We'll get back to you within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const infoCards = [
    { icon: Mail,   title: "Email",   value: info.contact_email,   sub: info.contact_email_sub },
    { icon: Phone,  title: "Phone",   value: info.contact_phone,   sub: info.contact_phone_sub },
    { icon: MapPin, title: "Address", value: info.contact_address, sub: info.contact_address_sub },
    { icon: Clock,  title: "Hours",   value: info.contact_hours,   sub: info.contact_hours_sub },
  ];

  return (
    <div className="pt-20">
      <section className="py-16 bg-background">
        <div className="container-wide max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="text-foreground-muted mt-3">
              We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info cards */}
            <div className="space-y-4">
              {infoCards.map(({ icon: Icon, title, value, sub }) => (
                <div key={title} className="flex gap-4 p-4 rounded-xl bg-background-subtle border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">{title}</p>
                    <p className="font-medium text-foreground mt-0.5">{value}</p>
                    {sub && <p className="text-xs text-foreground-muted">{sub}</p>}
                  </div>
                </div>
              ))}

              {/* Google Maps embed */}
              {info.contact_map_url && (
                <div className="rounded-xl overflow-hidden border border-border aspect-video">
                  <iframe
                    src={info.contact_map_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Store location"
                  />
                </div>
              )}
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-background rounded-2xl border border-border p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="What is this about?"
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help you…"
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none transition-colors"
                  />
                  <p className="text-xs text-foreground-subtle mt-1 text-right">
                    {form.message.length}/5000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading
                    ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    : <Send size={15} />}
                  {loading ? "Sending…" : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
