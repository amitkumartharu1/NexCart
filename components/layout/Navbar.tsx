"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Search, Menu, X, User, Heart, ChevronDown, Package } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Services", href: "/services" },
  { label: "Categories", href: "/categories" },
  { label: "Brands", href: "/brands" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, []);

  const isAdmin = session?.user?.role &&
    ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF"].includes(session.user.role);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container-wide">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-bold tracking-tight">
              Nex<span className="text-primary">Cart</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground rounded-lg hover:bg-accent transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1">
            {/* Search */}
            <Link
              href="/search"
              className="p-2.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={18} />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
              {/* Cart badge — wired to store in Phase 6 */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Link>

            {/* User menu */}
            {session ? (
              <div className="relative ml-1">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                    {session.user?.name?.[0] ?? session.user?.email?.[0] ?? "U"}
                  </span>
                  <ChevronDown size={14} className={cn("transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-52 card-premium z-20 py-1 text-sm">
                      <div className="px-3 py-2 border-b border-border">
                        <p className="font-medium truncate">{session.user?.name}</p>
                        <p className="text-xs text-foreground-muted truncate">{session.user?.email}</p>
                      </div>
                      <Link href="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User size={14} /> My Account
                      </Link>
                      <Link href="/dashboard/orders" className="flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Package size={14} /> My Orders
                      </Link>
                      {isAdmin && (
                        <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-primary hover:bg-primary-subtle transition-colors" onClick={() => setUserMenuOpen(false)}>
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors">
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <Link href="/cart" className="relative p-2.5 rounded-lg text-foreground-muted" aria-label="Cart">
              <ShoppingCart size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </Link>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2.5 rounded-lg text-foreground-muted hover:bg-accent transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <nav className="container-wide py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-3 mt-3 space-y-1">
              {session ? (
                <>
                  <Link href="/dashboard/profile" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setMobileOpen(false)}>My Account</Link>
                  {isAdmin && <Link href="/admin/dashboard" className="block px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary-subtle rounded-lg" onClick={() => setMobileOpen(false)}>Admin Panel</Link>}
                  <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} className="w-full text-left px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-3 py-2.5 text-sm font-medium hover:bg-accent rounded-lg" onClick={() => setMobileOpen(false)}>Sign in</Link>
                  <Link href="/auth/register" className="block px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary-subtle rounded-lg" onClick={() => setMobileOpen(false)}>Create account</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
