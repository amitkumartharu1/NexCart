/**
 * Multi-provider AI chat wrapper.
 * Priority: OpenAI → Cohere → HuggingFace → rule-based fallback
 * Server-only — never import in client components.
 * API keys can be set via env vars OR via admin Settings → API Keys.
 * Env vars always take precedence over DB-stored keys.
 */

import { prisma } from "@/lib/db/prisma";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── DB key cache (per-request, not module-level) ─────────────────────────────

let _keyCache: Record<string, string> | null = null;
let _keyCacheTime = 0;
const KEY_CACHE_TTL = 60_000; // 1 minute

async function getDbKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_keyCache && now - _keyCacheTime < KEY_CACHE_TTL) return _keyCache;

  try {
    const rows = await prisma.siteSettings.findMany({
      where: { key: { in: ["ai_openai_key", "ai_cohere_key", "ai_huggingface_key", "twilio_account_sid", "twilio_auth_token", "twilio_phone_number"] } },
      select: { key: true, value: true },
    });
    _keyCache = Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
    _keyCacheTime = now;
  } catch {
    _keyCache = {};
    _keyCacheTime = now;
  }
  return _keyCache;
}

/** Returns env var value if set, otherwise falls back to DB setting. */
async function resolveKey(envVar: string, dbKey: string): Promise<string | undefined> {
  if (process.env[envVar]) return process.env[envVar];
  const db = await getDbKeys();
  return db[dbKey] || undefined;
}

// ─── OpenAI / OpenAI-compatible ───────────────────────────────────────────────

async function callOpenAI(messages: AIMessage[], apiKey: string): Promise<string> {
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model   = process.env.OPENAI_MODEL    ?? "gpt-3.5-turbo";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: 300, temperature: 0.7 }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

// ─── Cohere ───────────────────────────────────────────────────────────────────

async function callCohere(messages: AIMessage[], apiKey: string): Promise<string> {
  // Convert messages to Cohere chat history format
  const history = messages.slice(0, -1).map((m) => ({
    role:    m.role === "user" ? "USER" : "CHATBOT",
    message: m.content,
  }));
  const lastMsg = messages[messages.length - 1].content;
  const preamble = messages.find((m) => m.role === "system")?.content ?? "";

  const res = await fetch("https://api.cohere.ai/v1/chat", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      message:         lastMsg,
      chat_history:    history.filter((h) => h.role !== "CHATBOT" || history.indexOf(h) > 0),
      preamble,
      model:           "command-r",
      max_tokens:      300,
      temperature:     0.7,
    }),
  });

  if (!res.ok) throw new Error(`Cohere error ${res.status}`);
  const data = await res.json();
  return (data.text ?? "").trim();
}

// ─── HuggingFace ──────────────────────────────────────────────────────────────

async function callHuggingFace(messages: AIMessage[], apiKey: string): Promise<string> {
  const model = process.env.HF_MODEL ?? "HuggingFaceH4/zephyr-7b-beta";

  // Build prompt string for instruct models
  const prompt = messages
    .map((m) => {
      if (m.role === "system")    return `<|system|>\n${m.content}</s>`;
      if (m.role === "user")      return `<|user|>\n${m.content}</s>`;
      if (m.role === "assistant") return `<|assistant|>\n${m.content}</s>`;
      return "";
    })
    .join("\n") + "\n<|assistant|>";

  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 300, temperature: 0.7, return_full_text: false } }),
  });

  if (!res.ok) throw new Error(`HuggingFace error ${res.status}`);
  const data = await res.json();
  const text = Array.isArray(data) ? (data[0]?.generated_text ?? "") : (data?.generated_text ?? "");
  return text.split("</s>")[0].trim();
}

// ─── Rule-based fallback ──────────────────────────────────────────────────────

const RULE_RESPONSES: [RegExp, string][] = [
  [/hello|hi|hey|namaste/i,             "Hello! 👋 Welcome to NexCart! How can I help you today? You can ask me about products, orders, delivery, or anything else."],
  [/price|cost|how much/i,              "I can check prices for you! Please tell me which product you're interested in and I'll give you the latest price. 💰"],
  [/order|track|status/i,               "To track your order, please share your Order ID and I'll look it up for you right away! 📦"],
  [/delivery|shipping|arrive|when/i,    "We offer delivery across Nepal. Standard delivery takes 2-4 business days. Free delivery on orders above Rs. 1,500! 🚚"],
  [/return|refund|exchange/i,           "We have a 7-day hassle-free return policy. If you're not satisfied, we'll arrange a pickup and process your refund within 3-5 days. 🔄"],
  [/payment|pay|how to pay/i,           "We accept eSewa, Khalti, bank transfer, and Cash on Delivery. All payments are 100% secure! 💳"],
  [/discount|offer|coupon|deal/i,       "🎉 Use code SAVE10 for 10% off your first order! Also check our current flash sales on the homepage."],
  [/product|buy|want|looking/i,         "Great choice! Tell me what you're looking for and I'll help you find the perfect product. We have electronics, gadgets, fashion, and much more! 🛍️"],
  [/contact|phone|email|support/i,      "You can reach our team at support@nexcart.com or call +977-9800000000 (Mon-Sat, 9am-6pm). I'm also here 24/7 to help! 📞"],
  [/warranty|guarantee/i,               "All our products come with manufacturer warranty. Electronics typically have 1-year warranty. We also offer extended warranty options! ✅"],
  [/cancel/i,                           "To cancel an order, please share your Order ID. Orders can be cancelled within 24 hours of placing them. I'll help you right away! ❌"],
  [/bye|thank|thanks/i,                 "Thank you for contacting NexCart! 😊 Feel free to reach out anytime. Happy shopping! 🛒"],
];

