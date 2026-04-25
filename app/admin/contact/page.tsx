"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Mail, Phone, MapPin, Clock, Save, Inbox, Settings2,
  Trash2, Eye, EyeOff, Check, Search, X, RefreshCw,
  MessageSquare, ChevronDown, ChevronUp, Globe, Reply,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isReplied: boolean;
  adminNote: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface ContactSettings {
  contact_email: string;
  contact_email_sub: string;
  contact_phone: string;
  contact_phone_sub: string;
  contact_address: string;
  contact_address_sub: string;
  contact_hours: string;
  contact_hours_sub: string;
  contact_map_url: string;
}

const DEFAULT_SETTINGS: ContactSettings = {
  contact_email:       "support@nexcart.com",
  contact_email_sub:   "We reply within 24 hours",
  contact_phone:       "+977-9800000000",
  contact_phone_sub:   "Mon-Sat, 9am-6pm NPT",
  contact_address:     "Kathmandu, Nepal",
  contact_address_sub: "Visit our showroom",
  contact_hours:       "Mon-Sat: 9am - 6pm",
  contact_hours_sub:   "Closed on Sundays",
  contact_map_url:     "",
};

const MSG_FILTERS = [
  { label: "All",     value: "" },
  { label: "Unread",  value: "unread" },
  { label: "Read",    value: "read" },
  { label: "Replied", value: "replied" },
];

// ─── Note drawer ──────────────────────────────────────────────────────────────

