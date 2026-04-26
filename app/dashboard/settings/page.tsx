"use client";

import { useState } from "react";
import { KeyRound, Bell, Moon, Eye, EyeOff, Save, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  // Change Password
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Account Preferences
  const [emailNotifications, setEmailNotifications] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_email_notifications") !== "false";
    }
    return true;
  });
  const [orderUpdates, setOrderUpdates] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_order_updates") !== "false";
    }
    return true;
  });
  const [promotions, setPromotions] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pref_promotions") === "true";
    }
    return false;
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/dashboard/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update password");
      toast.success("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const savePreferences = () => {
    localStorage.setItem("pref_email_notifications", String(emailNotifications));
    localStorage.setItem("pref_order_updates", String(orderUpdates));
    localStorage.setItem("pref_promotions", String(promotions));
    toast.success("Preferences saved");
  };

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/dashboard/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete account");
      toast.success("Account deleted. Goodbye!");
      await signOut({ callbackUrl: "/" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Manage your account security and preferences
        </p>
      </div>

      {/* Change Password */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Change Password</h2>
            <p className="text-xs text-foreground-muted">
              Use a strong password with at least 8 characters
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                required
                className={cn(inputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className={cn(inputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwords.newPassword && passwords.newPassword.length < 8 && (
              <p className="text-xs text-red-500 mt-1">
                At least 8 characters required
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              required
              className={inputClass}
            />
            {passwords.confirmPassword &&
              passwords.newPassword !== passwords.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {savingPassword ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Account Preferences */}
      <div className="bg-background rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Bell size={16} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Account Preferences
            </h2>
            <p className="text-xs text-foreground-muted">
              Manage how we communicate with you
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleRow
            label="Email Notifications"
            description="Receive account and security emails"
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
          <ToggleRow
            label="Order Updates"
            description="Get notified about your order status"
            checked={orderUpdates}
            onChange={setOrderUpdates}
          />
          <ToggleRow
            label="Promotions & Offers"
            description="Be the first to hear about deals and discounts"
            checked={promotions}
            onChange={setPromotions}
          />
        </div>

        <button
          onClick={savePreferences}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
        >
          <Save size={14} />
          Save Preferences
        </button>
      </div>

      {/* Dark Mode Info */}
      <div className="bg-background-subtle rounded-xl border border-border p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
          <Moon size={16} className="text-foreground-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Dark Mode</p>
          <p className="text-xs text-foreground-muted mt-0.5">
            Dark mode follows your system preference. You can toggle it using the
            theme switcher in the top navigation bar.
          </p>
        </div>
      </div>

      {/* Danger Zone — Delete Account */}
      <div className="bg-background rounded-xl border border-destructive/40 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 size={16} className="text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Danger Zone</h2>
            <p className="text-xs text-foreground-muted">
              Irreversible actions — proceed with caution
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Delete My Account</p>
              <p className="text-xs text-foreground-muted mt-1 max-w-sm">
                Permanently removes your account, profile, reviews, cart, and wishlist.
                Orders are anonymized for financial records. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive text-destructive text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <Trash2 size={13} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Delete Account</h3>
                <p className="text-xs text-foreground-muted">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm your password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Type <strong className="text-destructive">DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteConfirmText(""); }}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-background-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== "DELETE" || !deletePassword}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deletingAccount ? "Deleting…" : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0",
          checked ? "bg-primary" : "bg-border"
        )}
        style={{ height: "1.375rem", width: "2.5rem" }}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
            checked ? "translate-x-[1.125rem]" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
