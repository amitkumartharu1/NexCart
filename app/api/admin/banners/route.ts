import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export async function GET() {
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
  const { title, subtitle, image, position, isActive, link, sortOrder, ctaText, description } = await req.json();
  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle,
      description,
      image: image ?? "",
      position: position ?? "HERO",
      isActive: isActive ?? true,
      link,
      ctaText,
      sortOrder: sortOrder ?? 0,
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
  const { id, ...data } = await req.json();
  // Map imageUrl → image, linkUrl → link if passed from older form
  if (data.imageUrl !== undefined) { data.image = data.imageUrl; delete data.imageUrl; }
  if (data.linkUrl !== undefined) { data.link = data.linkUrl; delete data.linkUrl; }
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
