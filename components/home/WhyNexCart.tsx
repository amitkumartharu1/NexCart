import { ShieldCheck, Truck, RefreshCw, Headphones, Star, Zap } from "lucide-react";

const FEATURES = [
  { icon: Truck, title: "Free Shipping", description: "Free delivery on all orders over $100. Express options available.", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: ShieldCheck, title: "Secure Payments", description: "Bank-level encryption on every transaction. Your data is always safe.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: RefreshCw, title: "Easy Returns", description: "30-day hassle-free returns on all products. No questions asked.", color: "text-purple-500", bg: "bg-purple-500/10" },
  { icon: Headphones, title: "24/7 Support", description: "Real humans ready to help around the clock via chat, email, or call.", color: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: Star, title: "Verified Reviews", description: "Every review is from a verified purchase — no fake ratings.", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: Zap, title: "Fast Processing", description: "Orders confirmed and dispatched within 24 hours on business days.", color: "text-red-500", bg: "bg-red-500/10" },
];

export function WhyNexCart() {
  return (
    <section className="py-20 bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Why Us</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for Your Confidence</h2>
          <p className="mt-3 text-foreground-muted">
            Every decision we make is designed to give you the best possible experience — from browsing to delivery.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
            <div key={title} className="flex gap-4 p-5 rounded-2xl bg-background-subtle border border-border hover:border-border-strong transition-colors">
              <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-foreground-muted mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
