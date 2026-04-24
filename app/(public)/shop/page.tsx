import { ShopPageClient } from "@/components/shop/ShopPageClient";

export const metadata = { title: "Shop — NexCart" };

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  return <ShopPageClient />;
}
