"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/catalog";
import { useShop } from "@/store/ShopContext";

export default function ProductFavoriteButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { wishlist, toggleWishlist } = useShop();
  const isFavorite = wishlist.includes(product.id);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(product.id)}
      aria-label={isFavorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`}
      aria-pressed={isFavorite}
      className={cn(
        "pointer-events-auto absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background text-neutral-700 shadow-sm transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-neutral-200 dark:hover:text-white",
        isFavorite && "text-neutral-950 dark:text-white",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} aria-hidden="true" />
    </button>
  );
}
