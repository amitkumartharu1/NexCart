/**
 * Type-safe environment variable access.
 * Throws early if required server-side vars are missing, preventing
 * silent failures at runtime.
 *
 * Only use getServerEnv() in server components, API routes, and server actions.
 * Never import this in client components.
 */

export function getServerEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Check your .env file and refer to .env.example for guidance.`
    );
  }
  return value;
}

export function getServerEnvOptional(key: string): string | undefined {
  return process.env[key] || undefined;
}

// Pre-validated server environment — import from here in server code
export const serverEnv = {
  databaseUrl: () => getServerEnv("DATABASE_URL"),
  authSecret: () => getServerEnv("AUTH_SECRET"),
  stripeSecretKey: () => getServerEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: () => getServerEnv("STRIPE_WEBHOOK_SECRET"),
  storageProvider: () =>
    (process.env.STORAGE_PROVIDER ?? "local") as "local" | "cloudinary" | "s3",
  cloudinaryCloudName: () => getServerEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: () => getServerEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: () => getServerEnv("CLOUDINARY_API_SECRET"),
  seedAdminEmail: () => getServerEnv("SEED_ADMIN_EMAIL"),
  seedAdminPassword: () => getServerEnv("SEED_ADMIN_PASSWORD"),
  hashAlgorithm: () =>
    (process.env.PASSWORD_HASH_ALGORITHM ?? "argon2") as "argon2" | "bcrypt",
  passwordResetExpiryHours: () =>
    parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS ?? "2", 10),
};

// Public (client-safe) env values — these are read from NEXT_PUBLIC_ vars
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "NexCart",
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "Smart Shopping. Modern Services. One Premium Platform.",
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? "USD",
  currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL ?? "$",
  locale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en-US",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
};
