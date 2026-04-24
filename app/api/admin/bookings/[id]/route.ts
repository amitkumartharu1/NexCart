import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["SUPER_ADMIN","ADMIN","MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { status, notes } = await req.json();
  const booking = await prisma.serviceBooking.update({
    where: { id },
    data: { ...(status && { status }), ...(notes !== undefined && { notes }) },
  });
  return NextResponse.json({ booking });
}
