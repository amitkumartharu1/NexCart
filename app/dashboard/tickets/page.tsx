"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/format";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WAITING_CUSTOMER: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  RESOLVED: "bg-gray-500/10 text-gray-500 dark:text-gray-400",
  CLOSED: "bg-gray-400/10 text-gray-400 dark:text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_CUSTOMER: "Awaiting Response",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-500/10 text-gray-500",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  HIGH: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  URGENT: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface NewTicketForm {
  subject: string;
  description: string;
  priority: string;
}

const EMPTY_FORM: NewTicketForm = {
  subject: "",
  description: "",
  priority: "MEDIUM",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewTicketForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/tickets")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => {
        setTickets(d.tickets ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      setTickets((prev) => [data.ticket, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Support ticket created");
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Get help from our support team
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          {showForm ? (
            <>
              <X size={16} /> Cancel
            </>
          ) : (
            <>
              <Plus size={16} /> New Ticket
            </>
          )}
        </button>
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="bg-background rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Create Support Ticket
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                placeholder="Brief description of your issue"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Please describe your issue in detail..."
                className={cn(inputClass, "resize-none")}
              />
            </div>

            <div className="max-w-xs">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 rounded-lg border border-border text-foreground-muted text-sm font-medium hover:bg-background-subtle transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
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
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-foreground-muted">
            <LifeBuoy size={44} className="opacity-25" />
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">
                No support tickets
              </p>
              <p className="text-sm mt-1">
                Need help? Create a ticket and our team will assist you
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <Plus size={14} /> Create First Ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-subtle">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Subject
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Priority
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-foreground line-clamp-1">
                        {ticket.subject}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          PRIORITY_STYLES[ticket.priority] ??
                            "bg-background-subtle text-foreground-muted"
                        )}
                      >
                        {ticket.priority.charAt(0) +
                          ticket.priority.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          STATUS_STYLES[ticket.status] ??
                            "bg-background-subtle text-foreground-muted"
                        )}
                      >
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-foreground-muted">
                      {formatDate(ticket.createdAt)}
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
