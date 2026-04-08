import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error",
};

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or has already been used.",
  OAuthAccountNotLinked:
    "This email is already associated with a different sign-in method. Please sign in with your original method.",
  OAuthSignin: "An error occurred while connecting with the OAuth provider.",
  OAuthCallback: "An error occurred during the OAuth callback.",
  AccountSuspended: "Your account has been suspended. Please contact support.",
  Default: "An unexpected error occurred during authentication.",
};

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <Link href="/" className="inline-block">
          <span className="text-3xl font-bold tracking-tight">
            Nex<span className="text-emerald-500">Cart</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold">Authentication Error</h1>
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to Sign In
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
