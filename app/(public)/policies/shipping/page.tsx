import type { Metadata } from "next";
export const metadata: Metadata = { title: "Shipping Policy — NexCart" };
export default function ShippingPolicyPage() {
  return (
    <div className="pt-20 pb-16">
      <div className="container-wide max-w-3xl">
        <h1 className="text-3xl font-bold mt-8 mb-2">Shipping Policy</h1>
        <p className="text-sm text-foreground-muted mb-8">Last updated: April 2026</p>
        <div className="prose prose-sm max-w-none text-foreground-muted space-y-6">
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Delivery Areas</h2><p>We currently deliver across Nepal. Kathmandu Valley orders are prioritized with faster delivery windows.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Delivery Timeframes</h2><ul className="list-disc pl-5 space-y-1"><li>Kathmandu Valley: 1–2 business days</li><li>Major cities (Pokhara, Biratnagar, Bharatpur): 2–3 business days</li><li>Other areas: 3–7 business days</li></ul></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Shipping Charges</h2><ul className="list-disc pl-5 space-y-1"><li>Orders above NPR 5,000: Free shipping</li><li>Orders below NPR 5,000: NPR 150 flat rate</li><li>Express delivery: NPR 300 (same-day within Valley)</li></ul></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Order Tracking</h2><p>You will receive a tracking number via email once your order is dispatched. Track your order anytime from your dashboard.</p></section>
        </div>
      </div>
    </div>
  );
}
