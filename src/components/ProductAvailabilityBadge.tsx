import type { Product } from "@/data/catalog";
import { isProductInStock } from "@/lib/product-availability";
import { cn } from "@/lib/utils";

export default function ProductAvailabilityBadge({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const inStock = isProductInStock(product);

  return (
    <span
      className={cn(`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium shadow-[0_2px_8px_rgba(15,23,42,0.12)] backdrop-blur-sm ${
        inStock
          ? "border-0 bg-[#BDFCC9] text-[#228B22]"
          : "border-0 bg-[#FFCCCB] text-rose-800 dark:bg-neutral-950/85 dark:text-rose-300"
      }`, className)}
    >
      <span className={`size-1.5 rounded-full ${inStock ? "bg-[#006400]" : "bg-rose-600"}`} aria-hidden="true" />
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}
