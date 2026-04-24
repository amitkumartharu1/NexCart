"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, User, ChevronDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    image?: string | null;
  };
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export function AdminHeader({ user }: Props) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 flex-shrink-0 border-b border-border bg-background flex items-center justify-between px-6">
      {/* Breadcrumb placeholder */}
      <div className="text-sm text-foreground-muted">
        <span className="text-foreground font-medium">Admin Panel</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-background-subtle transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-foreground leading-none">{user.name ?? "Admin"}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <ChevronDown size={14} className="text-foreground-muted" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-foreground-muted truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
