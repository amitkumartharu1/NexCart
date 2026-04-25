/**
 * POST /api/contact
 * Public — saves a contact form submission to the DB.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, subject, message } = body ?? {};

  // Validate required fields
  if (!name?.trim())    return NextResponse.json({ error: "Name is required" },    { status: 422 });
  if (!email?.trim())   return NextResponse.json({ error: "Email is required" },   { status: 422 });
  if (!subject?.trim()) return NextResponse.json({ error: "Subject is required" }, { status: 422 });
  if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 422 });

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 422 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null;

  await prisma.contactMessage.create({
    data: {
      name:      name.trim().slice(0, 200),
      email:     email.trim().toLowerCase().slice(0, 200),
      subject:   subject.trim().slice(0, 300),
      message:   message.trim().slice(0, 5000),
      ipAddress: ip,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
