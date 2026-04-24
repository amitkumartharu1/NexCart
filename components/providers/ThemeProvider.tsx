"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects an inline <script> for anti-FOUC. React 19 (dev mode only)
// emits a console.error when it encounters any <script> in the component render
// tree. This is a known upstream issue — the theme works correctly in production.
// Suppress the false-positive so it doesn't pollute the dev console.
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "development"
) {
  const _origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag")
    ) {
      return;
    }
    _origError(...args);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
