"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function BillPrintToolbar() {
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";

  useEffect(() => {
    if (autoPrint) {
      // Small delay to ensure the page content is fully rendered
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="no-print flex items-center gap-3 mb-6 p-4 bg-background border-b border-border">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg text-foreground-muted hover:text-foreground"
      >
        ← Back
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
      >
        🖨 Print
      </button>
      <span className="text-sm text-foreground-muted">
        Use your browser&apos;s &quot;Save as PDF&quot; option in the print dialog to download as PDF.
      </span>
    </div>
  );
}
