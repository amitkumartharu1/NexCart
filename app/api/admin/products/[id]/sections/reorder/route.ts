import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !ALLOWED.has(session.user.role ?? ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const { orderedIds } = (await req.json()) as { orderedIds: string[] };
    await prisma.$transaction(
      orderedIds.map((sectionId, index) =>
        prisma.$executeRaw`
          UPDATE product_sections
          SET "sortOrder" = ${index}, "updatedAt" = NOW()
          WHERE "id" = ${sectionId} AND "productId" = ${id}
        `
      )
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/sections/reorder]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
