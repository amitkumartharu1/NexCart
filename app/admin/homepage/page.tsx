"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, LayoutDashboard, User, Target, Users, Building2,
  Eye, EyeOff, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Settings type ────────────────────────────────────────────────────────────
interface HomepageSettings {
  section_founder_enabled:   string;
  founder_name:              string;
  founder_role:              string;
  founder_bio:               string;
  founder_vision:            string;
  founder_image:             string;
  section_motive_enabled:    string;
  motive_title:              string;
  motive_description:        string;
  motive_points:             string; // JSON array
  section_team_enabled:      string;
  section_suppliers_enabled: string;
}

const DEFAULTS: HomepageSettings = {
  section_founder_enabled:   "true",
  founder_name:              "",
  founder_role:              "Founder & CEO",
  founder_bio:               "",
  founder_vision:            "",
  founder_image:             "",
  section_motive_enabled:    "true",
  motive_title:              "Why NexCart?",
  motive_description:        "",
  motive_points:             "[]",
  section_team_enabled:      "true",
  section_suppliers_enabled: "true",
};

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

function SectionToggle({
  label, desc, icon: Icon, enabled, onToggle,
}: {
  label: string; desc: string; icon: React.FC<{ size?: number; className?: string }>;
  enabled: boolean; onToggle: () => void;
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${enabled ? "bg-primary/5 border-primary/20" : "bg-background-subtle border-border"}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${enabled ? "bg-primary/10" : "bg-background-subtle border border-border"}`}>
          <Icon size={16} className={enabled ? "text-primary" : "text-foreground-muted"} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-foreground-muted">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          enabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-foreground-muted"
        }`}
      >
        {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
        {enabled ? "On" : "Off"}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminHomepagePage() {
  const router = useRouter();
  const [s,       setS]       = useState<HomepageSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [points,  setPoints]  = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const merged = { ...DEFAULTS };
        for (const key of Object.keys(DEFAULTS) as (keyof HomepageSettings)[]) {
          if (data.settings[key] != null) merged[key] = data.settings[key] as string;
        }
        setS(merged);
        try { setPoints(JSON.parse(merged.motive_points) as string[]); } catch { setPoints([]); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(k: keyof HomepageSettings, v: string) { setS((p) => ({ ...p, [k]: v })); }
  function toggle(k: keyof HomepageSettings) { setS((p) => ({ ...p, [k]: p[k] === "true" ? "false" : "true" })); }

  function addPoint() { setPoints((p) => [...p, ""]); }
  function updatePoint(i: number, v: string) { setPoints((p) => p.map((x, idx) => idx === i ? v : x)); }
  function removePoint(i: number) { setPoints((p) => p.filter((_, idx) => idx !== i)); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Sync motive_points from local state
    const payload: HomepageSettings = { ...s, motive_points: JSON.stringify(points.filter((p) => p.trim())) };
    try {
      const settings = Object.entries(payload).map(([key, value]) => ({
        key, value, group: "homepage", label: key.replace(/_/g, " "),
      }));
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error();
      toast.success("Homepage settings saved");
      router.refresh();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Homepage Content</h1>
        <p className="text-sm text-foreground-muted mt-1">Control what sections appear on your homepage and manage their content</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">

        {/* ── Section Visibility ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <LayoutDashboard size={16} className="text-primary" />
            <h2 className="font-semibold text-foreground">Section Visibility</h2>
          </div>
          <p className="text-xs text-foreground-muted -mt-1">Toggle each homepage section on or off. Changes take effect after saving.</p>
          <SectionToggle label="Founder Spotlight" desc="Show founder/CEO highlight with vision" icon={User}
            enabled={s.section_founder_enabled === "true"} onToggle={() => toggle("section_founder_enabled")} />
          <SectionToggle label="Website Motive" desc="Show mission & purpose section" icon={Target}
            enabled={s.section_motive_enabled === "true"} onToggle={() => toggle("section_motive_enabled")} />
          <SectionToggle label="Our Team" desc="Show team members grid" icon={Users}
            enabled={s.section_team_enabled === "true"} onToggle={() => toggle("section_team_enabled")} />
          <SectionToggle label="Suppliers & Partners" desc="Show partner/supplier logo carousel" icon={Building2}
            enabled={s.section_suppliers_enabled === "true"} onToggle={() => toggle("section_suppliers_enabled")} />
        </section>

        {/* ── Founder Section ── */}
        {s.section_founder_enabled === "true" && (
          <section className="bg-background rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Founder Spotlight</h2>
            </div>
            <p className="text-xs text-foreground-muted -mt-1">Featured at the top of the homepage with fade-in animation</p>

            {/* Preview */}
            {(s.founder_name || s.founder_image) && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                {s.founder_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.founder_image} alt={s.founder_name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                    {s.founder_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{s.founder_name || "Founder Name"}</p>
                  <p className="text-sm text-foreground-muted">{s.founder_role || "Founder & CEO"}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name">
                <input value={s.founder_name} onChange={(e) => set("founder_name", e.target.value)}
                  placeholder="e.g. Amit Kumar Tharu" className={inputCls} />
              </Field>
              <Field label="Title / Role">
                <input value={s.founder_role} onChange={(e) => set("founder_role", e.target.value)}
                  placeholder="Founder & CEO" className={inputCls} />
              </Field>
            </div>
            <Field label="Photo URL" hint="Use a professional headshot. Square or portrait works best.">
              <input value={s.founder_image} onChange={(e) => set("founder_image", e.target.value)}
                placeholder="https://example.com/photo.jpg" className={inputCls} />
            </Field>
            <Field label="Short Bio" hint="Shown below the name on the homepage card">
              <textarea value={s.founder_bio} onChange={(e) => set("founder_bio", e.target.value)}
                rows={3} placeholder="Brief background and passion…" className={inputCls + " resize-none"} />
            </Field>
            <Field label="Vision Statement" hint="Highlighted quote — the big idea behind NexCart">
              <textarea value={s.founder_vision} onChange={(e) => set("founder_vision", e.target.value)}
                rows={3} placeholder={`"My vision is to make online shopping accessible to every Nepali home…"`}
                className={inputCls + " resize-none"} />
            </Field>
          </section>
        )}

        {/* ── Motive Section ── */}
        {s.section_motive_enabled === "true" && (
          <section className="bg-background rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-primary" />
              <h2 className="font-semibold text-foreground">Website Motive</h2>
            </div>
            <p className="text-xs text-foreground-muted -mt-1">Explain the purpose and mission of NexCart with animated bullet points</p>
            <Field label="Section Title">
              <input value={s.motive_title} onChange={(e) => set("motive_title", e.target.value)}
                placeholder="Why NexCart?" className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea value={s.motive_description} onChange={(e) => set("motive_description", e.target.value)}
                rows={4} placeholder="Describe NexCart's mission and future goals…"
                className={inputCls + " resize-none"} />
            </Field>

            {/* Bullet points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Key Points (bullet list)</label>
                <button type="button" onClick={addPoint}
                  className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Plus size={12} /> Add Point
                </button>
              </div>
              {points.length === 0 && (
                <p className="text-xs text-foreground-muted italic">No points yet. Click "Add Point" to add bullet points.</p>
              )}
              <div className="space-y-2">
                {points.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-foreground-muted text-xs w-5 text-right">{i + 1}.</span>
                    <input value={pt} onChange={(e) => updatePoint(i, e.target.value)}
                      placeholder={`e.g. Quality products at the best price`}
                      className={inputCls + " flex-1"} />
                    <button type="button" onClick={() => removePoint(i)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Team & Suppliers link ── */}
        <section className="bg-background rounded-xl border border-border p-6 space-y-3">
          <h2 className="font-semibold text-foreground mb-1">Manage Members &amp; Suppliers</h2>
          <p className="text-xs text-foreground-muted">Actual team member and supplier data is managed in their dedicated pages.</p>
          <div className="flex gap-3 flex-wrap">
            <a href="/admin/team"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-border bg-background-subtle hover:bg-muted transition-colors">
              <Users size={14} className="text-primary" /> Manage Team →
            </a>
            <a href="/admin/suppliers"
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-border bg-background-subtle hover:bg-muted transition-colors">
              <Building2 size={14} className="text-primary" /> Manage Suppliers →
            </a>
          </div>
        </section>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          <Save size={15} />
          {saving ? "Saving…" : "Save Homepage Settings"}
        </button>
      </form>
    </div>
  );
}
