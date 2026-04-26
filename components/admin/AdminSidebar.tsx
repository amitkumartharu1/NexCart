"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  Tag, Layers, Star, TicketPercent, FileText, Image,
  Wrench, BarChart3, Shield, ChevronDown, ChevronRight,
  RefreshCw, BookOpen, MessageSquare, Globe, Quote,
  Phone, Building2, Home,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF";

type LucideIcon = React.FC<{ size?: number; className?: string }>;

interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  roles: UserRole[];
  children?: { label: string; href: string; roles: UserRole[] }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Products",
    icon: Package,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"],
    children: [
      { label: "All Products", href: "/admin/products", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
      { label: "Add Product", href: "/admin/products/new", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { label: "Categories", href: "/admin/categories", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { label: "Brands", href: "/admin/brands", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { label: "Inventory", href: "/admin/products/inventory", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
    ],
  },
  {
    label: "Services",
    icon: Wrench,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    children: [
      { label: "All Services", href: "/admin/services", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { label: "Bookings", href: "/admin/bookings", roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"] },
    ],
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Chat",
    href: "/admin/chat",
    icon: MessageSquare,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Testimonials",
    href: "/admin/testimonials",
    icon: Quote,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Contact",
    href: "/admin/contact",
    icon: Phone,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Coupons",
    href: "/admin/coupons",
    icon: TicketPercent,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    label: "Homepage",
    icon: Home,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
    children: [
      { label: "Sections",  href: "/admin/homepage",   roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { label: "Team",      href: "/admin/team",       roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
      { label: "Suppliers", href: "/admin/suppliers",  roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    roles: ["SUPER_ADMIN", "ADMIN"],
    children: [
      { label: "Banners",     href: "/admin/banners",     roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Blog",        href: "/admin/content",     roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "Navigation",  href: "/admin/navigation",  roles: ["SUPER_ADMIN", "ADMIN"] },
      { label: "SEO",         href: "/admin/seo",         roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Audit Logs",
    href: "/admin/logs",
    icon: Shield,
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

interface Props {
  role: string;
}

export function AdminSidebar({ role }: Props) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(["Products"]);

  const isAllowed = (roles: UserRole[]) => roles.includes(role as UserRole);

  const toggle = (label: string) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-background border-r border-border h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">N</div>
        <span className="font-bold text-base tracking-tight">
          Nex<span className="text-primary">Cart</span>
          <span className="ml-1.5 text-xs font-medium text-foreground-muted bg-background-subtle border border-border px-1.5 py-0.5 rounded-md">Admin</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.filter((item) => isAllowed(item.roles)).map((item) => {
          const Icon = item.icon;
          const isExpanded = expanded.includes(item.label);

          if (item.children) {
            const visibleChildren = item.children.filter((c) => isAllowed(c.roles));
            const isAnyChildActive = visibleChildren.some((c) => pathname.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isAnyChildActive
                      ? "text-primary bg-primary/10"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
                  )}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block px-3 py-1.5 rounded-lg text-sm transition-colors",
                          pathname === child.href
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "text-primary bg-primary/10 font-medium"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-subtle"
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground-muted hover:text-foreground hover:bg-background-subtle transition-colors"
        >
          <Globe size={16} />
          View Store
        </Link>
      </div>
    </aside>
  );
}
