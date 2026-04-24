import Link from "next/link";
import { FileText, BookOpen, HelpCircle, Search } from "lucide-react";

const SECTIONS = [
  { title: "Banners", desc: "Manage promotional banners across the site", href: "/admin/banners", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Blog Posts", desc: "Create and manage blog articles", href: "#", icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
  { title: "FAQs", desc: "Manage frequently asked questions", href: "#", icon: HelpCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "SEO", desc: "Meta titles, descriptions, and keywords", href: "/admin/seo", icon: Search, color: "text-orange-500", bg: "bg-orange-500/10" },
];

export const metadata = { title: "Content — Admin | NexCart" };

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
        <p className="text-sm text-foreground-muted mt-1">Manage your store&apos;s content</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ title, desc, href, icon: Icon, color, bg }) => (
          <Link key={title} href={href}
            className="flex items-start gap-4 p-5 bg-background rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all group">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
              <p className="text-sm text-foreground-muted mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
