import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/homepage
 * Returns all dynamic homepage CMS data: founder, motive, team, suppliers.
 * Public — no auth required.
 * Cached at edge for 60s; revalidated when admin saves settings.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const [settingsRows, teamMembers, suppliers] = await Promise.all([
      prisma.siteSettings.findMany({
        where: {
          key: {
            in: [
              "section_founder_enabled",
              "founder_name",
              "founder_role",
              "founder_bio",
              "founder_vision",
              "founder_image",
              "section_motive_enabled",
              "motive_title",
              "motive_description",
              "motive_points",
              "section_team_enabled",
              "section_suppliers_enabled",
            ],
          },
        },
        select: { key: true, value: true },
      }),
      prisma.teamMember.findMany({
        where:   { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      prisma.supplier.findMany({
        where:   { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
    ]);

    const s = Object.fromEntries(settingsRows.map((r) => [r.key, r.value ?? ""]));

    return NextResponse.json({
      founder: {
        enabled:  s["section_founder_enabled"]  !== "false",
        name:     s["founder_name"]    || "",
        role:     s["founder_role"]    || "",
        bio:      s["founder_bio"]     || "",
        vision:   s["founder_vision"]  || "",
        image:    s["founder_image"]   || "",
      },
      motive: {
        enabled:     s["section_motive_enabled"] !== "false",
        title:       s["motive_title"]       || "Why NexCart?",
        description: s["motive_description"] || "",
        points:      (() => {
          try { return JSON.parse(s["motive_points"] || "[]"); } catch { return []; }
        })(),
      },
      team: {
        enabled: s["section_team_enabled"] !== "false",
        members: teamMembers,
      },
      suppliers: {
        enabled:   s["section_suppliers_enabled"] !== "false",
        suppliers: suppliers,
      },
    });
  } catch (err) {
    console.error("[homepage] error:", err);
    return NextResponse.json({
      founder:   { enabled: false, name: "", role: "", bio: "", vision: "", image: "" },
      motive:    { enabled: false, title: "", description: "", points: [] },
      team:      { enabled: false, members: [] },
      suppliers: { enabled: false, suppliers: [] },
    });
  }
}
