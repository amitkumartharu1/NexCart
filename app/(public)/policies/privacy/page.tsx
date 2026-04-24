import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy — NexCart" };
export default function PrivacyPage() {
  return (
    <div className="pt-20 pb-16">
      <div className="container-wide max-w-3xl">
        <h1 className="text-3xl font-bold mt-8 mb-2">Privacy Policy</h1>
        <p className="text-sm text-foreground-muted mb-8">Last updated: April 2026</p>
        <div className="space-y-6 text-sm text-foreground-muted">
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Information We Collect</h2><p>We collect name, email, phone, address, and payment details to process orders. We also collect browsing data to improve your experience.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">How We Use Your Information</h2><ul className="list-disc pl-5 space-y-1"><li>Process and fulfill your orders</li><li>Send order confirmations and updates</li><li>Improve our platform and services</li><li>Send promotional offers (with your consent)</li></ul></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Data Security</h2><p>We use industry-standard encryption (256-bit SSL) to protect your data. We never sell your personal information to third parties.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Your Rights</h2><p>You may request access to, correction of, or deletion of your personal data at any time by contacting support@nexcart.com.</p></section>
        </div>
      </div>
    </div>
  );
}
