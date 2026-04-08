import { Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Sarah M.", role: "Verified Buyer", body: "Absolutely love my new headphones. The quality is exceptional and delivery was faster than expected. NexCart is my go-to now.", rating: 5, avatar: "SM", product: "Wireless Pro Headphones" },
  { name: "James K.", role: "Verified Buyer", body: "The repair service was outstanding. My laptop was fixed in 2 hours and works like new. The technician was professional and knowledgeable.", rating: 5, avatar: "JK", product: "Device Repair Service" },
  { name: "Priya R.", role: "Verified Buyer", body: "Great selection of products with competitive pricing. The comparison feature helped me make the right choice. Highly recommended!", rating: 5, avatar: "PR", product: "Smart Watch Ultra" },
  { name: "Tom W.", role: "Verified Buyer", body: "Ordered a gaming setup and everything arrived perfectly packaged. Customer support was incredibly helpful when I had a question.", rating: 5, avatar: "TW", product: "Gaming Mouse Pro" },
  { name: "Nina S.", role: "Verified Buyer", body: "The consultation service saved me hours of research. The specialist knew exactly what I needed and suggested the perfect solution.", rating: 5, avatar: "NS", product: "Tech Consultation" },
  { name: "Alex B.", role: "Verified Buyer", body: "Returns process was painless. Ordered the wrong size, contacted support, and had a replacement in 2 days. Impressive service.", rating: 5, avatar: "AB", product: "Smart Devices" },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-background-subtle overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Reviews</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1,2,3,4,5].map((s) => <Star key={s} size={18} className="fill-yellow-400 text-yellow-400" />)}
            <span className="text-sm font-semibold ml-1">4.9 / 5</span>
            <span className="text-sm text-foreground-muted">from 12,000+ reviews</span>
          </div>
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, role, body, rating, avatar, product }) => (
            <div key={name} className="card-premium p-6 space-y-4">
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={13} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              {/* Body */}
              <p className="text-sm text-foreground-muted leading-relaxed">&ldquo;{body}&rdquo;</p>
              {/* Product tag */}
              <p className="text-xs text-primary font-medium">Re: {product}</p>
              {/* Author */}
              <div className="flex items-center gap-3 pt-1 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-foreground-muted">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
