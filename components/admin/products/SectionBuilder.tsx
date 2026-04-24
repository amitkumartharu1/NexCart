"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Image as ImageIcon, Box, Zap, Type, List, Megaphone,
  Loader2, Settings2, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductSection {
  id: string;
  type: string;
  mode: string;
  sortOrder: number;
  isVisible: boolean;
  title: string;
  subtitle: string;
  body: string;
  assetUrl: string;
  assetType: string;
  ctaText: string;
  ctaUrl: string;
  ctaStyle: string;
  settings: Record<string, unknown> | null;
}

type SectionType = "image_banner" | "3d_showcase" | "motion_banner" | "text_block" | "feature_list" | "cta_section";
type SectionMode = "static" | "3d" | "4d";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type LucideIcon = React.FC<{ size?: number; className?: string }>;

const SECTION_TYPES: { value: SectionType; label: string; icon: LucideIcon; desc: string }[] = [
  { value: "image_banner",  label: "Image Banner",       icon: ImageIcon,  desc: "Full-width image with text overlay" },
  { value: "3d_showcase",   label: "3D Product Showcase", icon: Box,        desc: "Interactive Three.js 3D model viewer" },
  { value: "motion_banner", label: "Motion Banner",       icon: Zap,        desc: "Scroll-driven 4D parallax animation" },
  { value: "text_block",    label: "Text Block",          icon: Type,       desc: "Rich text content section" },
  { value: "feature_list",  label: "Feature List",        icon: List,       desc: "Icon grid with animated reveals" },
  { value: "cta_section",   label: "CTA Section",         icon: Megaphone,  desc: "Conversion-focused CTA with price display" },
];

const MODE_OPTIONS: { value: SectionMode; label: string; desc: string; color: string }[] = [
  { value: "static", label: "Static",   desc: "Standard render, no animation",           color: "#6b7280" },
  { value: "3d",     label: "3D Mode",  desc: "Mouse tilt, parallax, glow effects",      color: "#6366f1" },
  { value: "4d",     label: "4D Mode",  desc: "Scroll animation, particles, cinematic",  color: "#ec4899" },
];

function emptySectionDraft(type: SectionType): Omit<ProductSection, "id" | "sortOrder"> {
  return {
    type,
    mode: type === "3d_showcase" ? "3d" : type === "motion_banner" ? "4d" : "static",
    isVisible: true,
    title: "",
    subtitle: "",
    body: "",
    assetUrl: "",
    assetType: type === "3d_showcase" ? "model3d" : "image",
    ctaText: "",
    ctaUrl: "",
    ctaStyle: "primary",
    settings: null,
  };
}

// ---------------------------------------------------------------------------
// Section Editor (inline form)
// ---------------------------------------------------------------------------

