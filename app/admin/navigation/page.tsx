"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  ExternalLink, Eye, EyeOff, RefreshCw, Link2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterLink {
  label: string;
  href: string;
  enabled: boolean;
}

interface FooterGroup {
  group: string;
  links: FooterLink[];
}

// ─── Default footer structure ─────────────────────────────────────────────────

const DEFAULT_FOOTER: FooterGroup[] = [
  {
    group: "Shop",
    links: [
      { label: "All Products",  href: "/shop",                    enabled: true },
      { label: "Electronics",   href: "/categories/electronics",  enabled: true },
      { label: "Gadgets",       href: "/categories/gadgets",      enabled: true },
      { label: "Fashion",       href: "/categories/fashion",      enabled: true },
      { label: "New Arrivals",  href: "/shop?filter=new",         enabled: true },
      { label: "Best Sellers",  href: "/shop?filter=bestseller",  enabled: true },
    ],
  },
  {
    group: "Services",
    links: [
      { label: "All Services",    href: "/services",              enabled: true },
      { label: "Repair",          href: "/services/repair",       enabled: true },
      { label: "Installation",    href: "/services/installation", enabled: true },
      { label: "Consultation",    href: "/services/consultation", enabled: true },
      { label: "Book a Service",  href: "/services#book",         enabled: true },
    ],
  },
  {
    group: "Company",
    links: [
      { label: "About Us",  href: "/about",    enabled: true },
      { label: "Contact",   href: "/contact",  enabled: true },
      { label: "Blog",      href: "/blog",     enabled: true },
      { label: "Careers",   href: "/careers",  enabled: true },
      { label: "Press",     href: "/press",    enabled: true },
    ],
  },
  {
    group: "Support",
    links: [
      { label: "FAQ",              href: "/faq",               enabled: true },
      { label: "Shipping Policy",  href: "/policies/shipping", enabled: true },
      { label: "Return Policy",    href: "/policies/returns",  enabled: true },
      { label: "Privacy Policy",   href: "/policies/privacy",  enabled: true },
      { label: "Terms of Service", href: "/policies/terms",    enabled: true },
    ],
  },
];

// ─── Link row ─────────────────────────────────────────────────────────────────

