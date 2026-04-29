import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BillPrintToolbar } from "@/components/admin/billing/BillPrintToolbar";

interface Props {
  params: Promise<{ id: string }>;
}

async function getBill(id: string) {
  return prisma.bill.findUnique({
    where: { id },
    include: {
      staff: { select: { name: true, email: true } },
      items: true,
    },
  });
}

function formatCurrency(n: number) {
  return "Rs. " + n.toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default async function BillPrintPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const { id } = await params;
  const bill = await getBill(id);
  if (!bill) notFound();

  const subtotal = Number(bill.subtotal);
  const tax      = Number(bill.taxAmount);
  const discount = Number(bill.discountAmount);
  const total    = Number(bill.total);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; }
      `}</style>

      {/* Toolbar — hidden on print (client component handles onClick) */}
      <BillPrintToolbar />

      {/* Invoice */}
      <div
        className="mx-auto bg-white text-gray-900"
        style={{ maxWidth: 760, padding: "40px 48px", boxShadow: "0 0 0 1px #e5e7eb" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-2xl font-black tracking-tight text-blue-600">NexCart</div>
            <div className="text-sm text-gray-500 mt-1">Smart Shopping. Modern Services.</div>
            <div className="text-xs text-gray-400 mt-0.5">Kathmandu, Nepal · nexcart@example.com</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-gray-200 uppercase tracking-wide">Invoice</div>
            <div className="text-sm font-bold text-gray-700 mt-1">{bill.billNumber}</div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(bill.createdAt)}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #2563eb, #7c3aed)" }} className="mb-6 rounded-full" />

        {/* Customer + Staff */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</div>
            <div className="font-semibold text-gray-800">{bill.customerName ?? "Walk-in Customer"}</div>
            {bill.customerPhone && <div className="text-sm text-gray-500">{bill.customerPhone}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Served By</div>
            <div className="font-semibold text-gray-800">{bill.staff?.name ?? bill.staff?.email ?? "—"}</div>
            <div className="text-sm text-gray-500">{formatDateTime(bill.createdAt)}</div>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr style={{ background: "#1e3a8a", color: "white" }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide rounded-tl-lg">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Product / Service</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Qty</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide">Unit Price</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide rounded-tr-lg">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, idx) => (
              <tr
                key={item.id}
                style={{ background: idx % 2 === 0 ? "#f9fafb" : "white" }}
              >
                <td className="px-4 py-2.5 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-4 py-2.5">
                  <div className="text-sm font-medium text-gray-800">{item.name}</div>
                  {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                </td>
                <td className="px-4 py-2.5 text-sm text-right text-gray-700">{item.quantity}</td>
                <td className="px-4 py-2.5 text-sm text-right text-gray-700">{formatCurrency(Number(item.unitPrice))}</td>
                <td className="px-4 py-2.5 text-sm text-right font-semibold text-gray-900">{formatCurrency(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div style={{ minWidth: 280 }} className="space-y-1.5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>− {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({Number(bill.taxRate)}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div
              className="flex justify-between font-black text-lg pt-2 mt-2"
              style={{ borderTop: "2px solid #1e3a8a", color: "#1e3a8a" }}
            >
              <span>TOTAL</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Payment</span>
              <span className="font-semibold">{bill.paymentMethod.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Status</span>
              <span className={`font-bold ${bill.isPaid ? "text-green-600" : "text-orange-500"}`}>
                {bill.isPaid ? "✓ PAID" : "⚠ UNPAID"}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {bill.notes && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Notes</div>
            <div className="text-sm text-gray-700">{bill.notes}</div>
          </div>
        )}

        {/* Signature line */}
        <div className="grid grid-cols-2 gap-10 mt-10 pt-6" style={{ borderTop: "1px dashed #d1d5db" }}>
          <div className="text-center">
            <div style={{ height: 40, borderBottom: "1px solid #9ca3af" }} className="mb-2" />
            <div className="text-xs text-gray-400">Customer Signature</div>
          </div>
          <div className="text-center">
            <div style={{ height: 40, borderBottom: "1px solid #9ca3af" }} className="mb-2" />
            <div className="text-xs text-gray-400">Authorized Signature</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-400">
          <p className="font-semibold text-gray-600">Thank you for your business!</p>
          <p className="mt-1">NexCart · Smart Shopping. Modern Services. · nexcart@example.com</p>
          <p className="mt-0.5">This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </div>

      {/* Auto-print is handled by BillPrintToolbar client component */}
    </>
  );
}
