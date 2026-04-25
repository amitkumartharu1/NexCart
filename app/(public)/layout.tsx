import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { PromoPopup } from "@/components/chat/PromoPopup";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<FooterSkeleton />}>
        <Footer />
      </Suspense>
      {/* AI Chat Widget — floating bubble (bottom-right) */}
      <ChatWidget />
      {/* Promo Popup — psychology-based offer popup */}
      <PromoPopup />
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
