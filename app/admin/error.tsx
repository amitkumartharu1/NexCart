"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
        </div>
        <div>
          <p className="font-semibold text-foreground">Failed to load</p>
          <p className="text-sm text-foreground-muted mt-1">
            {error.digest ? `Error ID: ${error.digest}` : "An unexpected error occurred."}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    </div>
  );
}
