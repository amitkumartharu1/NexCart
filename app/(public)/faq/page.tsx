"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "How do I place an order?", a: "Browse our shop, add items to your cart, and proceed to checkout. You can pay with card, eSewa, Khalti, or cash on delivery." },
  { q: "What payment methods do you accept?", a: "We accept Credit/Debit cards (Visa, Mastercard), eSewa, Khalti, and Cash on Delivery for select areas." },
  { q: "How long does delivery take?", a: "Kathmandu Valley: 1-2 business days. Outside valley: 3-5 business days. Express delivery available for an additional fee." },
  { q: "What is your return policy?", a: "We offer a 7-day return policy for most items. Products must be unused and in original packaging. Electronics have a 3-day return window." },
  { q: "How do I track my order?", a: "Once your order is shipped, you'll receive a tracking number via email. You can also track orders from your dashboard under 'My Orders'." },
  { q: "Do you offer free shipping?", a: "Yes! Orders above NPR 5,000 qualify for free shipping within the Kathmandu Valley. Standard shipping rates apply for smaller orders." },
  { q: "How do I book a service?", a: "Browse our services, select a package, choose your preferred date/time, and complete the booking. We'll confirm within 2 hours." },
  { q: "Can I cancel my order?", a: "Orders can be cancelled within 2 hours of placement. Once dispatched, cancellations are not possible but you may initiate a return." },
  { q: "Is my payment information secure?", a: "Absolutely. All payments are processed through secured payment gateways with 256-bit SSL encryption. We never store card details." },
  { q: "How do I contact customer support?", a: "Reach us at support@nexcart.com, call +977-9800000000, or use the live chat on our site. Available Mon-Sat, 9am-6pm NPT." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="pt-20">
      <section className="py-20 bg-background">
        <div className="container-wide max-w-3xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
            <p className="text-foreground-muted mt-3">Everything you need to know about NexCart.</p>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-background rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown size={16} className={cn("text-foreground-muted flex-shrink-0 transition-transform", open === i && "rotate-180")} />
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm text-foreground-muted border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center p-6 bg-background-subtle rounded-2xl border border-border">
            <p className="font-semibold text-foreground">Still have questions?</p>
            <p className="text-sm text-foreground-muted mt-1 mb-4">Our support team is here to help.</p>
            <a href="/contact" className="inline-flex px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
