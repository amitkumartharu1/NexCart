import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const rows = await prisma.$queryRaw<RawSection[]>`
      SELECT ps.*
      FROM product_sections ps
      INNER JOIN products p ON p.id = ps."productId"
      WHERE p.slug = ${slug}
        AND p.status = 'ACTIVE'
        AND ps."isVisible" = true
      ORDER BY ps."sortOrder" ASC
    `;
    return NextResponse.json({ sections: rows.map(toSection) });
  } catch (err) {
    console.error("[/api/products/[slug]/sections]", err);
    return NextResponse.json({ sections: [] });
  }
}
