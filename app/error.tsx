"use client";

// error.tsx — catches errors in child segments, rendered inside the root layout.
// Do NOT include <html><body> here — the layout already wraps this.

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NexCart] Page error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={36} className="text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-500 text-sm">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="block mt-1 text-xs font-mono text-gray-400">
                Error ID: {error.digest}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            <Home size={14} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