function NoteDrawer({
  msg,
  onClose,
  onSaved,
}: {
  msg: ContactMessage;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(msg.adminNote ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/contact/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msg.id, adminNote: note, isRead: true }),
    });
    setSaving(false);
    if (res.ok) { toast.success("Note saved"); onSaved(); onClose(); }
    else toast.error("Failed to save note");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl border border-border shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Admin Note</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Message from <strong className="text-foreground">{msg.name}</strong> — {msg.subject}
            </p>
          </div>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground">
            <X size={15} />
          </button>
        </div>

        {/* Original message */}
        <div className="rounded-xl bg-background-subtle border border-border p-3 text-sm text-foreground-muted line-clamp-4 italic">
          {msg.message}
        </div>

        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add an internal note about this message…"
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        />

        <div className="flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              : <Check size={13} />}
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onClose, deleting }: {
  onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-background rounded-2xl border border-border shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 size={18} className="text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete Message</h3>
            <p className="text-sm text-foreground-muted">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={deleting}
            className="flex-1 py-2 text-sm font-medium rounded-xl border border-border text-foreground hover:bg-background-subtle transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2 text-sm font-semibold rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <Trash2 size={13} />}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message row ──────────────────────────────────────────────────────────────

function MessageRow({
  msg,
  onToggleRead,
  onToggleReplied,
  onNote,
  onDelete,
}: {
  msg: ContactMessage;
  onToggleRead: () => void;
  onToggleReplied: () => void;
  onNote: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "p-5 hover:bg-background-subtle/40 transition-colors",
      !msg.isRead && "border-l-2 border-l-primary bg-primary/[0.02]",
    )}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold",
          msg.isRead ? "bg-background-muted text-foreground-muted" : "bg-primary/10 text-primary",
        )}>
          {msg.name[0].toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={cn("text-sm font-semibold", !msg.isRead ? "text-foreground" : "text-foreground-muted")}>
              {msg.name}
            </span>
            <span className="text-xs text-foreground-subtle">{msg.email}</span>
            {!msg.isRead && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary text-primary-foreground uppercase tracking-wide">
                New
              </span>
            )}
            {msg.isReplied && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 uppercase tracking-wide">
                Replied
              </span>
            )}
            {msg.adminNote && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-background-muted text-foreground-muted uppercase tracking-wide">
                Note
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-foreground mb-0.5">{msg.subject}</p>
          <p className={cn("text-sm text-foreground-muted", !expanded && "line-clamp-2")}>
            {msg.message}
          </p>

          {msg.adminNote && expanded && (
            <div className="mt-2 pl-3 border-l-2 border-border">
              <p className="text-xs font-semibold text-foreground-muted mb-0.5">Internal note</p>
              <p className="text-sm text-foreground-muted italic">{msg.adminNote}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-foreground-subtle flex-wrap">
            <span>{new Date(msg.createdAt).toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}</span>
            {msg.ipAddress && <span>IP: {msg.ipAddress}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Expand */}
          {msg.message.length > 100 || msg.adminNote ? (
            <button onClick={() => setExpanded((v) => !v)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : null}

          {/* Reply via email */}
          <a
            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
            onClick={onToggleReplied}
            title="Reply via email"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
              msg.isReplied
                ? "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
            )}
          >
            <Reply size={13} />
          </a>

          {/* Note */}
          <button onClick={onNote} title="Add note"
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
              msg.adminNote
                ? "text-primary bg-primary/10 hover:bg-primary/20"
                : "text-foreground-muted hover:text-foreground hover:bg-background-subtle",
            )}>
            <MessageSquare size={13} />
          </button>

          {/* Read toggle */}
          <button onClick={onToggleRead} title={msg.isRead ? "Mark unread" : "Mark read"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors">
            {msg.isRead ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>

          {/* Delete */}
          <button onClick={onDelete} title="Delete"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.settings) {
          setSettings((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(prev) as (keyof ContactSettings)[]) {
              if (data.settings[key] !== undefined) {
                let val = data.settings[key] ?? "";
                // Auto-extract src if stored value is a full iframe HTML
                if (key === "contact_map_url" && val.includes("<iframe")) {
                  const match = val.match(/src="([^"]+)"/);
                  if (match?.[1]) val = match[1];
                }
                merged[key] = val;
              }
            }
            return merged;
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (key: keyof ContactSettings, val: string) =>
    setSettings((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    const settingsArr = (Object.keys(settings) as (keyof ContactSettings)[]).map((key) => ({
      key,
      value: settings[key] || null,
      group: "contact",
      label: key.replace(/^contact_/, "").replace(/_/g, " "),
    }));
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: settingsArr }),
    });
    setSaving(false);
    if (res.ok) toast.success("Contact info saved — changes are live");
    else toast.error("Failed to save settings");
  };

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-background-subtle animate-pulse" />
        ))}
      </div>
    );
  }

  const fields: { icon: LucideIcon; label: string; valueKey: keyof ContactSettings; subKey: keyof ContactSettings; placeholder: string; subPlaceholder: string }[] = [
    { icon: Mail,   label: "Email",   valueKey: "contact_email",   subKey: "contact_email_sub",   placeholder: "support@example.com",  subPlaceholder: "e.g. We reply within 24 hours" },
    { icon: Phone,  label: "Phone",   valueKey: "contact_phone",   subKey: "contact_phone_sub",   placeholder: "+977-9800000000",       subPlaceholder: "e.g. Mon-Sat, 9am-6pm NPT" },
    { icon: MapPin, label: "Address", valueKey: "contact_address", subKey: "contact_address_sub", placeholder: "Kathmandu, Nepal",      subPlaceholder: "e.g. Visit our showroom" },
    { icon: Clock,  label: "Hours",   valueKey: "contact_hours",   subKey: "contact_hours_sub",   placeholder: "Mon-Sat: 9am - 6pm",   subPlaceholder: "e.g. Closed on Sundays" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {fields.map(({ icon: Icon, label, valueKey, subKey, placeholder, subPlaceholder }) => (
          <div key={label} className="bg-background-subtle rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon size={14} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-foreground-muted font-medium">Main text</label>
                <input
                  type="text"
                  value={settings[valueKey]}
                  onChange={(e) => set(valueKey, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-foreground-muted font-medium">Sub-text</label>
                <input
                  type="text"
                  value={settings[subKey]}
                  onChange={(e) => set(subKey, e.target.value)}
                  placeholder={subPlaceholder}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Map URL */}
        <div className="bg-background-subtle rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe size={14} className="text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Google Maps Embed URL</span>
              <p className="text-xs text-foreground-muted">Displayed on the Contact page for customers</p>
            </div>
          </div>
          <input
            type="text"
            value={settings.contact_map_url}
            onChange={(e) => set("contact_map_url", e.target.value)}
            onPaste={(e) => {
              // Auto-extract src="…" if user pastes full <iframe> HTML
              const pasted = e.clipboardData.getData("text");
              const srcMatch = pasted.match(/src="([^"]+)"/);
              if (srcMatch?.[1]) {
                e.preventDefault();
                set("contact_map_url", srcMatch[1]);
              }
            }}
            placeholder="Paste Google Maps embed URL or full <iframe> code — src is auto-extracted"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          <div className="mt-2 space-y-1 bg-background-subtle rounded-lg p-3">
            <p className="text-xs font-semibold text-foreground-muted mb-1">How to get your map URL:</p>
            <p className="text-xs text-foreground-subtle">
              1. Open <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">maps.google.com</a> → search your location
            </p>
            <p className="text-xs text-foreground-subtle">
              2. Click <strong>Share</strong> → <strong>Embed a map</strong> → Click <strong>Copy HTML</strong>
            </p>
            <p className="text-xs text-foreground-subtle">
              3. Paste the copied HTML here — the <code className="bg-background px-1 rounded text-primary">src="…"</code> URL will be auto-extracted ✓
            </p>
          </div>
          {settings.contact_map_url && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border aspect-video">
              <iframe
                src={settings.contact_map_url}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="Map preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-background-subtle rounded-xl border border-border p-5 space-y-3">
        <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-3">Preview</p>
        {fields.map(({ icon: Icon, label, valueKey, subKey }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon size={13} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-foreground">{settings[valueKey] || `(${label})`}</p>
              <p className="text-xs text-foreground-muted">{settings[subKey]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving
            ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
            : <Save size={14} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Inbox tab ────────────────────────────────────────────────────────────────

function InboxTab() {
  const [messages,    setMessages]    = useState<ContactMessage[]>([]);
  const [total,       setTotal]       = useState(0);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("");
  const [search,      setSearch]      = useState("");
  const [debSearch,   setDebSearch]   = useState("");
  const [noteTarget,  setNoteTarget]  = useState<ContactMessage | null>(null);
  const [deleteTarget,setDeleteTarget]= useState<ContactMessage | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(timer.current);
  }, [search]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter) p.set("filter", filter);
    if (debSearch) p.set("search", debSearch);
    const res  = await fetch(`/api/admin/contact/messages?${p}`);
    const data = await res.json().catch(() => ({}));
    setMessages(data.messages ?? []);
    setTotal(data.total ?? 0);
    setUnread(data.unreadCount ?? 0);
    setLoading(false);
  }, [filter, debSearch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const patch = async (id: string, payload: object) => {
    const res = await fetch("/api/admin/contact/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (res.ok) fetchAll();
    else toast.error("Failed to update");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/contact/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (res.ok) { toast.success("Message deleted"); fetchAll(); }
    else toast.error("Failed to delete");
    setDeleting(false);
    setDeleteTarget(null);
  };

  const replied  = messages.filter((m) => m.isReplied).length;

  return (
    <>
      {noteTarget && (
        <NoteDrawer msg={noteTarget} onClose={() => setNoteTarget(null)} onSaved={fetchAll} />
      )}
      {deleteTarget && (
        <DeleteConfirm onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} deleting={deleting} />
      )}

      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total",   value: total,   color: "text-foreground" },
            { label: "Unread",  value: unread,  color: "text-primary" },
            { label: "Replied", value: replied, color: "text-emerald-600" },
            { label: "Pending", value: total - replied, color: "text-yellow-600" },
          ].map((s) => (
            <div key={s.label} className="bg-background rounded-xl border border-border px-5 py-4">
              <p className="text-xs text-foreground-muted font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {MSG_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-background-subtle border border-border text-foreground-muted hover:text-foreground",
                )}>
                {f.label}
                {f.value === "unread" && unread > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 w-48"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
            <button onClick={fetchAll}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-background-subtle animate-pulse" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox size={36} className="mx-auto mb-3 text-foreground-subtle opacity-30" />
              <p className="text-foreground-muted font-medium">No messages found</p>
              <p className="text-sm text-foreground-subtle mt-1">
                {search || filter ? "Try adjusting filters." : "Messages submitted via the contact form appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map((msg) => (
                <MessageRow
                  key={msg.id}
                  msg={msg}
                  onToggleRead={() => patch(msg.id, { isRead: !msg.isRead })}
                  onToggleReplied={() => patch(msg.id, { isReplied: !msg.isReplied, isRead: true })}
                  onNote={() => setNoteTarget(msg)}
                  onDelete={() => setDeleteTarget(msg)}
                />
              ))}
            </div>
          )}

          {!loading && messages.length > 0 && (
            <div className="px-5 py-3 border-t border-border bg-background-subtle/40 text-xs text-foreground-muted">
              Showing {messages.length} of {total} messages
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminContactPage() {
  const [tab, setTab] = useState<"inbox" | "settings">("inbox");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Contact</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Manage contact info displayed on the site and view submitted messages
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-background-subtle rounded-xl border border-border w-fit">
        {([
          { id: "inbox",    label: "Inbox",    icon: Inbox },
          { id: "settings", label: "Settings", icon: Settings2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "inbox"    && <InboxTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
