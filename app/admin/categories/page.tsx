"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  _count: { products: number };
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  isActive: true,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.ok ? r.json() : ({} as any))
      .then((d) => {
        setCategories(d.categories ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };
      // Auto-generate slug from name when not editing an existing category
      if (name === "name" && !editingId) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image: cat.image ?? "",
      isActive: cat.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = editingId !== null;
      const res = await fetch("/api/admin/categories", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...form } : form),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Category updated" : "Category created");
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchCategories();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success(`Category ${cat.isActive ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage product categories
          </p>
        </div>
        <button
          onClick={showForm ? () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); } : openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-background rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            {editingId ? "Edit Category" : "New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className={cn(inputClass, "resize-none")}
              />
            </div>

            <ImageUpload
              label="Category Image"
              value={form.image}
              onChange={(url) => setForm((p) => ({ ...p, image: url }))}
              folder="nexcart/categories"
              aspect="landscape"
              hint="Banner image shown on the category page"
            />

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground">Active (visible to customers)</span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
                className="px-6 py-2.5 rounded-lg border border-border text-foreground-muted text-sm font-medium hover:bg-background-subtle transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array(4).fill(null).map((_, i) => (
              <div key={i} className="h-12 bg-background-subtle rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-foreground-muted">
            <Tag size={44} className="opacity-25" />
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">No categories</p>
              <p className="text-sm mt-1">Add your first category to get started</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-subtle">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Slug
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Products
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Active
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-b border-border last:border-0 hover:bg-background-subtle/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cat.image && (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-8 h-8 rounded-lg object-cover border border-border"
                          />
                        )}
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-foreground-muted font-mono text-xs">
                      {cat.slug}
                    </td>
                    <td className="px-5 py-3.5 text-foreground-muted">
                      {cat._count.products}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={cn(
                          "transition-colors",
                          cat.isActive ? "text-emerald-500" : "text-foreground-muted"
                        )}
                        title={cat.isActive ? "Deactivate" : "Activate"}
                      >
                        {cat.isActive ? (
                          <ToggleRight size={22} />
                        ) : (
                          <ToggleLeft size={22} />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
