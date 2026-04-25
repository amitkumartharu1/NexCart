"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageCircle, Bot, Phone, Globe, Search, X, RefreshCw,
  CheckCircle, AlertCircle, Trash2, Send, Eye, EyeOff,
  Filter, MessageSquare, Smartphone, Zap, Settings2, Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id:        string;
  role:      string;
  content:   string;
  createdAt: string;
  metadata?: { adminSent?: boolean } | null;
}

interface Conversation {
  id:        string;
  sessionId: string;
  channel:   string;
  phone:     string | null;
  name:      string | null;
  email:     string | null;
  status:    string;
  isRead:    boolean;
  updatedAt: string;
  messages:  ChatMsg[];
  _count:    { messages: number };
}

// ─── Channel icon ─────────────────────────────────────────────────────────────

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "sms")      return <Smartphone size={12} className="text-blue-500" />;
  if (channel === "whatsapp") return <MessageCircle size={12} className="text-emerald-500" />;
  return <Globe size={12} className="text-purple-500" />;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:      "bg-blue-500/10 text-blue-600 border-blue-500/20",
    resolved:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    escalated: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide", map[status] ?? map.open)}>
      {status}
    </span>
  );
}

// ─── Conversation thread panel ────────────────────────────────────────────────

function ThreadPanel({ convo, onUpdate }: { convo: Conversation; onUpdate: () => void }) {
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [reply,      setReply]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/chat/${convo.id}`);
    const data = await res.json().catch(() => ({}));
    setMessages(data?.conversation?.messages ?? []);
    setLoading(false);
  }, [convo.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await fetch("/api/admin/chat", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: convo.id, adminReply: text }),
    });
    setSending(false);
    if (res.ok) { setReply(""); toast.success("Reply sent"); load(); onUpdate(); }
    else toast.error("Failed to send");
  };

  const updateStatus = async (status: string) => {
    const res = await fetch("/api/admin/chat", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: convo.id, status }),
    });
    if (res.ok) { toast.success(`Marked as ${status}`); onUpdate(); }
  };

  const deleteConvo = async () => {
    if (!confirm("Delete this entire conversation? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch("/api/admin/chat", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: convo.id }),
    });
    if (res.ok) { toast.success("Conversation deleted"); onUpdate(); }
    else toast.error("Failed to delete");
    setDeleting(false);
  };

  const displayName = convo.name || convo.phone || convo.sessionId.slice(0, 12) + "…";

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-5 py-4 border-b border-border bg-background-subtle flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm">{displayName}</p>
                <ChannelIcon channel={convo.channel} />
                <StatusBadge status={convo.status} />
              </div>
              {convo.email && <p className="text-xs text-foreground-muted">{convo.email}</p>}
              {convo.phone && <p className="text-xs text-foreground-muted">{convo.phone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {convo.status !== "resolved" && (
              <button onClick={() => updateStatus("resolved")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                <CheckCircle size={12} /> Resolve
              </button>
            )}
            {convo.status !== "escalated" && (
              <button onClick={() => updateStatus("escalated")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors">
                <AlertCircle size={12} /> Escalate
              </button>
            )}
            <button onClick={deleteConvo} disabled={deleting}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-muted hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
        {loading ? (
          Array(4).fill(null).map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "" : "justify-end")}>
              <div className="h-10 w-48 rounded-2xl bg-background-subtle animate-pulse" />
            </div>
          ))
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-foreground-muted py-8">No messages yet</p>
        ) : (
          messages.map((msg) => {
            const isUser    = msg.role === "user";
            const isAdmin   = msg.metadata?.adminSent;
            const isAssist  = msg.role === "assistant";
            return (
              <div key={msg.id} className={cn("flex items-end gap-2", !isUser && "flex-row-reverse")}>
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                  isUser ? "bg-background-muted text-foreground-muted" : isAdmin ? "bg-blue-500/10 text-blue-600" : "bg-primary/10 text-primary",
                )}>
                  {isUser ? "U" : isAdmin ? "A" : <Bot size={13} />}
                </div>
                <div className={cn(
                  "max-w-[75%] px-3 py-2.5 text-sm rounded-2xl whitespace-pre-wrap break-words",
                  isUser
                    ? "bg-background-subtle border border-border text-foreground rounded-bl-sm"
                    : isAdmin
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-primary text-primary-foreground rounded-br-sm",
                )}>
                  {msg.content}
                  <p className="text-[10px] mt-1 opacity-60">
                    {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    {isAdmin && " · Admin"}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <div className="border-t border-border px-4 py-3 bg-background flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            placeholder="Type a reply… (Enter to send)"
            rows={2}
            style={{ resize: "none" }}
            className="flex-1 px-3 py-2 text-sm bg-background-subtle border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {sending ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-[10px] text-foreground-subtle mt-1.5">
          This reply will appear in the customer&apos;s chat widget
        </p>
      </div>
    </div>
  );
}

// ─── AI Settings panel ────────────────────────────────────────────────────────

function AISettingsPanel() {
  const [settings, setSettings] = useState({
    ai_chat_enabled:    "true",
    ai_system_prompt:   "",
    popup_enabled:      "true",
    popup_title:        "🔥 Limited Time Offer!",
    popup_description:  "Get 20% OFF on your first order. Use code below at checkout.",
    popup_badge:        "urgency",
    popup_cta_text:     "Shop Now",
    popup_cta_link:     "/shop",
    popup_coupon_code:  "FIRST20",
    popup_delay_seconds: "6",
    popup_suppress_hours: "24",
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.settings) {
          setSettings((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(prev) as (keyof typeof prev)[]) {
              if (data.settings[key] !== undefined && data.settings[key] !== null) {
                merged[key] = data.settings[key];
              }
            }
            return merged;
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (key: keyof typeof settings, val: string) =>
    setSettings((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    const entries = Object.entries(settings).map(([key, value]) => ({ key, value, group: "ai" }));
    const res = await fetch("/api/admin/settings", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ settings: entries }),
    });
    setSaving(false);
    if (res.ok) toast.success("AI settings saved");
    else toast.error("Failed to save");
  };

  if (loading) return <div className="p-6 space-y-4">{Array(4).fill(null).map((_, i) => <div key={i} className="h-16 rounded-xl bg-background-subtle animate-pulse" />)}</div>;

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* AI Chat toggle */}
      <div className="bg-background-subtle rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AI Chat Auto-Reply</p>
              <p className="text-xs text-foreground-muted">AI responds instantly to customer messages</p>
            </div>
          </div>
          <button
            onClick={() => set("ai_chat_enabled", settings.ai_chat_enabled === "true" ? "false" : "true")}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              settings.ai_chat_enabled === "true" ? "bg-primary" : "bg-border",
            )}
          >
            <span className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              settings.ai_chat_enabled === "true" ? "translate-x-5.5" : "translate-x-0.5",
            )} style={{ transform: settings.ai_chat_enabled === "true" ? "translateX(22px)" : "translateX(2px)" }} />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground-muted">AI Providers (configure in .env)</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "OpenAI", env: "OPENAI_API_KEY", color: "text-emerald-600" },
              { name: "Cohere",       env: "COHERE_API_KEY",    color: "text-blue-600" },
              { name: "HuggingFace",  env: "HUGGINGFACE_API_KEY", color: "text-orange-600" },
            ].map((p) => (
              <div key={p.name} className="p-3 rounded-lg border border-border bg-background text-center">
                <p className={cn("text-xs font-bold", p.color)}>{p.name}</p>
                <p className="text-[10px] text-foreground-subtle mt-0.5 font-mono">{p.env}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground-subtle">Falls back to built-in rule-based responses if no API key is set</p>
        </div>
      </div>

      {/* Custom system prompt */}
      <div className="bg-background-subtle rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">Custom AI System Prompt</p>
        </div>
        <textarea
          value={settings.ai_system_prompt}
          onChange={(e) => set("ai_system_prompt", e.target.value)}
          placeholder="Leave blank to use the auto-generated prompt based on your store settings…"
          rows={5}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
        />
        <p className="text-xs text-foreground-subtle">
          Override the default AI personality. Include your business rules, tone, and product focus.
        </p>
      </div>

      {/* Promo Popup */}
      <div className="bg-background-subtle rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-primary" />
            <p className="text-sm font-semibold text-foreground">Promo Popup</p>
          </div>
          <button
            onClick={() => set("popup_enabled", settings.popup_enabled === "true" ? "false" : "true")}
            className={cn("w-11 h-6 rounded-full transition-colors relative", settings.popup_enabled === "true" ? "bg-primary" : "bg-border")}
          >
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: settings.popup_enabled === "true" ? "translateX(22px)" : "translateX(2px)" }} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">Title</label>
            <input value={settings.popup_title} onChange={(e) => set("popup_title", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">Coupon Code</label>
            <input value={settings.popup_coupon_code} onChange={(e) => set("popup_coupon_code", e.target.value)}
              placeholder="SAVE10" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono uppercase" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-foreground-muted">Description</label>
            <input value={settings.popup_description} onChange={(e) => set("popup_description", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">Urgency Badge</label>
            <select value={settings.popup_badge} onChange={(e) => set("popup_badge", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/20">
              <option value="urgency">⚡ Urgency — Sale ends soon</option>
              <option value="scarcity">🔥 Scarcity — Only a few left</option>
              <option value="social">👥 Social Proof — 120+ bought today</option>
              <option value="discount">💰 Discount Anchoring</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">CTA Button Text</label>
            <input value={settings.popup_cta_text} onChange={(e) => set("popup_cta_text", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">CTA Link</label>
            <input value={settings.popup_cta_link} onChange={(e) => set("popup_cta_link", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground-muted">Show after (seconds)</label>
            <input type="number" min="0" max="60" value={settings.popup_delay_seconds} onChange={(e) => set("popup_delay_seconds", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
        </div>
      </div>

      {/* SMS Setup */}
      <div className="bg-background-subtle rounded-xl border border-border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-primary" />
          <p className="text-sm font-semibold text-foreground">SMS / WhatsApp Setup (Twilio)</p>
        </div>
        <div className="space-y-2 text-sm text-foreground-muted">
          <p>1. Sign up at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">twilio.com</a> (free trial)</p>
          <p>2. Get a phone number from the Twilio Console</p>
          <p>3. Go to <strong>Messaging → Active Numbers → your number</strong></p>
          <p>4. Set webhook URL to: <code className="bg-background px-1.5 py-0.5 rounded text-xs text-primary font-mono">https://your-domain.vercel.app/api/sms/webhook</code></p>
          <p>5. Method: <strong>POST</strong></p>
          <p className="mt-2 text-xs text-foreground-subtle">Same URL works for WhatsApp Sandbox (Meta Business messaging also works)</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminChatPage() {
  const [tab,         setTab]         = useState<"inbox" | "settings">("inbox");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [total,       setTotal]       = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<Conversation | null>(null);
  const [filter,      setFilter]      = useState("");
  const [channel,     setChannel]     = useState("");
  const [search,      setSearch]      = useState("");
  const [debSearch,   setDebSearch]   = useState("");

  const debTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(debTimer.current);
    debTimer.current = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(debTimer.current);
  }, [search]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filter)    p.set("status",  filter);
    if (channel)   p.set("channel", channel);
    if (debSearch) p.set("search",  debSearch);
    const res  = await fetch(`/api/admin/chat?${p}`);
    const data = await res.json().catch(() => ({}));
    setConversations(data.conversations ?? []);
    setTotal(data.total ?? 0);
    setUnreadCount(data.unreadCount ?? 0);
    setLoading(false);
  }, [filter, channel, debSearch]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const selectConvo = (c: Conversation) => {
    setSelected(c);
    // Optimistically mark as read
    setConversations((prev) => prev.map((x) => x.id === c.id ? { ...x, isRead: true } : x));
    if (unreadCount > 0 && !c.isRead) setUnreadCount((n) => n - 1);
  };

  const displayName = (c: Conversation) =>
    c.name || c.phone || c.sessionId.slice(0, 14) + "…";

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-0">
      {/* Header */}
      <div className="space-y-4 mb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle size={22} className="text-primary" />
              Chat
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">{unreadCount}</span>
              )}
            </h1>
            <p className="text-sm text-foreground-muted mt-1">AI-powered customer chat inbox + SMS</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-background-subtle rounded-xl border border-border w-fit">
          {([
            { id: "inbox",    label: "Inbox",    icon: MessageCircle },
            { id: "settings", label: "AI Settings", icon: Settings2 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                tab === id ? "bg-background text-foreground shadow-sm border border-border" : "text-foreground-muted hover:text-foreground",
              )}>
              <Icon size={14} />
              {label}
              {id === "inbox" && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "settings" && (
        <div className="flex-1 min-h-0 overflow-y-auto bg-background rounded-xl border border-border">
          <AISettingsPanel />
        </div>
      )}

      {tab === "inbox" && (
        <div className="flex flex-1 min-h-0 gap-4">
          {/* Conversation list */}
          <div className="w-80 flex-shrink-0 flex flex-col bg-background rounded-xl border border-border overflow-hidden">
            {/* Filters */}
            <div className="px-3 py-3 border-b border-border space-y-2 flex-shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-input bg-background-subtle focus:outline-none focus:ring-1 focus:ring-ring" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted"><X size={12} /></button>}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["", "open", "resolved", "escalated"].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      filter === s ? "bg-primary text-primary-foreground" : "bg-background-subtle border border-border text-foreground-muted hover:text-foreground")}>
                    {s || "All"}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {["", "web", "sms", "whatsapp"].map((ch) => (
                  <button key={ch} onClick={() => setChannel(ch)}
                    className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      channel === ch ? "bg-foreground text-background" : "bg-background-subtle border border-border text-foreground-muted hover:text-foreground")}>
                    {ch || "All"}
                  </button>
                ))}
                <button onClick={fetchConversations} className="ml-auto w-6 h-6 flex items-center justify-center rounded text-foreground-muted hover:text-foreground">
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {loading ? (
                Array(5).fill(null).map((_, i) => <div key={i} className="p-4"><div className="h-12 rounded-xl bg-background-subtle animate-pulse" /></div>)
              ) : conversations.length === 0 ? (
                <div className="py-12 text-center">
                  <MessageCircle size={28} className="mx-auto mb-2 text-foreground-subtle opacity-30" />
                  <p className="text-sm text-foreground-muted">No conversations found</p>
                </div>
              ) : (
                conversations.map((c) => (
                  <button key={c.id} onClick={() => selectConvo(c)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-background-subtle transition-colors",
                      selected?.id === c.id && "bg-primary/5 border-l-2 border-l-primary",
                      !c.isRead && "bg-primary/[0.02]",
                    )}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground truncate flex-1">
                        {displayName(c)}
                      </span>
                      <ChannelIcon channel={c.channel} />
                      {!c.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-foreground-muted truncate flex-1">
                        {c.messages?.[0]?.content ?? "No messages"}
                      </p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-[10px] text-foreground-subtle mt-1">
                      {new Date(c.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{c._count.messages} msgs
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-background-subtle/40 text-xs text-foreground-muted">
              {total} conversations
            </div>
          </div>

          {/* Thread */}
          <div className="flex-1 min-w-0 bg-background rounded-xl border border-border overflow-hidden">
            {selected ? (
              <ThreadPanel key={selected.id} convo={selected} onUpdate={fetchConversations} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-foreground-muted">
                <MessageCircle size={40} className="opacity-20" />
                <p className="text-sm">Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
