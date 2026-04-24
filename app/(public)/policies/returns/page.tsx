import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Returns & Refunds — NexCart" };

// Always re-render so admin setting changes show immediately after revalidation
export const dynamic = "force-dynamic";

async function getPolicySettings() {
  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ["return_period", "return_policy", "warranty_period", "warranty_description"] } },
    });
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.value) map[r.key] = r.value;
    }
    return map;
  } catch {
    return {};
  }
}

export default async function ReturnsPage() {
  const s = await getPolicySettings();

  const returnPeriod = s.return_period || "30 Days";
  const returnPolicy = s.return_policy || "";
  const warrantyPeriod = s.warranty_period || "1 Year";
  const warrantyDescription = s.warranty_description || "";

  return (
    <div className="pt-20 pb-16">
      <div className="container-wide max-w-3xl">
        <h1 className="text-3xl font-bold mt-8 mb-2">Returns &amp; Refunds Policy</h1>
        <p className="text-sm text-foreground-muted mb-8">Last updated: April 2026</p>
        <div className="space-y-6 text-foreground-muted">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Return Window</h2>
            {returnPolicy ? (
              <p>{returnPolicy}</p>
            ) : (
              <p>
                Most items can be returned within{" "}
                <strong className="text-foreground">{returnPeriod}</strong> of delivery.
                Electronics: 3 days. Services: non-refundable once completed.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Return Period</h2>
            <p>
              Our standard return window is{" "}
              <strong className="text-foreground">{returnPeriod}</strong> from the date of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Return Conditions</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Item must be unused and in original packaging</li>
              <li>All tags and accessories must be intact</li>
              <li>Proof of purchase required</li>
              <li>Damaged, used, or altered items are not eligible</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How to Initiate a Return</h2>
            <p>
              Go to My Orders in your dashboard, select the order, and click &ldquo;Return Item&rdquo;.
              Our team will guide you through the process.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Refund Timeline</h2>
            <p>
              Once we receive and inspect the returned item, refunds are processed within
              5–7 business days to your original payment method.
            </p>
          </section>

          {(warrantyPeriod || warrantyDescription) && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">Warranty</h2>
              <p>
                {warrantyDescription ||
                  `All products come with a ${warrantyPeriod} warranty against manufacturing defects.`}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
