import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Store in SiteSettings as a comma-separated list (simple, no extra table needed)
  try {
    const existing = await prisma.siteSettings.findUnique({
      where: { key: "newsletter_subscribers" },
    });

    const currentList: string[] = existing?.value
      ? existing.value.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

    if (currentList.includes(email.toLowerCase())) {
      return NextResponse.json({ message: "Already subscribed!" });
    }

    const updated = [...currentList, email.toLowerCase()].join(",");

    await prisma.siteSettings.upsert({
      where: { key: "newsletter_subscribers" },
      create: {
        key: "newsletter_subscribers",
        value: updated,
        group: "internal",
        label: "Newsletter Subscribers",
      },
      update: { value: updated },
    });

    return NextResponse.json({ message: "Subscribed successfully! 🎉" });
  } catch (err) {
    console.error("[newsletter] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
