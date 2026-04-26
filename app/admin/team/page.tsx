"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, Pencil, Trash2, Eye, EyeOff,
  Search, RefreshCw, X, Mail, GripVertical, Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image: string | null;
  email: string | null;
  linkedin: string | null;
  twitter: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// Form uses plain strings (no nulls) so inputs/textareas accept the values directly
interface TeamMemberForm {
  name: string; role: string; bio: string; image: string;
  email: string; linkedin: string; twitter: string;
  sortOrder: number; isActive: boolean; isFeatured: boolean;
}

const EMPTY: TeamMemberForm = {
  name: "", role: "", bio: "", image: "",
  email: "", linkedin: "", twitter: "",
  sortOrder: 0, isActive: true, isFeatured: false,
};

const GRADS = [
  "from-blue-600 to-blue-400",
  "from-emerald-600 to-emerald-400",
  "from-purple-600 to-violet-400",
  "from-orange-500 to-amber-400",
  "from-pink-600 to-rose-400",
  "from-teal-600 to-cyan-400",
];
function initials(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function MemberAvatar({ m, size = 48 }: { m: Pick<TeamMember, "name" | "image">; size?: number }) {
  const grad = GRADS[(m.name.charCodeAt(0) ?? 0) % GRADS.length];
  if (m.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.image} alt={m.name}
        className="rounded-xl object-cover flex-shrink-0 border border-border"
        style={{ width: size, height: size }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
    );
  }
  return (
    <div
      className={`rounded-xl flex items-center justify-center text-white font-bold select-none bg-gradient-to-br ${grad} flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {initials(m.name) || "?"}
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────
const inputCls = "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-foreground-muted mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"all" | "active" | "featured">("all");
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [isNew,   setIsNew]   = useState(false);
  const [form,    setForm]    = useState({ ...EMPTY });
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch { toast.error("Failed to load team"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm({ ...EMPTY });
    setEditing(null);
    setIsNew(true);
  }
  function openEdit(m: TeamMember) {
    setForm({
      name: m.name, role: m.role, bio: m.bio ?? "", image: m.image ?? "",
      email: m.email ?? "", linkedin: m.linkedin ?? "", twitter: m.twitter ?? "",
      sortOrder: m.sortOrder, isActive: m.isActive, isFeatured: m.isFeatured,
    });
    setEditing(m);
    setIsNew(false);
  }
  function closePanel() { setEditing(null); setIsNew(false); }
  function set(k: keyof TeamMemberForm, v: string | number | boolean) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and role are required"); return;
    }
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const body   = isNew ? form : { id: editing!.id, ...form };
      const res = await fetch("/api/admin/team", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(isNew ? "Team member added" : "Team member updated");
      closePanel();
      load();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch("/api/admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      load();
    } catch { toast.error("Delete failed"); }
  }

  async function toggleField(id: string, field: "isActive" | "isFeatured", current: boolean) {
    try {
      await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: !current }),
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, [field]: !current } : m))
      );
    } catch { toast.error("Update failed"); }
  }

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase());
    if (filter === "active")   return matchSearch && m.isActive;
    if (filter === "featured") return matchSearch && m.isFeatured;
    return matchSearch;
  });

  const panelOpen = isNew || !!editing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            Manage your team — shown on the homepage team section
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or role…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "featured"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground-muted hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className={cn("flex gap-6", panelOpen && "")}>
        {/* List */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(null).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-background-subtle animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center rounded-xl border border-dashed border-border">
              <Users size={32} className="mx-auto mb-2 text-foreground-subtle opacity-30" />
              <p className="text-sm text-foreground-muted">
                {search ? "No members match your search" : "No team members yet"}
              </p>
              {!search && (
                <button onClick={openNew} className="mt-3 text-xs text-primary hover:underline">
                  Add your first team member →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all",
                    m.isActive ? "bg-background border-border" : "bg-background-subtle border-border opacity-60"
                  )}
                >
                  <GripVertical size={14} className="text-border flex-shrink-0 cursor-grab" />
                  <MemberAvatar m={m} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm truncate">{m.name}</span>
                      {m.isFeatured && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full">
                          <Star size={9} fill="currentColor" /> Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted truncate">{m.role}</p>
                    {m.bio && <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1 opacity-70">{m.bio}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleField(m.id, "isActive", m.isActive)}
                      title={m.isActive ? "Hide" : "Show"}
                      className={cn("p-1.5 rounded-lg border transition-colors text-xs",
                        m.isActive ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50" : "border-border text-foreground-muted hover:bg-muted"
                      )}
                    >
                      {m.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      onClick={() => toggleField(m.id, "isFeatured", m.isFeatured)}
                      title={m.isFeatured ? "Unfeature" : "Feature"}
                      className={cn("p-1.5 rounded-lg border transition-colors",
                        m.isFeatured ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-border text-foreground-muted hover:bg-muted"
                      )}
                    >
                      <Star size={13} fill={m.isFeatured ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => openEdit(m)}
                      className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-primary hover:border-primary/30 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(m.id, m.name)}
                      className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-destructive hover:border-destructive/30 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit / Add Panel */}
        {panelOpen && (
          <div className="w-96 flex-shrink-0 bg-background rounded-xl border border-border p-5 space-y-4 self-start sticky top-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{isNew ? "Add Member" : "Edit Member"}</h3>
              <button onClick={closePanel} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Preview avatar */}
            <div className="flex justify-center">
              <MemberAvatar m={{ name: form.name || "?", image: form.image }} size={72} />
            </div>

            <Field label="Name *">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Amit Kumar" className={inputCls} />
            </Field>
            <Field label="Role *">
              <input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Founder & CEO" className={inputCls} />
            </Field>
            <Field label="Bio" hint="Short description shown on the card">
              <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)}
                placeholder="Brief introduction..." rows={3}
                className={inputCls + " resize-none"} />
            </Field>
            <Field label="Photo URL" hint="Paste image URL or leave empty for initials avatar">
              <input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@..." className={inputCls} />
              </Field>
              <Field label="Sort Order">
                <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)} className={inputCls} />
              </Field>
            </div>
            <Field label="LinkedIn URL">
              <input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." className={inputCls} />
            </Field>
            <Field label="Twitter / X URL">
              <input value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://twitter.com/..." className={inputCls} />
            </Field>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)}
                  className="w-4 h-4 accent-primary rounded" />
                <span className="text-sm text-foreground">Active (visible)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded" />
                <span className="text-sm text-foreground">Featured</span>
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={closePanel}
                className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Saving…" : isNew ? "Add Member" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
