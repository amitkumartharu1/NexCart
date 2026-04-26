"use client";

/**
 * ForgotPasswordForm — 3-step OTP password reset
 *
 * Step 1: Enter email → POST /api/auth/forgot-password (sends OTP)
 * Step 2: Enter 6-digit OTP → POST /api/auth/verify-otp (returns resetToken)
 * Step 3: Enter new password → POST /api/auth/reset-password
 */

import { useState, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";

type Step = "email" | "otp" | "password" | "done";

const inputClass =
  "w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg " +
  "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [resending, setResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send OTP");
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setResending(true);
    setOtp(["", "", "", "", "", ""]);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setResending(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  function handleOtpKey(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpChange(index: number, value: string) {
    // Only accept digits; handle paste of full 6-digit OTP
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      // paste
      const arr = digits.slice(0, 6).split("");
      const next = [...otp];
      arr.forEach((d, i) => { next[index + i] = d; });
      setOtp(next.slice(0, 6));
      otpRefs.current[Math.min(index + arr.length, 5)]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid OTP");
      setResetToken(data.resetToken);
      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP verification failed");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Reset Password ────────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">Password Reset!</p>
          <p className="text-sm text-foreground-muted mt-1">
            Your password has been updated successfully.
          </p>
        </div>
        <button
          onClick={() => router.push("/auth/login")}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {(["email", "otp", "password"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : ["otp", "password", "done"].indexOf(step) > ["email", "otp", "password"].indexOf(s)
                  ? "bg-emerald-500 text-white"
                  : "bg-background-subtle text-foreground-muted border border-border"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className={`h-px w-8 ${["otp", "password", "done"].indexOf(step) > i ? "bg-emerald-500" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Step 1: Email ── */}
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <p className="text-sm text-foreground-muted mb-4">
              Enter your email address and we&apos;ll send you a 6-digit verification code.
            </p>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Send Verification Code"}
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ── */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div>
            <p className="text-sm text-foreground-muted mb-1">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold text-foreground mb-4">{email}</p>

            {/* OTP inputs */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  disabled={loading}
                  className="w-11 h-13 text-center text-lg font-bold bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring disabled:opacity-50"
                  style={{ height: "3.25rem" }}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify Code"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
              className="flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={11} /> Change email
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending}
              className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw size={11} className={resending ? "animate-spin" : ""} />
              {resending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </form>
      )}

      {/* ── Step 3: New Password ── */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-foreground-muted">
            Create a strong new password for your account.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                disabled={loading}
                className={`${inputClass} pl-9`}
              />
            </div>
            {password && password.length < 8 && (
              <p className="text-xs text-destructive mt-1">At least 8 characters required</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                disabled={loading}
                className={`${inputClass} pl-9`}
              />
            </div>
            {confirm && password !== confirm && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || password.length < 8 || password !== confirm}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}
