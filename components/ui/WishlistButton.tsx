"use client";

import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useWishlistStore } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  productSlug: string;
  className?: string;
  iconSize?: number;
  /** Stop click event propagating to parent (e.g. parent is a <Link>) */
  stopPropagation?: boolean;
}

export function WishlistButton({
  productId,
  productSlug,
  className,
  iconSize = 14,
  stopPropagation = true,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { has, add, remove } = useWishlistStore();
  const isWishlisted = has(productId);

  async function handleClick(e: React.MouseEvent) {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=/products/${productSlug}`);
      return;
    }

    if (isWishlisted) {
      remove(productId);
      toast.success("Removed from wishlist");
      fetch("/api/dashboard/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    } else {
      add(productId);
      toast.success("Saved to wishlist ❤️");
      fetch("/api/dashboard/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        isWishlisted
          ? "text-red-500 border-red-300 bg-red-50 dark:bg-red-500/10"
          : "text-foreground-muted hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-500/10",
        className
      )}
    >
      <Heart
        size={iconSize}
        className={cn(
          "transition-all duration-200",
          isWishlisted ? "fill-red-500" : ""
        )}
      />
    </button>
  );
}
