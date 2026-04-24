"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Save, User, Camera, Loader2 } from "lucide-react";

const inputCls =
  "w-full px-4 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring";
const disabledInputCls =
  "w-full px-4 py-2.5 text-sm bg-background-subtle border border-border rounded-lg text-foreground-muted cursor-not-allowed";

const AVATAR_ALLOWED = ["image/jpeg", "image/jpg", "image/png"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState<ProfileData>({ firstName: "", lastName: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/dashboard/profile")
      .then((r) => r.json())
      .then(
        (data: {
          user: {
            firstName: string | null;
            lastName: string | null;
            phone: string | null;
            image: string | null;
          };
        }) => {
          setForm({
            firstName: data.user?.firstName ?? "",
            lastName:  data.user?.lastName  ?? "",
            phone:     data.user?.phone     ?? "",
          });
          setAvatarUrl(data.user?.image ?? null);
        }
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Keep avatarUrl in sync if session.user.image is updated externally
  useEffect(() => {
    if (session?.user?.image && !avatarUrl) {
      setAvatarUrl(session.user.image);
    }
  }, [session?.user?.image, avatarUrl]);

  function set(key: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Avatar upload ──────────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
    if (!file) return;

    if (!AVATAR_ALLOWED.includes(file.type)) {
      toast.error("Only JPEG and PNG images are allowed");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Image must be smaller than 2 MB");
      return;
    }

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);
    setUploadingAvatar(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setAvatarUrl(data.url!);
      URL.revokeObjectURL(localUrl);
      // Sync to next-auth session so Navbar shows updated avatar immediately
      await update({ image: data.url });
      toast.success("Profile photo updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
      // Revert to previous
      setAvatarUrl(session?.user?.image ?? null);
      URL.revokeObjectURL(localUrl);
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ── Profile form ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json() as { user: { name: string | null } };
      await update({ name: data.user.name });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = (
    form.firstName?.[0] ??
    session?.user?.name?.[0] ??
    "U"
  ).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Manage your account information
        </p>
      </div>

      <div className="bg-background rounded-xl border border-border p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          {/* Clickable avatar */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold overflow-hidden ring-2 ring-border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                initials || <User size={24} />
              )}
            </div>

            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            >
              {uploadingAvatar ? (
                <Loader2 size={18} className="text-white animate-spin" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <p className="font-semibold text-foreground">{session?.user?.name}</p>
            <p className="text-sm text-foreground-muted">{session?.user?.email}</p>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
              {session?.user?.role
                ? session.user.role.charAt(0) + session.user.role.slice(1).toLowerCase()
                : "Customer"}
            </span>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="mt-1.5 block text-xs text-primary hover:underline disabled:opacity-50"
            >
              {uploadingAvatar ? "Uploading…" : "Change photo"}
            </button>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              JPEG or PNG, max 2 MB
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 max-w-lg animate-pulse">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-background-subtle rounded-lg" />
              <div className="h-10 bg-background-subtle rounded-lg" />
            </div>
            <div className="h-10 bg-background-subtle rounded-lg" />
            <div className="h-10 bg-background-subtle rounded-lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="John"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Doe"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={session?.user?.email ?? ""}
                disabled
                className={disabledInputCls}
              />
              <p className="text-xs text-foreground-muted mt-1">
                Email cannot be changed here
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+977 98XXXXXXXX"
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
