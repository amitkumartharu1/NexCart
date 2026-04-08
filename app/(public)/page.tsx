import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedCategories } from "@/components/home/FeaturedCategories";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { FeaturedServices } from "@/components/home/FeaturedServices";
import { WhyNexCart } from "@/components/home/WhyNexCart";
import { Testimonials } from "@/components/home/Testimonials";
import { NewsletterSection } from "@/components/home/NewsletterSection";

export const metadata: Metadata = {
  title: "NexCart — Smart Shopping. Modern Services.",
  description:
    "Your premium destination for electronics, gadgets, fashion and professional services. Smart Shopping. Modern Services. One Platform.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedCategories />
      <TrendingProducts />
      <FeaturedServices />
      <WhyNexCart />
      <Testimonials />
      <NewsletterSection />
    </div>
  );
}
