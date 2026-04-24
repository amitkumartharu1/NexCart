"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Star, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

interface AddressForm {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressForm = {
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nepal",
  phone: "",
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/addresses")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => {
        setAddresses(d.addresses ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.addressLine1 || !form.city || !form.postalCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json().catch(() => ({}));
      setAddresses((prev) => {
        const updated = form.isDefault
          ? prev.map((a) => ({ ...a, isDefault: false }))
          : prev;
        return [data.address, ...updated];
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Address added successfully");
    } catch {
      toast.error("Failed to add address");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/dashboard/addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      const res = await fetch("/api/dashboard/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (!res.ok) throw new Error();
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default address");
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Addresses</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage your saved delivery addresses
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          {showForm ? (
            <>
              <ChevronUp size={16} /> Cancel
            </>
          ) : (
            <>
              <Plus size={16} /> Add Address
            </>
          )}
        </button>
      </div>

      {/* Add Address Form */}
      {showForm && (
        <div className="bg-background rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">
            New Address
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
                required
                placeholder="Street, house number"
                className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Address Line 2
              </label>
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, floor, landmark (optional)"
                className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  State / Province
                </label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Country
                </label>
                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="tel"
                  className="w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="isDefault"
                checked={form.isDefault}
                onChange={handleChange}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-sm text-foreground">Set as default address</span>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Address"}
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

      {/* Address List */}
      {loading ? (
        <div className="space-y-4">
          {Array(2).fill(null).map((_, i) => (
            <div key={i} className="bg-background rounded-xl border border-border p-5 animate-pulse space-y-3">
              <div className="h-4 bg-background-subtle rounded w-1/3" />
              <div className="h-4 bg-background-subtle rounded w-1/2" />
              <div className="h-4 bg-background-subtle rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-background rounded-xl border border-border flex flex-col items-center gap-4 py-16 text-foreground-muted">
          <MapPin size={44} className="opacity-25" />
          <div className="text-center">
            <p className="font-semibold text-foreground text-lg">No saved addresses</p>
            <p className="text-sm mt-1">Add a delivery address to speed up checkout</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <Plus size={14} /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                "bg-background rounded-xl border p-5 transition-colors",
                address.isDefault ? "border-primary/40 bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {address.firstName} {address.lastName}
                    </p>
                    {address.isDefault && (
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {[address.city, address.state, address.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                    {" · "}
                    {address.country}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-foreground-muted">{address.phone}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={settingDefaultId === address.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
                      title="Set as default"
                    >
                      <Star size={12} />
                      Set Default
                    </button>
                  )}
                  {address.isDefault && (
                    <span className="flex items-center gap-1 text-xs text-primary px-2 py-1.5">
                      <Check size={12} /> Default
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deletingId === address.id}
                    className="p-1.5 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    title="Delete address"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
