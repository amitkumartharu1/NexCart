import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ banners });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { title, subtitle, image, mobileImage, position, isActive, link, sortOrder, ctaText, description, startsAt, endsAt } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const banner = await prisma.banner.create({
    data: {
      title: title.trim(),
      subtitle: subtitle ?? null,
      description: description ?? null,
      image: image ?? "",
      mobileImage: mobileImage ?? null,
      position: position ?? "HERO",
      isActive: isActive ?? true,
      link: link ?? null,
      ctaText: ctaText ?? null,
      sortOrder: sortOrder ?? 0,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  });
  revalidatePath("/");
  return NextResponse.json({ banner }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...raw } = body;
  if (!id) return NextResponse.json({ error: "Missing banner id" }, { status: 400 });

  // Whitelist only valid Banner fields to prevent Prisma errors
  const ALLOWED_FIELDS = [
    "title", "subtitle", "description", "image", "mobileImage",
    "link", "ctaText", "position", "isActive", "sortOrder",
    "startsAt", "endsAt",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in raw) {
      // Convert ISO date strings to Date objects
      if ((key === "startsAt" || key === "endsAt") && raw[key]) {
        data[key] = new Date(raw[key] as string);
      } else if ((key === "startsAt" || key === "endsAt") && raw[key] === null) {
        data[key] = null;
      } else {
        data[key] = raw[key];
      }
    }
  }

  const banner = await prisma.banner.update({ where: { id }, data });
  revalidatePath("/");
  return NextResponse.json({ banner });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await req.json();
  await prisma.banner.delete({ where: { id } });
  revalidatePath("/");
  return NextResponse.json({ success: true });
}
