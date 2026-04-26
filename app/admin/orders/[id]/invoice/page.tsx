"use client";

/**
 * /admin/orders/[id]/invoice
 * Printable invoice page — opens in a new tab, has a Print button.
 * Uses @media print CSS to hide browser chrome when printing.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { name: string; images: { url: string }[] };
  variant: { name: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  shippingAmount: number;   // schema field name (NOT shippingFee)
  discountAmount: number;
  total: number;
  notes: string | null;
  user: { name: string; email: string; phone: string | null } | null;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  } | null;
  // paymentMethod lives on the Payment record, not Order
  payments: { method: string; status: string; amount: number; createdAt: string }[];
}

function formatCurrency(amount: number) {
  return `NPR ${Number(amount).toLocaleString("en-NP", { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((data) => setOrder(data.order))
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div>
          <p className="text-destructive mb-4">{error || "Order not found"}</p>
          <Link href="/admin/orders" className="text-primary hover:underline text-sm">← Back to orders</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print/action toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b border-border px-6 py-3 flex items-center justify-between">
        <Link
          href={`/admin/orders/${order.id}`}
          className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> Back to Order
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <Printer size={14} />
            Print Invoice
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-medium hover:bg-background-subtle transition-colors"
          >
            <Download size={14} />
            Save as PDF
          </button>
        </div>
      </div>

      {/* Invoice body */}
      <div className="invoice-page max-w-3xl mx-auto p-8 print:p-0 print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Nex<span className="text-indigo-600">Cart</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">nexcart.vercel.app</p>
            <p className="text-sm text-gray-500">support@nexcart.com</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">INVOICE</p>
            <p className="text-sm text-gray-500 mt-1">
              #{order.orderNumber ?? order.id.slice(-8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
            <span
              className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                order.status === "DELIVERED"  ? "bg-green-100 text-green-700" :
                order.status === "CANCELLED"  ? "bg-red-100 text-red-700"    :
                order.status === "REFUNDED"   ? "bg-orange-100 text-orange-700" :
                "bg-indigo-100 text-indigo-700"
              }`}
            >
              {order.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Billing + Shipping */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
            {order.user ? (
              <>
                <p className="font-semibold text-gray-900">{order.user.name}</p>
                <p className="text-sm text-gray-600">{order.user.email}</p>
                {order.user.phone && <p className="text-sm text-gray-600">{order.user.phone}</p>}
              </>
            ) : <p className="text-sm text-gray-500">Guest Order</p>}
          </div>
          {order.shippingAddress && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ship To</p>
              <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && (
                <p className="text-sm text-gray-600">{order.shippingAddress.line2}</p>
              )}
              <p className="text-sm text-gray-600">
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
              </p>
              <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
              )}
            </div>
          )}
        </div>

        {/* Payment info — method comes from Payment records, not Order */}
        {order.payments[0]?.method && (
          <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">Payment Method:</span>
            <span className="capitalize">{order.payments[0].method.replace(/_/g, " ")}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              order.payments[0].status === "PAID" ? "bg-green-100 text-green-700" :
              order.payments[0].status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {order.payments[0].status}
            </span>
          </div>
        )}

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wide">#</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wide">Product</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wide">Qty</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wide">Unit Price</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-600 uppercase text-xs tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {item.product.images[0]?.url && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 print:hidden">
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      {item.variant && (
                        <p className="text-xs text-gray-400">{item.variant.name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right text-gray-700">{item.quantity}</td>
                <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.shippingAmount) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>{formatCurrency(order.shippingAmount)}</span>
              </div>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>−{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Order Notes</p>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-6 text-center text-xs text-gray-400 space-y-1">
          <p className="font-medium text-gray-600">Thank you for shopping with NexCart!</p>
          <p>For any queries, contact us at support@nexcart.com</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .invoice-page { padding: 0 !important; }
          @page { size: A4 portrait; margin: 1.5cm; }
        }
      `}</style>
    </>
  );
}
