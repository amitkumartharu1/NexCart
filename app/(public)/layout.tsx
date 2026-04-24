import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
    </>
  );
}

function FooterSkeleton() {
  return (
    <footer className="bg-background-subtle border-t border-border mt-auto">
      <div className="container-wide py-16">
        <div className="h-40 animate-pulse bg-border/30 rounded-xl" />
      </div>
    </footer>
  );
}
