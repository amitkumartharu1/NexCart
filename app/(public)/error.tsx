"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-foreground-muted text-sm">
            We couldn&apos;t load this page. Please try again.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            <RefreshCw size={13} />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            <Home size={13} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