function SectionEditor({
  section,
  onSave,
  onCancel,
  saving,
}: {
  section: Omit<ProductSection, "id" | "sortOrder">;
  onSave: (data: Omit<ProductSection, "id" | "sortOrder">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(section);

  function set(key: keyof typeof form, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const typeInfo = SECTION_TYPES.find((t) => t.value === form.type);

  return (
    <div className="space-y-6 p-6 bg-background border border-border rounded-2xl">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        {typeInfo && (() => { const TypeIcon = typeInfo.icon; return <TypeIcon size={18} className="text-primary" />; })()}
        <h4 className="font-bold text-foreground">
          Edit {typeInfo?.label ?? "Section"}
        </h4>
      </div>

      {/* Mode selector */}
      <div>
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2 block">
          Rendering Mode
        </label>
        <div className="flex gap-2 flex-wrap">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => set("mode", m.value)}
              className={cn(
                "flex-1 min-w-[100px] px-4 py-2.5 rounded-xl border text-xs font-bold transition-all",
                form.mode === m.value
                  ? "border-transparent text-white"
                  : "border-border text-foreground-muted hover:border-primary/50"
              )}
              style={form.mode === m.value ? { background: m.color } : undefined}
            >
              {m.label}
              <span className="block font-normal opacity-70 mt-0.5">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content fields */}
      <div className="grid grid-cols-1 gap-4">
        <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
        <Field label="Subtitle / Badge text" value={form.subtitle} onChange={(v) => set("subtitle", v)} />
        {(form.type === "text_block" || form.type === "cta_section") && (
          <Field label="Body text" value={form.body} onChange={(v) => set("body", v)} textarea />
        )}
      </div>

      {/* Asset */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide block">
          Asset URL
        </label>
        <div className="flex gap-2">
          {(form.type === "3d_showcase"
            ? [{ value: "model3d", label: "3D Model (.glb/.gltf)" }, { value: "image", label: "Image (fallback)" }]
            : form.type === "motion_banner" || form.type === "image_banner"
              ? [{ value: "image", label: "Image" }, { value: "video", label: "Video (.mp4/.webm)" }]
              : []
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set("assetType", opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                form.assetType === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-foreground-muted hover:border-primary/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="url"
          placeholder={
            form.assetType === "model3d"
              ? "https://...model.glb"
              : form.assetType === "video"
                ? "https://...video.mp4"
                : "https://...image.jpg"
          }
          value={form.assetUrl}
          onChange={(e) => set("assetUrl", e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {form.assetUrl && form.assetType === "image" && (
          <img src={form.assetUrl} alt="preview" className="w-full max-h-40 object-cover rounded-xl border border-border" />
        )}
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide block">
          Call to Action
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button Text" value={form.ctaText} onChange={(v) => set("ctaText", v)} />
          <Field label="Button URL" value={form.ctaUrl} onChange={(v) => set("ctaUrl", v)} />
        </div>
        <div className="flex gap-2">
          {(["primary", "secondary", "ghost"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set("ctaStyle", s)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-all",
                form.ctaStyle === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-foreground-muted hover:border-primary/50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Feature items (for feature_list) */}
      {form.type === "feature_list" && (
        <FeatureItemsEditor
          items={(form.settings as any)?.features ?? []}
          onChange={(features) => set("settings", { ...(form.settings ?? {}), features })}
        />
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Section
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  const cls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
  return (
    <div>
      <label className="text-xs font-medium text-foreground-muted mb-1 block">{label}</label>
      {textarea ? (
        <textarea rows={3} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function FeatureItemsEditor({
  items,
  onChange,
}: {
  items: { icon: string; title: string; description: string }[];
  onChange: (items: { icon: string; title: string; description: string }[]) => void;
}) {
  const list = items.length > 0 ? items : [{ icon: "⚡", title: "", description: "" }];

  function update(i: number, key: string, val: string) {
    const next = list.map((item, idx) => idx === i ? { ...item, [key]: val } : item);
    onChange(next);
  }

  return (
    <div>
      <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-3 block">
        Feature Items
      </label>
      <div className="space-y-3">
        {list.map((item, i) => (
          <div key={i} className="grid grid-cols-[40px_1fr_1fr_32px] gap-2 items-start">
            <input
              type="text"
              placeholder="🔥"
              value={item.icon}
              onChange={(e) => update(i, "icon", e.target.value)}
              className="px-2 py-2 rounded-xl border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              placeholder="Feature title"
              value={item.title}
              onChange={(e) => update(i, "title", e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              placeholder="Short description"
              value={item.description}
              onChange={(e) => update(i, "description", e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => onChange(list.filter((_, idx) => idx !== i))}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-destructive hover:border-destructive transition-colors mt-0.5"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...list, { icon: "⭐", title: "", description: "" }])}
          className="w-full py-2 rounded-xl border border-dashed border-border text-xs text-foreground-muted hover:border-primary hover:text-primary transition-colors"
        >
          + Add Feature
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Card (collapsed row)
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, LucideIcon> = {
  image_banner: ImageIcon,
  "3d_showcase": Box,
  motion_banner: Zap,
  text_block: Type,
  feature_list: List,
  cta_section: Megaphone,
};

const MODE_COLORS: Record<string, string> = {
  static: "#6b7280",
  "3d": "#6366f1",
  "4d": "#ec4899",
};

function SectionCard({
  section,
  index,
  total,
  onEdit,
  onDelete,
  onMove,
  onToggleVisible,
}: {
  section: ProductSection;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
  onToggleVisible: () => void;
}) {
  const SectionIcon: LucideIcon = TYPE_ICONS[section.type] ?? Box;
  const typeLabel = SECTION_TYPES.find((t) => t.value === section.type)?.label ?? section.type;

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-2xl border transition-all",
      section.isVisible ? "border-border bg-background" : "border-border/50 bg-background-subtle opacity-60"
    )}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--background-subtle, #f3f4f6)" }}>
        <SectionIcon size={16} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate">{section.title || typeLabel}</span>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase"
            style={{ background: MODE_COLORS[section.mode] ?? "#6b7280" }}
          >
            {section.mode}
          </span>
        </div>
        <p className="text-xs text-foreground-muted mt-0.5">{typeLabel}</p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Move up/down */}
        <button
          type="button"
          onClick={() => onMove("up")}
          disabled={index === 0}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronUp size={13} />
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          disabled={index === total - 1}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ChevronDown size={13} />
        </button>
        {/* Toggle visible */}
        <button
          type="button"
          onClick={onToggleVisible}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
          title={section.isVisible ? "Hide" : "Show"}
        >
          {section.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        {/* Edit */}
        <button
          type="button"
          onClick={onEdit}
          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground-muted hover:text-primary transition-colors"
        >
          <Settings2 size={13} />
        </button>
        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 rounded-lg border border-destructive/30 flex items-center justify-center text-destructive/60 hover:text-destructive hover:border-destructive transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SectionBuilder component
// ---------------------------------------------------------------------------

interface Props {
  productId: string;
}

export function SectionBuilder({ productId }: Props) {
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [newType, setNewType] = useState<SectionType | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/sections`);
      if (res.ok) {
        const d = await res.json();
        setSections(d.sections ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  // Create new section
  async function handleCreate(data: Omit<ProductSection, "id" | "sortOrder">) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "Failed to create section");
        return;
      }
      toast.success("Section created");
      setEditingId(null);
      setNewType(null);
      await fetchSections();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create section";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // Update existing section
  async function handleUpdate(id: string, data: Omit<ProductSection, "id" | "sortOrder">) {
    setSaving(true);
    try {
      const section = sections.find((s) => s.id === id);
      const res = await fetch(`/api/admin/products/${productId}/sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sortOrder: section?.sortOrder ?? 0 }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error((d as { error?: string }).error ?? "Failed to save section");
        return;
      }
      toast.success("Section saved");
      setEditingId(null);
      await fetchSections();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save section";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // Delete
  async function handleDelete(id: string) {
    if (!confirm("Delete this section?")) return;
    try {
      await fetch(`/api/admin/products/${productId}/sections/${id}`, { method: "DELETE" });
      toast.success("Section deleted");
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  }

  // Move up/down
  async function handleMove(index: number, dir: "up" | "down") {
    const next = [...sections];
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setSections(next);
    await fetch(`/api/admin/products/${productId}/sections/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
    });
  }

  // Toggle visible
  async function handleToggleVisible(section: ProductSection) {
    const next = !section.isVisible;
    setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, isVisible: next } : s));
    await fetch(`/api/admin/products/${productId}/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...section, isVisible: next }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-foreground-muted text-sm py-8">
        <Loader2 size={16} className="animate-spin" />
        Loading sections…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground text-sm">Visual Story Sections</h3>
          <p className="text-xs text-foreground-muted mt-0.5">
            Add 3D showcases, motion banners, and CTA blocks below the product info.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingId("new"); setNewType(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={13} />
          Add Section
        </button>
      </div>

      {/* Section list */}
      {sections.length === 0 && editingId !== "new" && (
        <div className="py-10 text-center border border-dashed border-border rounded-2xl text-foreground-muted text-sm">
          No sections yet. Click <strong>Add Section</strong> to start building your product story.
        </div>
      )}

      {sections.map((section, index) => (
        <div key={section.id}>
          {editingId === section.id ? (
            <SectionEditor
              section={{
                type: section.type,
                mode: section.mode,
                isVisible: section.isVisible,
                title: section.title ?? "",
                subtitle: section.subtitle ?? "",
                body: section.body ?? "",
                assetUrl: section.assetUrl ?? "",
                assetType: section.assetType ?? "image",
                ctaText: section.ctaText ?? "",
                ctaUrl: section.ctaUrl ?? "",
                ctaStyle: section.ctaStyle ?? "primary",
                settings: section.settings,
              }}
              onSave={(data) => handleUpdate(section.id, data)}
              onCancel={() => setEditingId(null)}
              saving={saving}
            />
          ) : (
            <SectionCard
              section={section}
              index={index}
              total={sections.length}
              onEdit={() => setEditingId(section.id)}
              onDelete={() => handleDelete(section.id)}
              onMove={(dir) => handleMove(index, dir)}
              onToggleVisible={() => handleToggleVisible(section)}
            />
          )}
        </div>
      ))}

      {/* New section flow */}
      {editingId === "new" && (
        <div className="space-y-4">
          {!newType ? (
            <div className="p-5 rounded-2xl border border-border bg-background">
              <p className="text-sm font-semibold text-foreground mb-4">Choose section type:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SECTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setNewType(t.value)}
                    className="flex flex-col gap-2 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    {(() => { const TIcon = t.icon; return <TIcon size={20} className="text-primary" />; })()}
                    <span className="text-sm font-semibold text-foreground">{t.label}</span>
                    <span className="text-xs text-foreground-muted">{t.desc}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="mt-3 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <SectionEditor
              section={emptySectionDraft(newType)}
              onSave={handleCreate}
              onCancel={() => { setEditingId(null); setNewType(null); }}
              saving={saving}
            />
          )}
        </div>
      )}
    </div>
  );
}
