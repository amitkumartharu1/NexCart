/**
 * Cloudinary server-only utilities.
 * Import ONLY from API routes and Server Components — never from client code.
 */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key:    process.env.CLOUDINARY_API_KEY    ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  secure: true,
});

export { cloudinary };

/** Returns true only when all three Cloudinary env vars are present. */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a Buffer to Cloudinary.
 * @param buffer  Raw file bytes
 * @param folder  Cloudinary folder, e.g. "nexcart/products"
 * @param opts    Optional image constraints
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string,
  opts: { maxWidth?: number; maxHeight?: number } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const transformation: Record<string, unknown>[] = [
      { quality: "auto", fetch_format: "auto" },
    ];

    if (opts.maxWidth ?? opts.maxHeight) {
      transformation.unshift({
        width:  opts.maxWidth  ?? 1600,
        height: opts.maxHeight ?? 1600,
        crop:   "limit",
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width,
          height:   result.height,
          format:   result.format,
          bytes:    result.bytes,
        });
      }
    );

    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Silently ignores errors so a missing asset never breaks a UI action.
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // non-fatal — log in production but don't throw
    console.warn(`[Cloudinary] Failed to delete asset: ${publicId}`);
  }
}

/**
 * Parse the Cloudinary public_id from a secure_url.
 *
 * Example URL:
 *   https://res.cloudinary.com/mycloud/image/upload/v1234/nexcart/products/img.jpg
 * Returns: "nexcart/products/img"   (no extension)
 */
export function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
