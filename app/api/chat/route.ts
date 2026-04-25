import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAIResponse, buildSystemPrompt, type AIMessage } from "@/lib/ai/chat";
import { headers } from "next/headers";

// Rate limit per session: max 30 messages per hour (in-memory, per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message: string;
      sessionId: string;
      name?: string;
      email?: string;
    };

    const { message, sessionId, name, email } = body;
    if (!message?.trim() || !sessionId) {
      return NextResponse.json({ error: "message and sessionId are required" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    // Rate limit
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json({ error: "Too many messages. Please wait." }, { status: 429 });
    }

    // Check if AI chat is enabled
    const aiEnabledSetting = await prisma.siteSettings.findUnique({
      where: { key: "ai_chat_enabled" },
    });
    if (aiEnabledSetting?.value === "false") {
      return NextResponse.json({
        reply: "Thanks for your message! Our support team will get back to you shortly.",
        disabled: true,
      });
    }

    // Get or create conversation
    let conversation = await prisma.conversation.findUnique({
      where:   { sessionId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });

    const hdrs      = await headers();
    const ipAddress = hdrs.get("x-forwarded-for")?.split(",")[0] ?? hdrs.get("x-real-ip") ?? null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          channel:  "web",
          name:     name ?? null,
          email:    email ?? null,
          metadata: { ipAddress },
        },
        include: { messages: true },
      });
    } else if ((name && !conversation.name) || (email && !conversation.email)) {
      // Update name/email if newly provided
      await prisma.conversation.update({
        where: { sessionId },
        data:  { name: name ?? undefined, email: email ?? undefined },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "user", content: message.trim() },
    });

    // Build context for system prompt
    const [settings, categories] = await Promise.all([
      prisma.siteSettings.findMany({
        where: { key: { in: [
          "site_name", "site_email", "site_phone", "site_address",
          "currency", "ai_system_prompt", "return_policy",
          "promo_bar_text", "offer_title",
        ]}},
      }),
      prisma.category.findMany({ where: { isActive: true }, select: { name: true }, take: 20 }),
    ]);

    const s = Object.fromEntries(settings.map((r) => [r.key, r.value ?? ""]));
    const currencyMap: Record<string, string> = { NPR: "Rs.", USD: "$", EUR: "€", GBP: "£" };

    const systemPrompt = s["ai_system_prompt"] || buildSystemPrompt({
      siteName:     s["site_name"]     || "NexCart",
      siteEmail:    s["site_email"]    || "",
      sitePhone:    s["site_phone"]    || "",
      siteAddress:  s["site_address"]  || "",
      currency:     s["currency"]      || "NPR",
      currencySymbol: currencyMap[s["currency"] || "NPR"] || "Rs.",
      categories:   categories.map((c) => c.name),
      offers:       [s["promo_bar_text"], s["offer_title"]].filter(Boolean).join(" | "),
      returnPolicy: s["return_policy"] || "",
      shippingInfo: "",
    });

    // Build message history (last 10 turns)
    const history: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.slice(-10).map((m) => ({
        role:    m.role as AIMessage["role"],
        content: m.content,
      })),
      { role: "user", content: message.trim() },
    ];

    // Get AI reply
    const reply = await getAIResponse(history);

    // Save assistant reply
    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: reply },
    });

    // Mark conversation as unread for admin
    await prisma.conversation.update({
      where: { sessionId },
      data:  { isRead: false, updatedAt: new Date() },
    });

    return NextResponse.json({ reply, conversationId: conversation.id });
  } catch (err) {
    console.error("[Chat API]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET — fetch conversation history by sessionId
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ messages: [] });

  const conversation = await prisma.conversation.findUnique({
    where:   { sessionId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });

  return NextResponse.json({
    messages: conversation?.messages ?? [],
    conversationId: conversation?.id ?? null,
  });
}
