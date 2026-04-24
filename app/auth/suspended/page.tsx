import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata = { title: "Account Suspended — NexCart" };

export default function AccountSuspendedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert size={36} className="text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-foreground-muted text-sm leading-relaxed">
            Your account has been suspended. This may be due to a violation of our terms of service
            or other policy issues.
          </p>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-foreground-muted">
          If you believe this is a mistake, please contact our support team with your account details
          and we will review your case promptly.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Contact Support
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground-muted hover:text-foreground hover:border-border-strong transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
