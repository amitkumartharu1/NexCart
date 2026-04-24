import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

async function guard() {
  const session = await auth();
  if (!session?.user || !ALLOWED.has(session.user.role ?? "")) return null;
  return session;
}

type RawSection = {
  id: string; productId: string; type: string; mode: string;
  sortOrder: number; isVisible: boolean;
  title: string | null; subtitle: string | null; body: string | null;
  assetUrl: string | null; assetType: string | null;
  ctaText: string | null; ctaUrl: string | null; ctaStyle: string | null;
  settings: unknown; createdAt: Date; updatedAt: Date;
};

function toSection(row: RawSection) {
  return {
    id: row.id, productId: row.productId, type: row.type, mode: row.mode,
    sortOrder: Number(row.sortOrder), isVisible: row.isVisible,
    title: row.title, subtitle: row.subtitle, body: row.body,
    assetUrl: row.assetUrl, assetType: row.assetType,
    ctaText: row.ctaText, ctaUrl: row.ctaUrl, ctaStyle: row.ctaStyle,
    settings: row.settings, createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sectionId } = await params;
  try {
    const body = await req.json();
    const type: string        = body.type;
    const mode: string        = body.mode;
    const sortOrder: number   = body.sortOrder ?? 0;
    const isVisible: boolean  = body.isVisible ?? true;
    const title: string | null    = body.title    ?? null;
    const subtitle: string | null = body.subtitle ?? null;
    const bodyText: string | null = body.body     ?? null;
    const assetUrl: string | null = body.assetUrl  ?? null;
    const assetType: string | null= body.assetType ?? null;
    const ctaText: string | null  = body.ctaText   ?? null;
    const ctaUrl: string | null   = body.ctaUrl    ?? null;
    const ctaStyle: string        = body.ctaStyle  ?? "primary";
    const settingsJson: string | null =
      body.settings != null ? JSON.stringify(body.settings) : null;

    const [row] = await prisma.$queryRaw<RawSection[]>`
      UPDATE product_sections SET
        "type"      = ${type},
        "mode"      = ${mode},
        "sortOrder" = ${sortOrder},
        "isVisible" = ${isVisible},
        "title"     = ${title},
        "subtitle"  = ${subtitle},
        "body"      = ${bodyText},
        "assetUrl"  = ${assetUrl},
        "assetType" = ${assetType},
        "ctaText"   = ${ctaText},
        "ctaUrl"    = ${ctaUrl},
        "ctaStyle"  = ${ctaStyle},
        "settings"  = ${settingsJson}::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = ${sectionId}
      RETURNING *
    `;
    return NextResponse.json({ section: toSection(row) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/sections PUT]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sectionId } = await params;
  try {
    await prisma.$executeRaw`DELETE FROM product_sections WHERE "id" = ${sectionId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/sections DELETE]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
