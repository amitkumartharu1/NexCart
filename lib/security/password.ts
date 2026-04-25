/**
 * Password hashing and verification.
 * Supports argon2 (recommended) and bcrypt (fallback).
 * Algorithm is selected via PASSWORD_HASH_ALGORITHM env var.
 *
 * Server-only — never import in client components.
 */

// Default to bcryptjs — argon2 requires a native binary not included in package.json.
// Set PASSWORD_HASH_ALGORITHM=argon2 only if you add argon2 to dependencies.
const ALGORITHM =
  (process.env.PASSWORD_HASH_ALGORITHM ?? "bcrypt") as "argon2" | "bcrypt";

// Minimum password requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and contain uppercase, lowercase, a number, and a special character.";

export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: PASSWORD_POLICY_MESSAGE };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  if (ALGORITHM === "argon2") {
    try {
      const argon2 = await import("argon2");
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch {
      // argon2 native module not available (common on Windows). Fall back to bcryptjs.
      console.warn("[Password] argon2 unavailable, falling back to bcryptjs");
    }
  }

  // bcryptjs — pure JS, works everywhere
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Argon2 hashes start with $argon2
  if (hash.startsWith("$argon2")) {
    try {
      const argon2 = await import("argon2");
      return await argon2.verify(hash, password);
    } catch (err) {
      // argon2 native module not available (Vercel / Windows).
      // This user's password cannot be verified — they must reset it.
      console.error(
        "[Password] Cannot verify argon2 hash — argon2 native module unavailable. " +
        "User must reset their password. Error:",
        err instanceof Error ? err.message : err
      );
      return false;
    }
  }

  // bcrypt hashes start with $2b or $2a
  try {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error("[Password] bcryptjs verify error:", err);
    return false;
  }
}

/**
 * Generate a cryptographically secure random token.
 * Uses Web Crypto API (works in Node.js, Edge, and browser).
 * Used for email verification and password reset.
 */
export function generateSecureToken(length = 48): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
