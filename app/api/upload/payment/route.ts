/**
 * POST /api/upload/payment
 * Authenticated users can upload a payment proof screenshot.
 * Returns { url } — the public URL of the uploaded image.
 * Uses Cloudinary if configured, falls back to local /public/uploads/payments/
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary.server";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg":  ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, WebP images are allowed" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // ── Cloudinary ──────────────────────────────────────────────────────────────
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadImage(buffer, "nexcart/payments", { maxWidth: 1200, maxHeight: 1600 });
      return NextResponse.json({ url: result.url }, { status: 201 });
    } catch (err) {
      console.error("[upload/payment] Cloudinary error:", err);
      // Fall through to local
    }
  }

  // ── Local storage fallback ──────────────────────────────────────────────────
  try {
    const ext = EXT[file.type] ?? ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const dir = join(process.cwd(), "public", "uploads", "payments");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);
    return NextResponse.json({ url: `/uploads/payments/${filename}` }, { status: 201 });
  } catch (err) {
    console.error("[upload/payment] Local error:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
