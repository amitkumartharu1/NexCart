import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

// GET /api/admin/settings — returns all settings as { key: value }
export async function GET() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.siteSettings.findMany();
  const settings: Record<string, string | null> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

// PATCH /api/admin/settings — upsert a batch of settings
// Body: { settings: { key: string; value: string | null }[] }
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { settings: { key: string; value: string | null; label?: string; group?: string }[] };
  if (!Array.isArray(body.settings)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await Promise.all(
    body.settings.map((s) =>
      prisma.siteSettings.upsert({
        where: { key: s.key },
        create: {
          key: s.key,
          value: s.value,
          label: s.label ?? s.key,
          group: s.group ?? "general",
          updatedBy: session.user.id,
        },
        update: {
          value: s.value,
          updatedBy: session.user.id,
        },
      })
    )
  );

  // Revalidate all public pages that consume settings
  revalidatePath("/", "layout");   // root layout — covers navbar PromoBar
  revalidatePath("/");             // homepage hero + offer section
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/policies/returns");
  revalidatePath("/policies/shipping");
  revalidatePath("/policies/privacy");
  revalidatePath("/policies/terms");
  revalidatePath("/policies/cookies");

  return NextResponse.json({ success: true });
}
