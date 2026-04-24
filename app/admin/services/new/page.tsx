"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: string;
  duration: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  isBookable: boolean;
  requiresOnsite: boolean;
  priceType: "fixed" | "hourly" | "custom";
  categoryId: string;
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring transition";

export default function NewServicePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    basePrice: "",
    duration: "",
    status: "DRAFT",
    isFeatured: false,
    isBookable: true,
    requiresOnsite: false,
    priceType: "fixed",
    categoryId: "",
  });

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    fetch("/api/admin/services/categories")
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d: { categories?: ServiceCategory[] }) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const handleNameChange = useCallback(
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        name: value,
        slug:
          prev.slug === toSlug(prev.name) || prev.slug === ""
            ? toSlug(value)
            : prev.slug,
      }));
      if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
    },
    [errors.name]
  );

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) next.name = "Service name is required";
    if (!form.slug.trim()) next.slug = "Slug is required";
    if (form.basePrice && (isNaN(Number(form.basePrice)) || Number(form.basePrice) < 0)) {
      next.basePrice = "Must be a positive number";
    }
    if (form.duration && (isNaN(Number(form.duration)) || Number(form.duration) <= 0)) {
      next.duration = "Must be a positive number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        shortDescription: form.shortDescription.trim() || null,
        basePrice: form.basePrice ? Number(form.basePrice) : null,
        duration: form.duration ? parseInt(form.duration, 10) : null,
        status: form.status,
        isFeatured: form.isFeatured,
        isBookable: form.isBookable,
        requiresOnsite: form.requiresOnsite,
        priceType: form.priceType,
        categoryId: form.categoryId || null,
      };

      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to create service");
      }

      toast.success("Service created successfully");
      router.push("/admin/services");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/services"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Service</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            Create a new bookable service
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Basic Info */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
            Basic Information
          </h2>

          <Field label="Service Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Phone Screen Repair"
              className={cn(inputCls, errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </Field>

          <Field label="Slug" required hint="Used in the service URL. Auto-generated from name.">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => set("slug", toSlug(e.target.value))}
              placeholder="phone-screen-repair"
              className={cn(inputCls, errors.slug && "border-destructive")}
            />
            {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
          </Field>

          <Field label="Short Description" hint="Shown on service cards.">
            <input
              type="text"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="Brief description of the service"
              className={inputCls}
              maxLength={160}
            />
          </Field>

          <Field label="Description" hint="Full service description.">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detailed service description..."
              rows={5}
              className={cn(inputCls, "resize-y")}
            />
          </Field>
        </section>

        {/* Pricing & Duration */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
            Pricing & Duration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Price Type">
              <select
                value={form.priceType}
                onChange={(e) => set("priceType", e.target.value as FormData["priceType"])}
                className={inputCls}
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="custom">Custom / Quote</option>
              </select>
            </Field>

            <Field label="Base Price" hint={form.priceType === "hourly" ? "Per hour" : "Fixed price"}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => set("basePrice", e.target.value)}
                  placeholder="0.00"
                  disabled={form.priceType === "custom"}
                  className={cn(inputCls, "pl-7", errors.basePrice && "border-destructive", form.priceType === "custom" && "opacity-50")}
                />
              </div>
              {errors.basePrice && <p className="text-xs text-destructive mt-1">{errors.basePrice}</p>}
            </Field>

            <Field label="Duration (minutes)" hint="Estimated service time">
              <input
                type="number"
                min={0}
                step={15}
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="60"
                className={cn(inputCls, errors.duration && "border-destructive")}
              />
              {errors.duration && <p className="text-xs text-destructive mt-1">{errors.duration}</p>}
            </Field>
          </div>
        </section>

        {/* Organization */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
            Organization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className={inputCls}
              >
                <option value="">— No category —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as FormData["status"])}
                className={inputCls}
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                Feature on homepage
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.isBookable}
                onChange={(e) => set("isBookable", e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                Allow online booking
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.requiresOnsite}
                onChange={(e) => set("requiresOnsite", e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                Requires onsite visit
              </span>
            </label>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href="/admin/services"
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {submitting ? "Creating…" : "Create Service"}
          </button>
        </div>
      </form>
    </div>
  );
}
