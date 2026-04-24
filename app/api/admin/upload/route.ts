import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary.server";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg":  ".jpg",
  "image/png":  ".png",
  "image/webp": ".webp",
};

function requireAdmin(role: string) {
  return ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(role);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5 MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Allow caller to specify the Cloudinary folder (default: nexcart/products)
  const folder = (formData.get("folder") as string | null) ?? "nexcart/products";

  // ── Cloudinary (when credentials are present) ────────────────────────────
  if (isCloudinaryConfigured()) {
    try {
      const result = await uploadImage(buffer, folder, {
        maxWidth: 1600,
        maxHeight: 1600,
      });
      return NextResponse.json({ url: result.url, publicId: result.publicId }, { status: 201 });
    } catch (err) {
      console.error("[upload] Cloudinary error:", err);
      // Fall through to local storage on Cloudinary failure
    }
  }

  // ── Local storage fallback ───────────────────────────────────────────────
  try {
    const ext = EXT_MAP[file.type] ?? extname(file.name).toLowerCase() ?? ".jpg";
    const filename = `${randomUUID()}${ext}`;
    const subfolder = folder.replace(/^nexcart\//, "") || "products";
    const uploadDir = join(process.cwd(), "public", "uploads", subfolder);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);
    return NextResponse.json({ url: `/uploads/${subfolder}/${filename}` }, { status: 201 });
  } catch (err) {
    console.error("[upload] Local storage error:", err);
    return NextResponse.json({ error: "Image upload failed. Please try again." }, { status: 500 });
  }
}
