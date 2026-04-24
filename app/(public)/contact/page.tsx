"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="pt-20">
      <section className="py-16 bg-background">
        <div className="container-wide max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="text-foreground-muted mt-3">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info */}
            <div className="space-y-5">
              {[
                { icon: Mail, title: "Email", value: "support@nexcart.com", sub: "We reply within 24 hours" },
                { icon: Phone, title: "Phone", value: "+977-9800000000", sub: "Mon-Sat, 9am-6pm NPT" },
                { icon: MapPin, title: "Address", value: "Kathmandu, Nepal", sub: "Visit our showroom" },
                { icon: Clock, title: "Hours", value: "Mon-Sat: 9am - 6pm", sub: "Closed on Sundays" },
              ].map(({ icon: Icon, title, value, sub }) => (
                <div key={title} className="flex gap-4 p-4 rounded-xl bg-background-subtle border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">{title}</p>
                    <p className="font-medium text-foreground mt-0.5">{value}</p>
                    <p className="text-xs text-foreground-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-background rounded-2xl border border-border p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Subject *</label>
                  <input required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none" />
                </div>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50">
                  <Send size={15} />{loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
