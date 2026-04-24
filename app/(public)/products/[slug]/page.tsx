"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  ShoppingCart,
  Heart,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
  Plus,
  Sparkles,
  Tag,
  Zap,
  ShieldCheck,
  RotateCcw,
  Truck,
  X,
  ArrowRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { ProductSectionRenderer } from "@/components/product/ProductSectionRenderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

interface Variant {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  inventory: { quantity: number } | null;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  user: { name: string | null; image: string | null } | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  comparePrice: number | null;
  rating: number | null;
  reviewCount: number;
  brand: { name: string; slug: string; logo: string | null } | null;
  category: { name: string; slug: string } | null;
  images: ProductImage[];
  variants: Variant[];
  inventory: { quantity: number; lastRestockedAt: string | null } | null;
  reviews: Review[];
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  images: { url: string; altText: string | null }[];
  category: { name: string } | null;
  inventory: { quantity: number } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            i <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-foreground-subtle"
          )}
        />
      ))}
    </div>
  );
}

function StockBadge({ inventory }: { inventory: { quantity: number } | null }) {
  const qty = inventory?.quantity ?? 0;
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
        <XCircle size={12} /> Out of Stock
      </span>
    );
  if (qty <= 5)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold animate-pulse">
        <AlertTriangle size={12} /> Only {qty} left!
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
      <CheckCircle2 size={12} /> In Stock
    </span>
  );
}

// ---------------------------------------------------------------------------
// 3D Tilt Image Viewer
// ---------------------------------------------------------------------------

