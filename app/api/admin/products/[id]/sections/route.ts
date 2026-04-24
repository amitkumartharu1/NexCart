import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from "crypto";

const ALLOWED = new Set(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

async function guard() {
  const session = await auth();
  if (!session?.user || !ALLOWED.has(session.user.role ?? "")) return null;
  return session;
}

// Column names are camelCase in the DB (Prisma default, no @map on fields)
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const rows = await prisma.$queryRaw<RawSection[]>`
      SELECT * FROM product_sections
      WHERE "productId" = ${id}
      ORDER BY "sortOrder" ASC
    `;
    return NextResponse.json({ sections: rows.map(toSection) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/products/sections GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();

    const [{ next_order }] = await prisma.$queryRaw<[{ next_order: number }]>`
      SELECT COALESCE(MAX("sortOrder"), -1) + 1 AS next_order
      FROM product_sections WHERE "productId" = ${id}
    `;
    const sortOrder = Number(next_order);

    const newId = randomUUID();
    const type: string        = body.type      ?? "image_banner";
    const mode: string        = body.mode      ?? "static";
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
      INSERT INTO product_sections (
        "id", "productId", "type", "mode", "sortOrder", "isVisible",
        "title", "subtitle", "body", "assetUrl", "assetType",
        "ctaText", "ctaUrl", "ctaStyle", "settings", "createdAt", "updatedAt"
      ) VALUES (
        ${newId}, ${id}, ${type}, ${mode}, ${sortOrder}, ${isVisible},
        ${title}, ${subtitle}, ${bodyText}, ${assetUrl}, ${assetType},
        ${ctaText}, ${ctaUrl}, ${ctaStyle},
        ${settingsJson}::jsonb,
        NOW(), NOW()
      ) RETURNING *
    `;
    return NextResponse.json({ section: toSection(row) }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[admin/products/sections POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
