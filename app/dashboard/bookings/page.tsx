"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface Booking {
  id: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  service: { name: string; slug: string } | null;
  package: { name: string; price: number } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  CONFIRMED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  IN_PROGRESS: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
  NO_SHOW: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/bookings")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => {
        setBookings(d.bookings ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
        <p className="text-sm text-foreground-muted mt-1">
          View and track your service bookings
        </p>
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-background-subtle rounded-xl animate-pulse"
                />
              ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-foreground-muted">
            <BookOpen size={44} className="opacity-25" />
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">
                No bookings yet
              </p>
              <p className="text-sm mt-1">
                Book a service to see your bookings here
              </p>
            </div>
            <Link
              href="/services"
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-subtle">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Service
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Package
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-foreground">
                        {booking.service?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-foreground-muted">
                      {booking.package?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-foreground-muted">
                      {booking.scheduledAt
                        ? formatDate(booking.scheduledAt)
                        : formatDate(booking.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          STATUS_STYLES[booking.status] ??
                            "bg-background-subtle text-foreground-muted"
                        )}
                      >
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-foreground">
                      {booking.package?.price != null
                        ? formatCurrency(booking.package.price)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
