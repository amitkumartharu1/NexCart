import Link from "next/link";
import { Plus, RefreshCw, Eye, Download } from "lucide-react";

const ACTIONS = [
  { label: "Add Product", href: "/admin/products/new", icon: Plus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "View Orders", href: "/admin/orders", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Restock Items", href: "/admin/products/inventory", icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "View Store", href: "/", icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function AdminQuickActions() {
  return (
    <div className="bg-background rounded-xl border border-border p-5 h-full">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {ACTIONS.map(({ label, href, icon: Icon, color, bg }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-subtle transition-colors group"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={15} className={color} />
            </div>
            <span className="text-sm font-medium text-foreground-muted group-hover:text-foreground transition-colors">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
