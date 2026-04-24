import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Blog — NexCart" };

export default function BlogPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="bg-background-subtle border-b border-border">
        <div className="container-wide py-16 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
            <BookOpen size={24} className="text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Blog</h1>
          <p className="text-foreground-muted max-w-xl mx-auto">
            Tips, guides, and news from the NexCart team.
          </p>
        </div>
      </div>

      <div className="container-wide py-24 text-center">
        <div className="max-w-md mx-auto space-y-5">
          <div className="text-6xl">✍️</div>
          <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-foreground-muted">
            We&apos;re working on some great content. Check back soon for articles, guides, and product news.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
