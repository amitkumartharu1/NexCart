/**
 * Password hashing and verification.
 * Supports argon2 (recommended) and bcrypt (fallback).
 * Algorithm is selected via PASSWORD_HASH_ALGORITHM env var.
 *
 * Server-only — never import in client components.
 */

const ALGORITHM =
  (process.env.PASSWORD_HASH_ALGORITHM ?? "argon2") as "argon2" | "bcrypt";

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
    const argon2 = await import("argon2");
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  // Fallback: bcrypt
  const bcrypt = await import("bcryptjs");
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // Argon2 hashes start with $argon2
    if (hash.startsWith("$argon2")) {
      const argon2 = await import("argon2");
      return argon2.verify(hash, password);
    }
    // bcrypt hashes start with $2b or $2a
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(password, hash);
  } catch {
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
