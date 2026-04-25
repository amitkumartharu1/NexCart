/**
 * Twilio SMS / WhatsApp Webhook
 *
 * Setup in Twilio Console:
 *   Messaging → Active Numbers → your number
 *   Webhook URL: https://your-domain.vercel.app/api/sms/webhook
 *   Method: POST
 *
 * For WhatsApp Sandbox:
 *   Messaging → Try it out → WhatsApp
 *   Sandbox settings → same webhook URL
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAIResponse, buildSystemPrompt, type AIMessage } from "@/lib/ai/chat";

// Twilio TwiML XML response helper
function twiml(message: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
</Response>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Parse Twilio's URL-encoded form body
    const text   = await req.text();
    const params = new URLSearchParams(text);

    const from    = params.get("From") ?? "";      // e.g. "+9779800000000" or "whatsapp:+9779800000000"
    const body    = params.get("Body")?.trim() ?? "";
    const channel = from.startsWith("whatsapp:") ? "whatsapp" : "sms";
    const phone   = from.replace("whatsapp:", "");

    if (!body || !phone) {
      return twiml("Sorry, we could not process your message.");
    }

    // Check if AI is enabled
    const aiEnabled = await prisma.siteSettings.findUnique({ where: { key: "ai_chat_enabled" } });
    if (aiEnabled?.value === "false") {
      return twiml("Thanks for reaching out! Our team will reply shortly.");
    }

    // Get or create conversation keyed by phone number
    let conversation = await prisma.conversation.findUnique({
      where:   { sessionId: `${channel}:${phone}` },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          sessionId: `${channel}:${phone}`,
          channel,
          phone,
        },
        include: { messages: true },
      });
    }

    // Save inbound message
    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "user", content: body },
    });

    // Build system prompt
    const settings = await prisma.siteSettings.findMany({
      where: { key: { in: ["site_name", "site_email", "site_phone", "site_address", "currency", "ai_system_prompt"] }},
    });
    const s         = Object.fromEntries(settings.map((r) => [r.key, r.value ?? ""]));
    const categories = await prisma.category.findMany({ where: { isActive: true }, select: { name: true }, take: 10 });

    const systemPrompt = s["ai_system_prompt"] || buildSystemPrompt({
      siteName:       s["site_name"]    || "NexCart",
      siteEmail:      s["site_email"]   || "",
      sitePhone:      s["site_phone"]   || "",
      siteAddress:    s["site_address"] || "",
      currency:       s["currency"]     || "NPR",
      currencySymbol: "Rs.",
      categories:     categories.map((c) => c.name),
      offers:         "",
      returnPolicy:   "",
      shippingInfo:   "Standard delivery in 2-4 business days.",
    });

    const history: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversation.messages.slice(-6).map((m) => ({
        role:    m.role as AIMessage["role"],
        content: m.content,
      })),
      { role: "user", content: body },
    ];

    const reply = await getAIResponse(history);

    // Save outbound reply
    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: reply },
    });

    await prisma.conversation.update({
      where: { sessionId: `${channel}:${phone}` },
      data:  { isRead: false, updatedAt: new Date() },
    });

    // SMS replies should be under 160 chars ideally; truncate if needed
    const smsReply = channel === "sms" && reply.length > 320
      ? reply.substring(0, 317) + "…"
      : reply;

    return twiml(smsReply);
  } catch (err) {
    console.error("[SMS Webhook]", err);
    return twiml("Sorry, something went wrong. Please try again later.");
  }
}

// Twilio sends GET to validate the webhook URL
export async function GET() {
  return new NextResponse("NexCart SMS Webhook OK", { status: 200 });
}
