import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, status: true, priority: true, createdAt: true },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subject, description, priority } = await req.json();
  if (!subject || !description) {
    return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
  }
  // Generate a short ticket ref
  const ticketRef = `TKT-${Date.now().toString(36).toUpperCase()}`;
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      ticketRef,
      subject,
      body: description,
      priority: priority ?? "MEDIUM",
      status: "OPEN",
    },
    select: { id: true, subject: true, status: true, priority: true, createdAt: true },
  });
  return NextResponse.json({ ticket }, { status: 201 });
}