function ruleBasedResponse(userMessage: string): string {
  for (const [pattern, response] of RULE_RESPONSES) {
    if (pattern.test(userMessage)) return response;
  }
  return "Thanks for your message! Our team will get back to you shortly. Meanwhile, you can browse our products or check our FAQ page for quick answers. 😊";
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function getAIResponse(messages: AIMessage[]): Promise<string> {
  // Resolve keys: env var first, then DB setting
  const [openaiKey, cohereKey, hfKey] = await Promise.all([
    resolveKey("OPENAI_API_KEY",      "ai_openai_key"),
    resolveKey("COHERE_API_KEY",      "ai_cohere_key"),
    resolveKey("HUGGINGFACE_API_KEY", "ai_huggingface_key"),
  ]);

  // Try providers in priority order
  if (openaiKey) {
    try { return await callOpenAI(messages, openaiKey); } catch (e) { console.error("[AI] OpenAI failed:", e); }
  }
  if (cohereKey) {
    try { return await callCohere(messages, cohereKey); } catch (e) { console.error("[AI] Cohere failed:", e); }
  }
  if (hfKey) {
    try { return await callHuggingFace(messages, hfKey); } catch (e) { console.error("[AI] HuggingFace failed:", e); }
  }

  // Rule-based fallback
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  return ruleBasedResponse(lastUser?.content ?? "");
}

/**
 * Resolves Twilio credentials — env vars first, then DB settings.
 * Returns null if neither is configured.
 */
export async function getTwilioConfig(): Promise<{
  accountSid: string;
  authToken:  string;
  phoneNumber: string;
} | null> {
  const [sid, token, phone] = await Promise.all([
    resolveKey("TWILIO_ACCOUNT_SID",   "twilio_account_sid"),
    resolveKey("TWILIO_AUTH_TOKEN",    "twilio_auth_token"),
    resolveKey("TWILIO_PHONE_NUMBER",  "twilio_phone_number"),
  ]);
  if (!sid || !token || !phone) return null;
  return { accountSid: sid, authToken: token, phoneNumber: phone };
}

// ─── System prompt builder ────────────────────────────────────────────────────

export function buildSystemPrompt(ctx: {
  siteName:    string;
  siteEmail:   string;
  sitePhone:   string;
  siteAddress: string;
  currency:    string;
  currencySymbol: string;
  categories:  string[];
  offers:      string;
  returnPolicy: string;
  shippingInfo: string;
}): string {
  return `You are an AI Customer Support and Sales Assistant for ${ctx.siteName}, an e-commerce store.

BUSINESS INFO:
- Name: ${ctx.siteName}
- Email: ${ctx.siteEmail || "support@nexcart.com"}
- Phone: ${ctx.sitePhone || "+977-9800000000"}
- Address: ${ctx.siteAddress || "Kathmandu, Nepal"}
- Currency: ${ctx.currencySymbol} (${ctx.currency})

PRODUCT CATEGORIES: ${ctx.categories.join(", ") || "Electronics, Gadgets, Fashion, Accessories"}

SHIPPING: ${ctx.shippingInfo || "Standard delivery in 2-4 business days. Free shipping above Rs. 1500."}

RETURNS: ${ctx.returnPolicy || "7-day hassle-free returns. Refund processed in 3-5 days."}

CURRENT OFFERS: ${ctx.offers || "Use code SAVE10 for 10% off first order."}

BEHAVIOR RULES:
- Keep responses SHORT (2-4 sentences max) — optimized for SMS and chat
- Be friendly, warm, and professional
- Always guide toward a purchase or helpful action
- Use urgency/scarcity when appropriate ("Only a few left!", "Sale ends soon!")
- Suggest related products when relevant (upsell/cross-sell)
- For order placement, collect: Full Name, Phone, Delivery Address
- For complaints, apologize first then solve
- Never mention competitor stores
- Respond in the same language the customer uses
- Use relevant emojis sparingly for warmth`;
}
