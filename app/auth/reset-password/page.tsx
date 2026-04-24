"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      toast.success("Password reset successfully");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-foreground-muted">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="text-primary hover:underline text-sm mt-2 inline-block">Request new reset link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input type={show ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="w-full pl-9 pr-10 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input type={show ? "text" : "password"} required value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50">
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background-subtle">
      <div className="w-full max-w-sm bg-background rounded-2xl border border-border shadow-sm p-8">
        <div className="text-center mb-6">
          <Link href="/" className="text-xl font-bold">Nex<span className="text-primary">Cart</span></Link>
          <h1 className="text-xl font-bold text-foreground mt-4">Reset Password</h1>
          <p className="text-sm text-foreground-muted mt-1">Enter your new password below</p>
        </div>
        <Suspense fallback={<div className="h-32 animate-pulse bg-background-subtle rounded-xl" />}>
          <ResetPasswordForm />
        </Suspense>
        <div className="mt-4 text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
