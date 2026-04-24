"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, ImagePlus, X, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="w-full rounded-xl border border-border bg-background-subtle animate-pulse" style={{ minHeight: 240 }} />
    ),
  }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category { id: string; name: string; slug: string }
interface Brand    { id: string; name: string; slug: string }

interface UploadedImage {
  url: string;
  isPrimary: boolean;
  uploading?: boolean;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: string;
  comparePrice: string;
  costPrice: string;
  sku: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "OUT_OF_STOCK";
  isFeatured: boolean;
  categoryId: string;
  brandId: string;
  initialStock: string;
  lowStockThreshold: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(v: string) {
  return v.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring transition";

// ---------------------------------------------------------------------------
// Image Uploader sub-component
// ---------------------------------------------------------------------------

function ImageUploader({
  images,
  onAdd,
  onRemove,
  onSetPrimary,
}: {
  images: UploadedImage[];
  onAdd: (file: File) => Promise<void>;
  onRemove: (url: string) => void;
  onSetPrimary: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: exceeds 5 MB limit`);
        continue;
      }
      await onAdd(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          await handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-background-subtle"
        )}
      >
        <ImagePlus size={24} className="text-foreground-muted" />
        <p className="text-sm text-foreground-muted">
          Drop images here or <span className="text-primary font-medium">click to browse</span>
        </p>
        <p className="text-xs text-foreground-subtle">JPEG, PNG, WebP, GIF — max 5 MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-background-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt="Product"
                className="w-full h-full object-cover"
              />

              {/* Uploading overlay */}
              {img.uploading && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-primary" />
                </div>
              )}

              {/* Primary badge */}
              {img.isPrimary && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={8} fill="currentColor" />
                  Main
                </div>
              )}

              {/* Actions (hover) */}
              {!img.uploading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSetPrimary(img.url); }}
                      title="Set as main image"
                      className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white transition"
                    >
                      <Star size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(img.url); }}
                    title="Remove image"
                    className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: "", slug: "", description: "", shortDescription: "",
    basePrice: "", comparePrice: "", costPrice: "", sku: "",
    status: "DRAFT", isFeatured: false,
    categoryId: "", brandId: "",
    initialStock: "0", lowStockThreshold: "5",
  });

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands]         = useState<Brand[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch reference data
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : {})
      .then((d: { categories?: Category[] }) => setCategories(d.categories ?? []))
      .catch(() => {});

    fetch("/api/admin/brands")
      .then((r) => r.ok ? r.json() : {})
      .then((d: { brands?: Brand[] }) => setBrands(d.brands ?? []))
      .catch(() => {});
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev, name: value,
      slug: prev.slug === toSlug(prev.name) || prev.slug === "" ? toSlug(value) : prev.slug,
    }));
    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
  }, [errors.name]);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // ── Image handlers ──────────────────────────────────────────────────────

  const handleImageAdd = useCallback(async (file: File) => {
    // Optimistic: show local preview while uploading
    const localUrl = URL.createObjectURL(file);
    const isFirst  = images.length === 0;
    setImages((prev) => [...prev, { url: localUrl, isPrimary: isFirst, uploading: true }]);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Upload failed");
      }
      const { url } = await res.json() as { url: string };

      // Replace the blob URL with the real server URL
      setImages((prev) =>
        prev.map((img) =>
          img.url === localUrl ? { ...img, url, uploading: false } : img
        )
      );
      URL.revokeObjectURL(localUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
      setImages((prev) => prev.filter((img) => img.url !== localUrl));
      URL.revokeObjectURL(localUrl);
    }
  }, [images.length]);

  const handleImageRemove = useCallback((url: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.url !== url);
      // Ensure a primary exists if we removed the primary
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  }, []);

  const handleSetPrimary = useCallback((url: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.url === url })));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())   next.name = "Product name is required";
    if (!form.slug.trim())   next.slug = "Slug is required";
    if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) <= 0)
      next.basePrice = "A valid price is required";
    if (form.comparePrice && (isNaN(Number(form.comparePrice)) || Number(form.comparePrice) <= 0))
      next.comparePrice = "Must be a positive number";
    if (form.costPrice && (isNaN(Number(form.costPrice)) || Number(form.costPrice) <= 0))
      next.costPrice = "Must be a positive number";
    if (isNaN(Number(form.initialStock)) || Number(form.initialStock) < 0)
      next.initialStock = "Must be 0 or more";
    if (isNaN(Number(form.lowStockThreshold)) || Number(form.lowStockThreshold) < 0)
      next.lowStockThreshold = "Must be 0 or more";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the errors before submitting"); return; }
    if (images.some((img) => img.uploading)) { toast.error("Please wait for all images to finish uploading"); return; }

    setSubmitting(true);
    try {
      // 1) Create the product
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description:      form.description.trim()      || undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        basePrice: Number(form.basePrice),
        comparePrice: form.comparePrice  ? Number(form.comparePrice) : null,
        costPrice:    form.costPrice     ? Number(form.costPrice)    : null,
        sku:          form.sku.trim()    || undefined,
        status: form.status,
        isFeatured: form.isFeatured,
        categoryId: form.categoryId || null,
        brandId:    form.brandId    || null,
        initialStock:      parseInt(form.initialStock, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
      };

      const createRes = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const d = await createRes.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? "Failed to create product");
      }
      const { product } = await createRes.json() as { product: { id: string } };

      // 2) Attach images (if any)
      if (images.length > 0) {
        await Promise.all(
          images.map((img) =>
            fetch(`/api/admin/products/${product.id}/images`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: img.url, isPrimary: img.isPrimary }),
            })
          )
        );
      }

      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors">
          <ArrowLeft size={15} /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Product</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Create a new product in your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">

        {/* ── Images ── */}
        <section className="card-premium rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Product Images</h2>
          <p className="text-xs text-foreground-muted -mt-2">
            Upload up to 10 images. The <span className="font-medium text-primary">★ Main</span> image is shown as the product thumbnail.
          </p>
          <ImageUploader
            images={images}
            onAdd={handleImageAdd}
            onRemove={handleImageRemove}
            onSetPrimary={handleSetPrimary}
          />
        </section>

        {/* ── Basic Info ── */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Basic Information</h2>

          <Field label="Product Name" required hint="This will appear as the product title.">
            <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Wireless Pro Headphones"
              className={cn(inputCls, errors.name && "border-destructive")} />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </Field>

          <Field label="Slug" required hint="Used in the product URL. Auto-generated from name.">
            <input type="text" value={form.slug} onChange={(e) => set("slug", toSlug(e.target.value))}
              placeholder="wireless-pro-headphones"
              className={cn(inputCls, errors.slug && "border-destructive")} />
            {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug}</p>}
          </Field>

          <Field label="Short Description" hint="Shown on product cards and search results.">
            <input type="text" value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One-line summary" className={inputCls} maxLength={160} />
          </Field>

          <Field label="Description" hint="Full product description. Upload images by clicking the image icon, pasting, or dragging.">
            <RichTextEditor
              value={form.description}
              onChange={(html) => set("description", html)}
              placeholder="Detailed product description…"
              minHeight={240}
            />
          </Field>
        </section>

        {/* ── Pricing ── */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Price" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                <input type="number" min={0} step="0.01" value={form.basePrice}
                  onChange={(e) => set("basePrice", e.target.value)} placeholder="0.00"
                  className={cn(inputCls, "pl-7", errors.basePrice && "border-destructive")} />
              </div>
              {errors.basePrice && <p className="text-xs text-destructive mt-1">{errors.basePrice}</p>}
            </Field>

            <Field label="Compare Price" hint="Original / crossed-out price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                <input type="number" min={0} step="0.01" value={form.comparePrice}
                  onChange={(e) => set("comparePrice", e.target.value)} placeholder="0.00"
                  className={cn(inputCls, "pl-7", errors.comparePrice && "border-destructive")} />
              </div>
              {errors.comparePrice && <p className="text-xs text-destructive mt-1">{errors.comparePrice}</p>}
            </Field>

            <Field label="Cost Price" hint="Your cost (not shown to customers)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted text-sm">$</span>
                <input type="number" min={0} step="0.01" value={form.costPrice}
                  onChange={(e) => set("costPrice", e.target.value)} placeholder="0.00"
                  className={cn(inputCls, "pl-7", errors.costPrice && "border-destructive")} />
              </div>
              {errors.costPrice && <p className="text-xs text-destructive mt-1">{errors.costPrice}</p>}
            </Field>
          </div>
        </section>

        {/* ── Organization ── */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Organization</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputCls}>
                <option value="">— No category —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <select value={form.brandId} onChange={(e) => set("brandId", e.target.value)} className={inputCls}>
                <option value="">— No brand —</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SKU" hint="Stock Keeping Unit — must be unique">
              <input type="text" value={form.sku} onChange={(e) => set("sku", e.target.value)}
                placeholder="e.g. WPH-001-BLK" className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value as FormData["status"])} className={inputCls}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </Field>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              Feature this product on the homepage
            </span>
          </label>
        </section>

        {/* ── Inventory ── */}
        <section className="card-premium rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">Inventory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Initial Stock" required hint="Starting quantity available for sale">
              <input type="number" min={0} step={1} value={form.initialStock}
                onChange={(e) => set("initialStock", e.target.value)}
                className={cn(inputCls, errors.initialStock && "border-destructive")} />
              {errors.initialStock && <p className="text-xs text-destructive mt-1">{errors.initialStock}</p>}
            </Field>
            <Field label="Low Stock Threshold" required hint="Warn when stock falls to or below this level">
              <input type="number" min={0} step={1} value={form.lowStockThreshold}
                onChange={(e) => set("lowStockThreshold", e.target.value)}
                className={cn(inputCls, errors.lowStockThreshold && "border-destructive")} />
              {errors.lowStockThreshold && <p className="text-xs text-destructive mt-1">{errors.lowStockThreshold}</p>}
            </Field>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/admin/products"
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {submitting ? "Creating…" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
