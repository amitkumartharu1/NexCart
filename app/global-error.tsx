"use client";

// global-error.tsx — catches errors in the root layout itself.
// Must include <html><body> because the root layout is unavailable.
// NO context providers here — they may be the source of the error.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[NexCart] Global error:", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: 32,
              }}
            >
              ⚠️
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111", margin: "0 0 0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
              An unexpected error occurred.
              {error.digest && (
                <>
                  <br />
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>
                    Error ID: {error.digest}
                  </span>
                </>
              )}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: 12,
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: 12,
                  background: "#f3f4f6",
                  color: "#374151",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
