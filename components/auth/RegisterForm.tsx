"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { registerAction } from "@/lib/auth/actions";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

export function RegisterForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState(registerAction, initialState);

  useEffect(() => {
    if (state.success) {
      // Redirect to login with success message
      router.push("/auth/login?registered=1");
    }
  }, [state.success, router]);

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
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
            disabled={isPending}
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
            disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
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
          disabled={isPending}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
          placeholder="••••••••"
        />
        {state.fieldErrors?.confirmPassword && (
          <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create account"}
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
