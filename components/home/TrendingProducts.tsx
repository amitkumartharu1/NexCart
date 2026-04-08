import Link from "next/link";
import { ArrowRight, Star, ShoppingCart } from "lucide-react";

// Placeholder products — replaced with real DB data in Phase 5
const MOCK_PRODUCTS = [
  { id: "1", name: "Wireless Pro Headphones", price: 299, comparePrice: 399, rating: 4.8, reviews: 2341, badge: "Best Seller", slug: "wireless-pro-headphones", category: "Electronics" },
  { id: "2", name: "Smart Watch Ultra", price: 449, comparePrice: 599, rating: 4.9, reviews: 1820, badge: "New", slug: "smart-watch-ultra", category: "Gadgets" },
  { id: "3", name: "Mechanical Keyboard RGB", price: 189, comparePrice: null, rating: 4.7, reviews: 3102, badge: null, slug: "mechanical-keyboard-rgb", category: "Gaming" },
  { id: "4", name: "Portable Power Station", price: 349, comparePrice: 449, rating: 4.6, reviews: 892, badge: "Sale", slug: "portable-power-station", category: "Electronics" },
  { id: "5", name: "TWS Earbuds Pro", price: 149, comparePrice: 199, rating: 4.8, reviews: 4201, badge: "Hot", slug: "tws-earbuds-pro", category: "Electronics" },
  { id: "6", name: "4K Webcam Studio", price: 219, comparePrice: null, rating: 4.5, reviews: 1103, badge: null, slug: "4k-webcam-studio", category: "Electronics" },
  { id: "7", name: "Gaming Mouse Pro", price: 89, comparePrice: 119, rating: 4.9, reviews: 5532, badge: "Best Seller", slug: "gaming-mouse-pro", category: "Gaming" },
  { id: "8", name: "Smart LED Desk Lamp", price: 79, comparePrice: 99, rating: 4.6, reviews: 788, badge: null, slug: "smart-led-desk-lamp", category: "Home & Office" },
];

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-primary/10 text-primary border-primary/20",
  "New": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Sale": "bg-red-500/10 text-red-600 border-red-500/20",
  "Hot": "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export function TrendingProducts() {
  return (
    <section className="py-20 bg-background">
      <div className="container-wide">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Trending</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Popular Right Now</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-primary transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
          {MOCK_PRODUCTS.map((product) => (
            <div key={product.id} className="group card-premium overflow-hidden hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              {/* Image placeholder */}
              <div className="relative aspect-square bg-background-muted overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-4xl text-foreground-subtle">
                  🛍
                </div>
                {/* Badge */}
                {product.badge && (
                  <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${BADGE_STYLES[product.badge]}`}>
                    {product.badge}
                  </span>
                )}
                {/* Quick add hover */}
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors">
                    <ShoppingCart size={13} /> Add to Cart
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1.5">
                <p className="text-xs text-foreground-muted">{product.category}</p>
                <Link href={`/products/${product.slug}`} className="block text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {product.name}
                </Link>
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                  <span className="text-xs text-foreground-muted">({product.reviews.toLocaleString()})</span>
                </div>
                {/* Price */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-base font-bold text-foreground">${product.price}</span>
                  {product.comparePrice && (
                    <span className="text-xs text-foreground-muted line-through">${product.comparePrice}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">View all products →</Link>
        </div>
      </div>
    </section>
  );
}
