"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, Heart, BookOpen, MapPin, Settings, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "My Profile", href: "/dashboard/profile", icon: User },
  { label: "My Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Bookings", href: "/dashboard/bookings", icon: BookOpen },
  { label: "Addresses", href: "/dashboard/addresses", icon: MapPin },
  { label: "Support", href: "/dashboard/tickets", icon: LifeBuoy },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface Props {
  user: { name?: string | null; email?: string | null; role: string };
}

export function DashboardSidebar({ user }: Props) {
  const pathname = usePathname();
  return (
    <aside className="w-full md:w-60 flex-shrink-0">
      {/* User card */}
      <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-background border border-border">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
          {user.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{user.name ?? "User"}</p>
          <p className="text-xs text-foreground-muted truncate">{user.email}</p>
        </div>
      </div>
      <nav className="space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
            )}
          >
            <Icon size={15} className="flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