function LinkRow({
  link,
  idx,
  groupIdx,
  total,
  onChange,
  onMove,
  onDelete,
}: {
  link: FooterLink;
  idx: number;
  groupIdx: number;
  total: number;
  onChange: (field: keyof FooterLink, value: string | boolean) => void;
  onMove: (dir: "up" | "down") => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
      link.enabled ? "border-border bg-background" : "border-border/50 bg-background-subtle opacity-60",
    )}>
      {/* Drag handle (visual only) */}
      <GripVertical size={14} className="text-foreground-subtle flex-shrink-0 cursor-grab" />

      {/* Up / Down */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          onClick={() => onMove("up")}
          disabled={idx === 0}
          className="w-4 h-4 flex items-center justify-center rounded text-foreground-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp size={11} />
        </button>
        <button
          onClick={() => onMove("down")}
          disabled={idx === total - 1}
          className="w-4 h-4 flex items-center justify-center rounded text-foreground-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Label */}
      <input
        value={link.label}
        onChange={(e) => onChange("label", e.target.value)}
        placeholder="Link label"
        className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-transparent focus:border-input focus:bg-background-subtle focus:outline-none transition-colors"
      />

      {/* Href */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Link2 size={12} className="text-foreground-subtle flex-shrink-0" />
        <input
          value={link.href}
          onChange={(e) => onChange("href", e.target.value)}
          placeholder="/path or https://…"
          className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-transparent focus:border-input focus:bg-background-subtle focus:outline-none transition-colors font-mono text-xs"
        />
      </div>

      {/* Toggle enabled */}
      <button
        onClick={() => onChange("enabled", !link.enabled)}
        title={link.enabled ? "Hide from footer" : "Show in footer"}
        className={cn(
          "w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg transition-colors",
          link.enabled
            ? "text-emerald-600 hover:bg-emerald-500/10"
            : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
        )}
      >
        {link.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>

      {/* Preview */}
      {link.href.startsWith("http") && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
        >
          <ExternalLink size={13} />
        </a>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Group card ───────────────────────────────────────────────────────────────

function GroupCard({
  group,
  groupIdx,
  totalGroups,
  onUpdate,
  onDelete,
  onMoveGroup,
}: {
  group: FooterGroup;
  groupIdx: number;
  totalGroups: number;
  onUpdate: (updated: FooterGroup) => void;
  onDelete: () => void;
  onMoveGroup: (dir: "up" | "down") => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const updateLink = (linkIdx: number, field: keyof FooterLink, value: string | boolean) => {
    const links = group.links.map((l, i) =>
      i === linkIdx ? { ...l, [field]: value } : l
    );
    onUpdate({ ...group, links });
  };

  const moveLink = (linkIdx: number, dir: "up" | "down") => {
    const links = [...group.links];
    const swapIdx = dir === "up" ? linkIdx - 1 : linkIdx + 1;
    if (swapIdx < 0 || swapIdx >= links.length) return;
    [links[linkIdx], links[swapIdx]] = [links[swapIdx], links[linkIdx]];
    onUpdate({ ...group, links });
  };

  const deleteLink = (linkIdx: number) => {
    onUpdate({ ...group, links: group.links.filter((_, i) => i !== linkIdx) });
  };

  const addLink = () => {
    onUpdate({
      ...group,
      links: [...group.links, { label: "New Link", href: "/", enabled: true }],
    });
  };

  const enabledCount = group.links.filter((l) => l.enabled).length;

  return (
    <div className="bg-background rounded-xl border border-border overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-background-subtle border-b border-border">
        {/* Move group up/down */}
        <div className="flex flex-col gap-0.5">
          <button onClick={() => onMoveGroup("up")} disabled={groupIdx === 0}
            className="w-5 h-5 flex items-center justify-center rounded text-foreground-muted hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronUp size={13} />
          </button>
          <button onClick={() => onMoveGroup("down")} disabled={groupIdx === totalGroups - 1}
            className="w-5 h-5 flex items-center justify-center rounded text-foreground-muted hover:text-foreground disabled:opacity-20 transition-colors">
            <ChevronDown size={13} />
          </button>
        </div>

        {/* Group name */}
        <input
          value={group.group}
          onChange={(e) => onUpdate({ ...group, group: e.target.value })}
          className="flex-1 text-sm font-semibold text-foreground bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-0.5 transition-colors"
          placeholder="Group name"
        />

        <span className="text-xs text-foreground-muted">
          {enabledCount}/{group.links.length} visible
        </span>

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background transition-colors"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete group"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Links */}
      {!collapsed && (
        <div className="p-4 space-y-2">
          {group.links.length === 0 ? (
            <p className="text-sm text-foreground-muted text-center py-4 italic">
              No links yet — add one below
            </p>
          ) : (
            group.links.map((link, linkIdx) => (
              <LinkRow
                key={linkIdx}
                link={link}
                idx={linkIdx}
                groupIdx={groupIdx}
                total={group.links.length}
                onChange={(field, val) => updateLink(linkIdx, field, val)}
                onMove={(dir) => moveLink(linkIdx, dir)}
                onDelete={() => deleteLink(linkIdx)}
              />
            ))
          )}

          <button
            onClick={addLink}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-sm text-foreground-muted hover:text-primary hover:border-primary transition-colors mt-1"
          >
            <Plus size={13} />
            Add link
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NavigationAdminPage() {
  const [groups, setGroups]     = useState<FooterGroup[]>(DEFAULT_FOOTER);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [dirty,   setDirty]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/settings");
      const data = await res.json().catch(() => ({}));
      const raw  = data?.settings?.footer_links;
      if (raw) {
        const parsed = JSON.parse(raw) as FooterGroup[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
        }
      }
    } catch {/* keep defaults */}
    setLoading(false);
    setDirty(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = (idx: number, updated: FooterGroup) => {
    setGroups((prev) => prev.map((g, i) => (i === idx ? updated : g)));
    setDirty(true);
  };

  const deleteGroup = (idx: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };

  const moveGroup = (idx: number, dir: "up" | "down") => {
    const next = [...groups];
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setGroups(next);
    setDirty(true);
  };

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      { group: "New Group", links: [{ label: "Link", href: "/", enabled: true }] },
    ]);
    setDirty(true);
  };

  const resetToDefaults = () => {
    setGroups(DEFAULT_FOOTER);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          {
            key:   "footer_links",
            value: JSON.stringify(groups),
            label: "Footer navigation links",
            group: "navigation",
          },
        ],
      }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Footer links saved — changes are live"); setDirty(false); }
    else toast.error("Failed to save");
  };

  const totalVisible = groups.reduce(
    (acc, g) => acc + g.links.filter((l) => l.enabled).length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Navigation</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Manage footer navigation links — changes appear on the live site immediately after saving
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
          >
            <RefreshCw size={13} />
            Reset to defaults
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              : <Save size={14} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Groups",   value: groups.length },
          { label: "Total Links",   value: groups.reduce((a, g) => a + g.links.length, 0) },
          { label: "Visible",  value: totalVisible },
        ].map((s) => (
          <div key={s.label} className="bg-background rounded-xl border border-border px-5 py-4">
            <p className="text-xs text-foreground-muted font-medium uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Unsaved warning */}
      {dirty && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-700 dark:text-yellow-400">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0 animate-pulse" />
          You have unsaved changes — click &quot;Save Changes&quot; to apply them to the live site
        </div>
      )}

      {/* Groups */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-background-subtle animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, idx) => (
            <GroupCard
              key={idx}
              group={group}
              groupIdx={idx}
              totalGroups={groups.length}
              onUpdate={(updated) => update(idx, updated)}
              onDelete={() => deleteGroup(idx)}
              onMoveGroup={(dir) => moveGroup(idx, dir)}
            />
          ))}

          {/* Add group */}
          <button
            onClick={addGroup}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border text-sm text-foreground-muted hover:text-primary hover:border-primary transition-colors"
          >
            <Plus size={15} />
            Add new group
          </button>
        </div>
      )}

      {/* Footer preview */}
      {!loading && (
        <div className="rounded-xl border border-border bg-background-subtle p-6">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-5">
            Footer Preview
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {groups.map((group) => {
              const visibleLinks = group.links.filter((l) => l.enabled);
              return (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                    {group.group}
                  </p>
                  <ul className="space-y-2">
                    {visibleLinks.map((link, i) => (
                      <li key={i} className="text-sm text-foreground-muted">
                        {link.label}
                      </li>
                    ))}
                    {visibleLinks.length === 0 && (
                      <li className="text-xs text-foreground-subtle italic">(no visible links)</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
