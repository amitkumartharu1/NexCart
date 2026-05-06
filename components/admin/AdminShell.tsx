"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface Props {
  role: string;
  user: {
    name?: string | null;
    email?: string | null;
    role: string;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AdminShell({ role, user, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change (mobile nav)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── hidden off-screen on mobile, always visible md+ ── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          "md:relative md:z-auto md:translate-x-0 md:flex md:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AdminSidebar role={role} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background-subtle">
          {children}
        </main>
      </div>
    </div>
  );
}
