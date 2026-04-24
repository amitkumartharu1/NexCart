import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { uploadImage, deleteImage, extractPublicId, isCloudinaryConfigured } from "@/lib/cloudinary.server";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg":  ".jpg",
  "image/png":  ".png",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG and PNG are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 2 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  });

  let newUrl: string;

  // ── Cloudinary (when credentials are present) ────────────────────────────
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadImage(buffer, "nexcart/avatars", {
        maxWidth: 400,
        maxHeight: 400,
      });
      newUrl = result.url;

      // Remove old Cloudinary avatar
      if (existing?.image) {
        const oldId = extractPublicId(existing.image);
        if (oldId?.startsWith("nexcart/avatars/")) deleteImage(oldId).catch(() => {});
      }
    } catch (err) {
      console.error("[avatar] Cloudinary error:", err);
      // Fall through to local storage
      newUrl = await saveLocal(buffer, file.type);
    }
  } else {
    // ── Local storage fallback ─────────────────────────────────────────────
    newUrl = await saveLocal(buffer, file.type);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: newUrl },
  });

  return NextResponse.json({ url: newUrl }, { status: 200 });
}

async function saveLocal(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = EXT_MAP[mimeType] ?? ".jpg";
  const filename = `${randomUUID()}${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/avatars/${filename}`;
}
