"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { registerAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, initialState);
  const [signingIn, setSigningIn] = useState(false);

  // Capture credentials locally so we can auto-sign-in after server action succeeds
  const credsRef = useRef<{ email: string; password: string } | null>(null);

  // Intercept form submit to capture values before server action runs
  function handleBeforeSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    credsRef.current = {
      email:    (fd.get("email")    as string) ?? "",
      password: (fd.get("password") as string) ?? "",
    };
  }

  // After account created: auto sign-in → home page
  useEffect(() => {
    if (!state.success) return;
    const creds = credsRef.current;
    setSigningIn(true);

    if (creds?.email && creds?.password) {
      signIn("credentials", {
        email:    creds.email,
        password: creds.password,
        redirect: false,
      }).then((res) => {
        window.location.href = res?.ok ? "/" : "/auth/login?registered=1";
      }).catch(() => {
        window.location.href = "/auth/login?registered=1";
      });
    } else {
      window.location.href = "/auth/login?registered=1";
    }
  }, [state.success]);

  const showLoading = isPending || signingIn;

  return (
    <form action={action} onSubmit={handleBeforeSubmit} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {signingIn && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Account created! Signing you in…
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            disabled={showLoading}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
            placeholder="John"
          />
          {state.fieldErrors?.firstName && (
            <p className="text-xs text-destructive">{state.fieldErrors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            disabled={showLoading}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
            placeholder="Doe"
          />
          {state.fieldErrors?.lastName && (
            <p className="text-xs text-destructive">{state.fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone number <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          disabled={showLoading}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          placeholder="+977 98XXXXXXXX"
        />
        {state.fieldErrors?.phone && (
          <p className="text-xs text-destructive">{state.fieldErrors.phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={showLoading}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          placeholder="you@example.com"
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          disabled={showLoading}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          placeholder="••••••••"
        />
        {state.fieldErrors?.password ? (
          <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Min 8 chars — uppercase, lowercase, number, special character
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={showLoading}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          placeholder="••••••••"
        />
        {state.fieldErrors?.confirmPassword && (
          <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={showLoading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {signingIn ? "Signing you in…" : isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <a href="/policies/terms" className="underline underline-offset-2">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/policies/privacy" className="underline underline-offset-2">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