function TiltImageViewer({
  images,
  selectedImage,
  productName,
}: {
  images: ProductImage[];
  selectedImage: ProductImage | null;
  productName: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: y * -12, y: x * 12 });
    // Zoom lens position
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: px, y: py });
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
    setZoom(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => setZoom((z) => !z)}
      className="relative aspect-square rounded-2xl overflow-hidden bg-background-subtle border border-border cursor-zoom-in select-none"
      style={{
        transform: isHovering
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02,1.02,1.02)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
        transition: isHovering
          ? "transform 0.1s ease-out"
          : "transform 0.5s cubic-bezier(0.23,1,0.32,1)",
        transformStyle: "preserve-3d",
        boxShadow: isHovering
          ? "0 25px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.10)"
          : "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      {selectedImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.url}
            alt={selectedImage.altText ?? productName}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-transform duration-300",
              zoom && "scale-150"
            )}
            style={
              zoom
                ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                : { transformOrigin: "center" }
            }
          />
          {/* Glare overlay */}
          {isHovering && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 + tilt.x * 3}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
              }}
            />
          )}
          {/* Zoom hint */}
          {!zoom && isHovering && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2.5 py-1.5 rounded-full border border-border pointer-events-none">
              <Eye size={11} /> Click to zoom
            </div>
          )}
          {zoom && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2.5 py-1.5 rounded-full border border-border pointer-events-none">
              <Eye size={11} /> Click to reset
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl text-foreground-subtle">
          📦
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Offer Banner (fetched from siteSettings)
// ---------------------------------------------------------------------------

function ProductOfferBanner() {
  const [offer, setOffer] = useState<{
    enabled: boolean;
    title: string;
    description: string;
    badge: string;
    link: string;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: { settings: Record<string, string | null> }) => {
        const s = data.settings;
        setOffer({
          enabled: s["offer_enabled"] === "true",
          title: s["offer_title"] ?? "",
          description: s["offer_description"] ?? "",
          badge: s["offer_badge"] ?? "Limited Offer",
          link: s["offer_link"] ?? "",
        });
      })
      .catch(() => {});
  }, []);

  if (!offer || !offer.enabled || !offer.title || dismissed) return null;

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 rounded-2xl border border-primary/25 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(5,150,105,0.08) 0%, rgba(16,185,129,0.04) 100%)",
        animation: "slideDown 0.4s ease-out",
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .product-card-3d {
          transition: transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease;
        }
        .product-card-3d:hover {
          transform: translateY(-6px) scale(1.025);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .btn-primary-anim {
          position: relative;
          overflow: hidden;
        }
        .btn-primary-anim::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .btn-primary-anim:hover::after {
          transform: translateX(100%);
        }
      `}</style>

      {/* Decorative pulse */}
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Tag size={16} className="text-primary" />
        </div>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {offer.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wide">
              {offer.badge}
            </span>
          )}
          <p className="text-sm font-semibold text-foreground">{offer.title}</p>
        </div>
        {offer.description && (
          <p className="text-xs text-foreground-muted mt-0.5 truncate">{offer.description}</p>
        )}
      </div>

      {offer.link && (
        <Link
          href={offer.link}
          className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Shop <ArrowRight size={11} />
        </Link>
      )}

      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-foreground-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Related Product Card
// ---------------------------------------------------------------------------

function RelatedProductCard({ product }: { product: RelatedProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { data: session } = useSession();
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState(false);

  const basePrice = Number(product.basePrice);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const isOutOfStock = (product.inventory?.quantity ?? 0) === 0;
  const discountPct =
    comparePrice && comparePrice > basePrice
      ? Math.round(((comparePrice - basePrice) / comparePrice) * 100)
      : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/products/${product.slug}`);
      return;
    }
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      image: product.images[0]?.url ?? "/placeholder-product.png",
      price: basePrice,
      quantity: 1,
      maxQty: product.inventory?.quantity ?? 0,
      slug: product.slug,
    });
    openCart();
    toast.success(`${product.name} added to cart`);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-2xl border border-border bg-background overflow-hidden product-card-3d"
      style={{ animation: "fadeInUp 0.5s ease-out both" }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-background-subtle">
        {product.images[0]?.url ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-background-muted animate-pulse" />
            )}
            <img
              src={product.images[0].url}
              alt={product.images[0].altText ?? product.name}
              onLoad={() => setImgLoaded(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">📦</div>
        )}
        {discountPct && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            -{discountPct}%
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground-muted">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {product.category && (
          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest">
            {product.category.name}
          </p>
        )}
        <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black" style={{ color: "#dc2626" }}>{formatCurrency(basePrice)}</span>
          {comparePrice && comparePrice > basePrice && (
            <span className="text-xs font-medium line-through" style={{ color: "#9ca3af" }}>{formatCurrency(comparePrice)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={cn(
            "btn-primary-anim w-full mt-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200",
            isOutOfStock
              ? "bg-background-muted text-foreground-muted cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-0.5"
          )}
        >
          <ShoppingCart size={12} />
          {isOutOfStock ? "Unavailable" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProductPageSkeleton() {
  return (
    <div className="container-wide py-10 animate-pulse">
      <div className="h-4 bg-background-muted rounded w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-3">
          <div className="aspect-square bg-background-muted rounded-2xl" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-background-muted rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 bg-background-muted rounded w-24" />
          <div className="h-8 bg-background-muted rounded w-3/4" />
          <div className="h-4 bg-background-muted rounded w-1/3" />
          <div className="h-10 bg-background-muted rounded w-1/2" />
          <div className="h-20 bg-background-muted rounded" />
          <div className="h-12 bg-background-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trust Badges
// ---------------------------------------------------------------------------

const TRUST_BADGES = [
  { icon: Truck, label: "Free Delivery", sub: "On orders over Rs. 999" },
  { icon: RotateCcw, label: "Easy Returns", sub: "14-day return policy" },
  { icon: ShieldCheck, label: "Secure Payment", sub: "100% protected" },
  { icon: Zap, label: "Fast Dispatch", sub: "Same-day processing" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { has: inWishlist, add: addWishlist, remove: removeWishlist } = useWishlistStore();
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (res.status === 404 || !res.ok) { setNotFound(true); return; }
        const data = await res.json().catch(() => ({})) as { product?: Product };
        const p = data.product ?? null;
        setProduct(p);
        if (p?.images?.length) setSelectedImage(p.images[0]);
        // Fetch related products by category
        if (p?.category?.slug) {
          fetch(`/api/products?category=${p.category.slug}&limit=16`)
            .then((r) => r.json())
            .then((d: { products?: RelatedProduct[] }) => {
              const others = (d.products ?? []).filter((r) => r.id !== p.id);
              setRelatedProducts(others.slice(0, 8));
            })
            .catch(() => {});
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Show sticky bar when main add-to-cart button scrolls out of view
  useEffect(() => {
    const el = addToCartBtnRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [product]);

  if (loading) return <ProductPageSkeleton />;

  if (notFound || !product) {
    return (
      <div className="container-wide py-24 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Product not found</h1>
        <p className="text-foreground-muted mb-6">
          This product may have been removed or the link is incorrect.
        </p>
        <Link
          href="/shop"
          className="inline-flex px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover transition-colors"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const totalStock = product.inventory?.quantity ?? 0;
  const isOutOfStock = totalStock === 0;
  const basePrice = Number(product.basePrice);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const activePrice = selectedVariant?.price != null ? Number(selectedVariant.price) : basePrice;
  const maxQty = Math.min(totalStock, 99);
  const discountPct =
    comparePrice && comparePrice > basePrice
      ? Math.round(((comparePrice - basePrice) / comparePrice) * 100)
      : null;

  function handleAddToCart() {
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/products/${product!.slug}`);
      return;
    }
    const image = selectedImage ?? product!.images[0];
    addItem({
      productId: product!.id,
      variantId: selectedVariant?.id ?? null,
      name: product!.name + (selectedVariant ? ` — ${selectedVariant.name}` : ""),
      image: image?.url ?? "/placeholder-product.png",
      price: activePrice,
      quantity,
      maxQty,
      slug: product!.slug,
    });
    openCart();
    toast.success(`${product!.name} added to cart`);
  }

  function handleWishlist() {
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/products/${product!.slug}`);
      return;
    }
    const productId = product!.id;
    if (inWishlist(productId)) {
      removeWishlist(productId);
      toast.success("Removed from wishlist");
      fetch("/api/dashboard/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    } else {
      addWishlist(productId);
      toast.success("Saved to wishlist ❤️");
      fetch("/api/dashboard/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-wide pt-24 pb-8">

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs text-foreground-muted mb-8 flex-wrap"
          style={{ animation: "fadeInUp 0.4s ease-out" }}
        >
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          {product.category && (
            <>
              <ChevronRight size={12} className="shrink-0" />
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} className="shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Offer banner */}
        <div className="mb-6" style={{ animation: "fadeInUp 0.45s ease-out" }}>
          <ProductOfferBanner />
        </div>

        {/* Main grid */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16"
          style={{ animation: "fadeInUp 0.5s ease-out" }}
        >
          {/* ── Left — 3D Image Gallery ── */}
          <div className="space-y-4">
            <TiltImageViewer
              images={product.images}
              selectedImage={selectedImage}
              productName={product.name}
            />

            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-105",
                      selectedImage?.id === img.id
                        ? "border-primary shadow-md shadow-primary/20"
                        : "border-border hover:border-border-strong"
                    )}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <img
                      src={img.url}
                      alt={img.altText ?? product.name}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right — Product Info ── */}
          <div className="space-y-5">
            {/* Brand */}
            {product.brand && (
              <Link
                href={`/brands/${product.brand.slug}`}
                className="inline-block text-xs font-semibold text-foreground-muted uppercase tracking-widest hover:text-primary transition-colors"
              >
                {product.brand.name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating !== null && (
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} size={16} />
                <span className="text-sm font-medium text-foreground">
                  {Number(product.rating).toFixed(1)}
                </span>
                <span className="text-sm text-foreground-muted">
                  ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}

            {/* Stock */}
            <div className="flex flex-wrap gap-2">
              <StockBadge inventory={product.inventory} />
              {product.inventory?.lastRestockedAt &&
                Date.now() - new Date(product.inventory.lastRestockedAt).getTime() <
                  7 * 86400000 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Sparkles size={12} /> Recently Restocked
                  </span>
                )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-black" style={{ color: "#dc2626" }}>
                {formatCurrency(activePrice)}
              </span>
              {comparePrice && comparePrice > basePrice && (
                <span className="text-xl font-medium line-through" style={{ color: "#9ca3af" }}>
                  {formatCurrency(comparePrice)}
                </span>
              )}
              {discountPct && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #dc2626, #ef4444)",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.35)",
                  }}
                >
                  <Zap size={11} /> {discountPct}% OFF
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-primary/30 pl-3">
                {product.shortDescription}
              </p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">
                  Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const variantStock = variant.inventory?.quantity ?? 0;
                    const isUnavailable = variantStock === 0;
                    const vPrice = variant.price != null ? Number(variant.price) : null;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={isUnavailable}
                        className={cn(
                          "px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
                          isUnavailable && "opacity-40 cursor-not-allowed line-through",
                          selectedVariant?.id === variant.id
                            ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20 scale-105"
                            : "border-border text-foreground hover:border-border-strong hover:scale-105"
                        )}
                      >
                        {variant.name}
                        {vPrice !== null && vPrice !== basePrice && (
                          <span className="ml-1 text-xs text-foreground-muted">
                            (+{formatCurrency(vPrice - basePrice)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-widest mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-background-subtle disabled:opacity-40 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-foreground">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-background-subtle disabled:opacity-40 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {!isOutOfStock && (
                  <span className="text-xs text-foreground-muted">
                    {totalStock} available
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                ref={addToCartBtnRef}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "btn-primary-anim flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
                  isOutOfStock
                    ? "bg-background-muted text-foreground-muted cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25"
                )}
              >
                <ShoppingCart size={16} />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={handleWishlist}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-xl border transition-all duration-200 hover:scale-110",
                  inWishlist(product.id)
                    ? "border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/40"
                    : "border-border text-foreground-muted hover:border-rose-300 hover:text-rose-400"
                )}
                aria-label={inWishlist(product.id) ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart size={16} className={cn(inWishlist(product.id) && "fill-rose-500 text-rose-500")} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background-subtle border border-border/50"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-[10px] text-foreground-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs: Description / Reviews ── */}
        <div className="mt-14 border-t border-border pt-10">
          <div className="flex gap-1 border-b border-border mb-8">
            {(["description", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-2.5 text-sm font-semibold capitalize transition-all duration-200 border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                )}
              >
                {tab === "reviews"
                  ? `Reviews (${product.reviews.length})`
                  : "Description"}
              </button>
            ))}
          </div>

          {activeTab === "description" && product.description && (
            <div
              className="prose prose-sm max-w-none text-foreground-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {activeTab === "description" && !product.description && (
            <p className="text-foreground-muted text-sm">No description available.</p>
          )}

          {activeTab === "reviews" && (
            <>
              {product.reviews.length === 0 ? (
                <p className="text-foreground-muted text-sm">
                  No reviews yet. Be the first to review this product!
                </p>
              ) : (
                <div className="space-y-5">
                  {product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-5 rounded-2xl border border-border bg-background-subtle space-y-2"
                      style={{ animation: "fadeInUp 0.4s ease-out" }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {review.user?.image ? (
                            <img
                              src={review.user.image}
                              alt={review.user.name ?? "User"}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                              {(review.user?.name ?? "U")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {review.user?.name ?? "Anonymous"}
                            </p>
                            <p className="text-xs text-foreground-muted">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size={13} />
                      </div>
                      {review.title && (
                        <p className="text-sm font-semibold text-foreground">{review.title}</p>
                      )}
                      {review.body && (
                        <p className="text-sm text-foreground-muted leading-relaxed">{review.body}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 3D/4D Visual Story Sections ── */}
        <ProductSectionRenderer
          productSlug={slug}
          productId={product.id}
          productName={product.name}
          basePrice={basePrice}
          comparePrice={comparePrice}
        />

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
                  You may also like
                </p>
                <h2 className="text-xl font-bold text-foreground">Related Products</h2>
              </div>
              {product.category && (
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  View all <ArrowRight size={14} />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((rp, idx) => (
                <div
                  key={rp.id}
                  style={{ animationDelay: `${idx * 80}ms`, animation: "fadeInUp 0.5s ease-out both" }}
                >
                  <RelatedProductCard product={rp} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Sticky Add to Cart bar ── */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 transition-all duration-300",
          showStickyBar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        }}
      >
        <div className="container-wide py-3 flex items-center gap-4">
          {/* Product name + price */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black" style={{ color: "#dc2626" }}>{formatCurrency(activePrice)}</span>
              {comparePrice && comparePrice > basePrice && (
                <span className="text-xs line-through" style={{ color: "#9ca3af" }}>{formatCurrency(comparePrice)}</span>
              )}
            </div>
          </div>
          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              isOutOfStock
                ? "bg-background-muted text-foreground-muted cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-lg"
            )}
          >
            <ShoppingCart size={15} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
