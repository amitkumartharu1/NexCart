"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSessionId(): string {
  try {
    const stored = localStorage.getItem("nexcart_chat_session");
    if (stored) return stored;
    const id = generateSessionId();
    localStorage.setItem("nexcart_chat_session", id);
    return id;
  } catch {
    return generateSessionId();
  }
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-end gap-2 px-1">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Bot size={13} className="text-primary" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-bl-sm bg-background-subtle border border-border">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-foreground-muted animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
      )}>
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[80%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
        isUser
          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
          : "bg-background-subtle border border-border text-foreground rounded-2xl rounded-bl-sm",
      )}>
        {msg.content}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function ChatWidget() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [notifCount, setNotifCount] = useState(0);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);

  // Init session + load history
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);

    fetch(`/api/chat?sessionId=${encodeURIComponent(sid)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.messages?.length) {
          setMessages(data.messages.map((m: Message) => ({
            id:        m.id,
            role:      m.role as "user" | "assistant",
            content:   m.content,
            createdAt: m.createdAt,
          })));
        } else {
          // Welcome message
          setMessages([{
            id:        "welcome",
            role:      "assistant",
            content:   "👋 Hi! Welcome to NexCart! I'm your AI shopping assistant. How can I help you today?\n\nYou can ask me about products, pricing, delivery, orders, or anything else!",
            createdAt: new Date().toISOString(),
          }]);
        }
      })
      .catch(() => {
        setMessages([{
          id:        "welcome",
          role:      "assistant",
          content:   "👋 Hi! Welcome to NexCart! How can I help you today?",
          createdAt: new Date().toISOString(),
        }]);
      });
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Show notification badge when closed and new message arrives
  useEffect(() => {
    if (!open && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        setNotifCount((n) => n + 1);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    setNotifCount(0);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !sessionId) return;

    const userMsg: Message = {
      id:        `u_${Date.now()}`,
      role:      "user",
      content:   text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();

      const reply: Message = {
        id:        `a_${Date.now()}`,
        role:      "assistant",
        content:   data.reply ?? "Sorry, something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, role: "assistant", content: "Sorry, I couldn't connect. Please try again. 🙏", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, loading, sessionId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-none">NexCart Support</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                AI-powered · typically replies instantly
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary-foreground/20 transition-colors"
            >
              <Minimize2 size={15} />
            </button>
          </div>

          {/* Quick action chips */}
          <div className="flex gap-2 px-3 py-2 bg-background-subtle border-b border-border overflow-x-auto scrollbar-none flex-shrink-0">
            {["Track Order", "Return Policy", "Current Offers", "Contact Us"].map((chip) => (
              <button
                key={chip}
                onClick={() => { setInput(chip); setTimeout(send, 0); }}
                disabled={loading}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border border-border bg-background text-foreground-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-0">
            {messages.map((msg) => <Bubble key={msg.id} msg={msg} />)}
            {loading && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border px-3 py-3 bg-background flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a message…"
                rows={1}
                maxLength={500}
                style={{ resize: "none", maxHeight: "100px" }}
                className="flex-1 min-w-0 px-3 py-2 text-sm bg-background-subtle border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors placeholder:text-foreground-subtle"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-foreground-subtle mt-1.5 text-center">
              Powered by NexCart AI · <a href="/contact" className="underline hover:text-foreground">Contact a human</a>
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className={cn(
          "fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200",
          open
            ? "bg-foreground text-background rotate-0 hover:scale-105"
            : "bg-primary text-primary-foreground hover:scale-110 hover:shadow-primary/30",
        )}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && notifCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {notifCount > 9 ? "9+" : notifCount}
          </span>
        )}
      </button>
    </>
  );
}
