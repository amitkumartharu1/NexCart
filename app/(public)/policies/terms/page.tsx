import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of Service — NexCart" };
export default function TermsPage() {
  return (
    <div className="pt-20 pb-16">
      <div className="container-wide max-w-3xl">
        <h1 className="text-3xl font-bold mt-8 mb-2">Terms of Service</h1>
        <p className="text-sm text-foreground-muted mb-8">Last updated: April 2026</p>
        <div className="space-y-6 text-sm text-foreground-muted">
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Acceptance of Terms</h2><p>By using NexCart, you agree to these terms. If you do not agree, please do not use our services.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Account Responsibilities</h2><p>You are responsible for maintaining the security of your account and all activity that occurs under it. Notify us immediately of any unauthorized access.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Purchases & Payments</h2><p>All prices are in NPR unless stated otherwise. We reserve the right to modify prices at any time. Payment must be made in full before order dispatch.</p></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Prohibited Activities</h2><ul className="list-disc pl-5 space-y-1"><li>Fraud, impersonation, or misuse of the platform</li><li>Attempting to hack or reverse engineer our systems</li><li>Posting fake reviews or misleading content</li></ul></section>
          <section><h2 className="text-lg font-semibold text-foreground mb-2">Limitation of Liability</h2><p>NexCart is not liable for indirect, incidental, or consequential damages arising from use of the platform.</p></section>
        </div>
      </div>
    </div>
  );
}
